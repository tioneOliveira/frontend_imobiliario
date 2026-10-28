import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "@prometheus-io/client";
/** @param {(record:any)=>void} sink */
export function createTelemetry(
  sink = (record) => console.log(JSON.stringify(record)),
) {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "frontend_" });
  const labels = ["route", "method", "outcome", "status"];
  const requests = new Counter({
    name: "frontend_upstream_requests_total",
    help: "Consultas ao serviço do modelo",
    labelNames: labels,
    registers: [registry],
  });
  const duration = new Histogram({
    name: "frontend_upstream_duration_seconds",
    help: "Duração das consultas ao modelo",
    labelNames: labels,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 4, 5, 10, 13, 15],
    registers: [registry],
  });
  const inflight = new Gauge({
    name: "frontend_upstream_inflight",
    help: "Consultas em andamento",
    registers: [registry],
  });
  const ready = new Gauge({
    name: "frontend_ready",
    help: "Prontidão local",
    registers: [registry],
  });
  return { registry, requests, duration, inflight, ready, log: sink };
}
