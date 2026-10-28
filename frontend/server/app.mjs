import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { HttpError } from "./errors.mjs";
import { createTelemetry } from "./observability.mjs";
import { requestUpstream } from "./upstream.mjs";
import { validatePredictionBody } from "./routes/predictions.mjs";
import { AUXILIARY_ROUTES } from "./routes/model-status.mjs";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
/** @param {import('node:http').ServerResponse} res @param {number} status @param {any} body */
function json(res, status, body) {
  if (res.destroyed) return;
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}
/** @param {import('node:http').IncomingMessage} req @param {number} limit */
function readJson(req, limit) {
  return new Promise((accept, reject) => {
    /** @type {Buffer[]} */ const chunks = [];
    let size = 0,
      failed = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        if (!failed)
          reject(
            new HttpError(
              413,
              "payload_too_large",
              "O perfil enviado excedeu o limite permitido.",
            ),
          );
        failed = true;
      } else if (!failed) chunks.push(chunk);
    });
    req.on("end", () => {
      if (failed) return;
      try {
        accept(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(
          new HttpError(
            400,
            "invalid_json",
            "Os dados enviados não são válidos.",
          ),
        );
      }
    });
    req.on("aborted", () =>
      reject(new HttpError(400, "invalid_request", "Consulta cancelada.")),
    );
    req.on("error", reject);
  });
}
/** @param {any} config @param {any} options */
export function createApplication(config, options = {}) {
  const telemetry = options.telemetry || createTelemetry();
  const dist = resolve(options.distDir || resolve(ROOT, "dist"));
  const server = http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader("X-Frontend-Request-Id", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    const controller = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });
    try {
      const url = new URL(req.url || "/", "http://frontend.invalid"),
        path = url.pathname;
      if (path === "/healthz") {
        if (req.method !== "GET") {
          res.setHeader("Allow", "GET");
          throw new HttpError(
            405,
            "method_not_allowed",
            "Método não permitido.",
          );
        }
        return json(res, 200, {
          status: "ok",
          service: "house-price-frontend",
          version: config.version,
          build_id: config.buildId,
        });
      }
      if (path.startsWith("/api/")) {
        if (url.search)
          throw new HttpError(
            400,
            "invalid_request",
            "Parâmetros adicionais não são permitidos.",
          );
        const remote = path.slice(4);
        const method =
          path === "/api/config" || AUXILIARY_ROUTES.has(remote)
            ? "GET"
            : remote === "/v1/predictions"
              ? "POST"
              : null;
        if (!method)
          throw new HttpError(
            404,
            "route_not_found",
            "Consulta não encontrada.",
          );
        if (req.method !== method) {
          res.setHeader("Allow", method);
          throw new HttpError(
            405,
            "method_not_allowed",
            "Método não permitido.",
          );
        }
        if (path === "/api/config") return json(res, 200, config.public);
        let body;
        if (method === "POST") {
          if (req.headers.origin) {
            let host;
            try {
              host = new URL(req.headers.origin).host;
            } catch {
              throw new HttpError(
                403,
                "forbidden_origin",
                "Origem não permitida.",
              );
            }
            if (host !== req.headers.host)
              throw new HttpError(
                403,
                "forbidden_origin",
                "Origem não permitida.",
              );
          }
          if (
            req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !==
            "application/json"
          )
            throw new HttpError(
              415,
              "unsupported_media_type",
              "Envie os dados no formato JSON.",
            );
          body = validatePredictionBody(await readJson(req, config.maxBody));
        }
        return json(
          res,
          200,
          await requestUpstream(config, telemetry, remote, {
            body,
            signal: controller.signal,
            requestId,
          }),
        );
      }
      if (path === "/metrics" || path.startsWith("/."))
        throw new HttpError(404, "route_not_found", "Página não encontrada.");
      if (options.devMiddleware)
        return options.devMiddleware(req, res, () =>
          json(res, 404, { message: "Página não encontrada." }),
        );
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD");
        throw new HttpError(405, "method_not_allowed", "Método não permitido.");
      }
      if (
        path !== "/" &&
        path !== "/index.html" &&
        path !== "/favicon.svg" &&
        !path.startsWith("/assets/")
      )
        throw new HttpError(404, "route_not_found", "Página não encontrada.");
      const target = resolve(
        dist,
        "." + decodeURIComponent(path === "/" ? "/index.html" : path),
      );
      if (!target.startsWith(dist + sep))
        throw new HttpError(404, "route_not_found", "Página não encontrada.");
      let bytes;
      try {
        bytes = await readFile(target);
      } catch {
        throw new HttpError(404, "route_not_found", "Página não encontrada.");
      }
      const mime =
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".woff2": "font/woff2",
        }[extname(target)] || "application/octet-stream";
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
      );
      res.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control": path.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.retryAfter) res.setHeader("Retry-After", error.retryAfter);
        json(res, error.status, error.body(requestId));
      } else
        json(
          res,
          500,
          new HttpError(
            500,
            "upstream_error",
            "Não foi possível concluir a solicitação.",
          ).body(requestId),
        );
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 15000;
  return { server, telemetry };
}
