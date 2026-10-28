import http from "node:http";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.mjs";
import { createApplication } from "./app.mjs";
const dev = process.argv.includes("--dev"),
  config = loadConfig(process.env, dev);
const { server, telemetry } = createApplication(config);
if (dev) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: fileURLToPath(new URL("../", import.meta.url)),
    appType: "spa",
    server: { middlewareMode: { server } },
  });
  server.removeAllListeners("request");
  const development = createApplication(config, {
    telemetry,
    devMiddleware: vite.middlewares,
  });
  server.on(
    "request",
    /** @type {any} */ (development.server.listeners("request")[0]),
  );
}
const metrics = http.createServer(async (req, res) => {
  if (req.url !== "/metrics" || req.method !== "GET") {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": telemetry.registry.contentType });
  res.end(await telemetry.registry.metrics());
});
server.listen(config.port, config.host, () => {
  telemetry.ready.set(1);
  console.log(
    JSON.stringify({
      level: "info",
      event: "frontend_started",
      port: config.port,
      version: config.version,
      build_id: config.buildId,
    }),
  );
});
metrics.listen(config.metricsPort, config.metricsHost);
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  telemetry.ready.set(0);
  metrics.close();
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 14000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
