import { mkdir, writeFile } from "node:fs/promises";
import { loadConfig } from "../../server/config.mjs";
import { createApplication } from "../../server/app.mjs";
import { startUpstream } from "./upstream.mjs";
const upstream = await startUpstream();
await mkdir(new URL("../../artifacts/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../../artifacts/test-control.json", import.meta.url),
  JSON.stringify({ origin: upstream.origin }),
);
const config = loadConfig({
  ...process.env,
  NODE_ENV: "test",
  UPSTREAM_API_ORIGIN: upstream.origin,
  PREDICTION_UNIT: "california-housing-100k-usd",
  PORT: process.env.PORT || "5173",
  HOST: "127.0.0.1",
});
const { server } = createApplication(config);
server.listen(config.port, config.host);
function stop() {
  server.closeAllConnections();
  server.close(() => process.exit(0));
  upstream.close();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
