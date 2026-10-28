import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validConfig, validModel, validPrediction } from "../shared/wire.mjs";
const canonical = {
  MedInc: 8.3252,
  HouseAge: 41,
  AveRooms: 6.9841,
  AveBedrms: 1.0238,
  Population: 322,
  AveOccup: 2.5556,
  Latitude: 37.88,
  Longitude: -122.23,
};
/** @param {string} base @param {typeof fetch} request */
export async function runSmoke(base, request = fetch) {
  const origin = new URL(base);
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    !["http:", "https:"].includes(origin.protocol)
  )
    throw new Error("Informe uma origem HTTP/HTTPS válida.");
  const start = Date.now();
  /** @param {string} path @param {RequestInit} options */
  const get = async (path, options = {}) => {
    const response = await request(new URL(path, origin), {
      ...options,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error("Smoke falhou em " + path + ": HTTP " + response.status);
    return response.json();
  };
  const config = await get("/api/config");
  if (!validConfig(config)) throw new Error("Configuração pública inválida.");
  const readiness = await get("/api/health/ready");
  if (readiness.status !== "ready") throw new Error("Modelo indisponível.");
  const model = await get("/api/v1/model");
  if (!validModel(model)) throw new Error("Metadados inválidos.");
  const prediction = await get("/api/v1/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instances: [canonical] }),
  });
  if (!validPrediction(prediction) || prediction.predictions[0] < 0)
    throw new Error("Previsão inválida.");
  const usd = prediction.predictions[0] * config.prediction_multiplier;
  if (!Number.isFinite(usd)) throw new Error("Conversão inválida.");
  return {
    status: "passed",
    observed_at: new Date().toISOString(),
    model_version: prediction.model_version,
    request_id: prediction.request_id,
    unit: config.prediction_unit,
    raw_prediction: prediction.predictions[0],
    value_usd: usd,
    duration_ms: Date.now() - start,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let base, output;
  for (let index = 0; index < args.length; index += 2) {
    if (args[index] === "--base-url") base = args[index + 1];
    else if (args[index] === "--output") output = args[index + 1];
    else throw new Error("Argumento desconhecido. Use --base-url e --output.");
  }
  if (!base)
    throw new Error("Informe --base-url com a URL do frontend implantado.");
  let report;
  try {
    report = await runSmoke(base);
  } catch (error) {
    report = {
      status: "failed",
      observed_at: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Falha de integração.",
    };
    process.exitCode = 1;
  }
  if (output) {
    const path = resolve(output);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(report));
}
