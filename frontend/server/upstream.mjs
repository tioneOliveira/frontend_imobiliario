import { HttpError, upstreamError } from "./errors.mjs";
import { performance } from "node:perf_hooks";
import { validModel, validPrediction, nonempty } from "../shared/wire.mjs";
const ALLOWED = new Map([
  ["/health/live", "GET"],
  ["/health/ready", "GET"],
  ["/v1/model", "GET"],
  ["/v1/predictions", "POST"],
]);
/** @param {any} config @param {any} telemetry @param {string} path @param {any} options */
export async function requestUpstream(config, telemetry, path, options = {}) {
  const method = ALLOWED.get(path);
  if (!method)
    throw new HttpError(404, "route_not_found", "Consulta não encontrada.");
  const controller = new AbortController();
  const signal = options.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;
  const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs);
  const start = performance.now();
  let status = 502,
    outcome = "unreachable",
    remoteId,
    modelVersion;
  telemetry.inflight.inc();
  try {
    const response = await fetch(config.origin + path, {
      method,
      headers: {
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(options.body) : undefined,
      signal,
      redirect: "manual",
    });
    status = response.status;
    const chunks = [];
    let size = 0;
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new HttpError(
        502,
        "invalid_upstream_response",
        "O serviço retornou uma resposta inesperada.",
      );
    if (response.body) {
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > config.maxResponse) {
          controller.abort();
          throw new HttpError(
            502,
            "invalid_upstream_response",
            "A resposta do serviço excedeu o limite esperado.",
          );
        }
        chunks.push(chunk);
      }
    }
    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new HttpError(
        502,
        "invalid_upstream_response",
        "O serviço retornou uma resposta inesperada.",
      );
    }
    remoteId =
      typeof payload?.request_id === "string" ? payload.request_id : undefined;
    modelVersion =
      typeof payload?.model_version === "string"
        ? payload.model_version.slice(0, 120)
        : undefined;
    if (!response.ok)
      throw upstreamError(status, payload, response.headers.get("retry-after"));
    const valid =
      path === "/v1/predictions"
        ? validPrediction(payload)
        : path === "/v1/model"
          ? validModel(payload)
          : path === "/health/ready"
            ? payload?.status === "ready" &&
              nonempty(payload.model_version) &&
              nonempty(payload.environment_version)
            : payload?.status === "alive";
    if (!valid)
      throw new HttpError(
        502,
        "invalid_upstream_response",
        "O serviço retornou dados incompletos.",
      );
    outcome = "success";
    return payload;
  } catch (error) {
    if (error instanceof HttpError) {
      status = error.status;
      outcome = error.code;
      throw error;
    }
    if (controller.signal.aborted) {
      status = 504;
      outcome = "timeout";
      throw new HttpError(
        504,
        "upstream_timeout",
        "A consulta demorou mais que o esperado. Tente novamente.",
      );
    }
    if (options.signal?.aborted) {
      status = 499;
      outcome = "cancelled";
      throw new HttpError(499, "invalid_request", "Consulta cancelada.");
    }
    throw new HttpError(
      502,
      "upstream_unreachable",
      "Não foi possível acessar o modelo. Tente novamente.",
    );
  } finally {
    clearTimeout(timer);
    telemetry.inflight.dec();
    const seconds = (performance.now() - start) / 1000,
      labels = { route: path, method, outcome, status: String(status) };
    telemetry.requests.inc(labels);
    telemetry.duration.observe(labels, seconds);
    telemetry.log({
      timestamp: new Date().toISOString(),
      level: status >= 500 ? "error" : "info",
      build_id: config.buildId,
      frontend_request_id: options.requestId,
      request_id: remoteId,
      model_version: modelVersion,
      route: path,
      status,
      duration_ms: Math.round(seconds * 1000),
    });
  }
}
