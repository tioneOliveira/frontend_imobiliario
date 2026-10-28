export const DEFAULT_ORIGIN =
  "https://houseprice-1793126048-13837.northcentralus.cloudapp.azure.com";
/** @param {Record<string,string|undefined>} env @param {boolean} dev */
export function loadConfig(env = process.env, dev = false) {
  const origin = new URL(env.UPSTREAM_API_ORIGIN || DEFAULT_ORIGIN);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(
    origin.hostname,
  );
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    (origin.protocol !== "https:" &&
      !(env.NODE_ENV === "test" && loopback && origin.protocol === "http:"))
  )
    throw new Error("UPSTREAM_API_ORIGIN deve ser uma origem HTTPS válida.");
  const unit =
    env.PREDICTION_UNIT ||
    (origin.origin === DEFAULT_ORIGIN
      ? "california-housing-100k-usd"
      : undefined);
  if (unit !== "usd" && unit !== "california-housing-100k-usd")
    throw new Error("Defina PREDICTION_UNIT explicitamente para esta origem.");
  const dataset = env.DATASET_REFERENCE || "sklearn-california-housing-v1";
  if (!dataset.trim()) throw new Error("DATASET_REFERENCE não pode ser vazia.");
  /** @param {string|undefined} value @param {number} fallback */
  const port = (value, fallback) => {
    const n = value === undefined ? fallback : Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 65535)
      throw new Error("Porta inválida.");
    return n;
  };
  return {
    origin: origin.origin,
    dev,
    host: env.HOST || (dev ? "127.0.0.1" : "0.0.0.0"),
    port: port(env.PORT, dev ? 5173 : 8080),
    metricsHost: env.METRICS_HOST || "127.0.0.1",
    metricsPort: port(env.METRICS_PORT, 9464),
    upstreamTimeoutMs: 13000,
    maxBody: 16384,
    maxResponse: 262144,
    version: env.APP_VERSION || "1.0.0",
    buildId: env.BUILD_ID || "source",
    public: {
      locale: "pt-BR",
      currency: "USD",
      time_zone: "America/Sao_Paulo",
      prediction_unit: unit,
      prediction_multiplier: unit === "usd" ? 1 : 100000,
      dataset_reference: dataset,
    },
  };
}
