import http from "node:http";
import { randomUUID } from "node:crypto";
export const canonical = {
  MedInc: 8.3252,
  HouseAge: 41,
  AveRooms: 6.9841,
  AveBedrms: 1.0238,
  Population: 322,
  AveOccup: 2.5556,
  Latitude: 37.88,
  Longitude: -122.23,
};
export const model = {
  model_version: "fixture-v1",
  environment_version: "test",
  mlflow_run_id: "fixture-run",
  training_run_id: "12345678-1234-4123-8123-123456789012",
  candidate_family: "random_forest",
  dataset_version: "sklearn-california-housing-v1",
  dataset_checksum:
    "8cd1f24964ff8b0decda0a7a2d2c4902e5cdaeb6a880a608e739390754891fe5",
  trained_at: "2026-10-27T12:00:00Z",
  metrics: { mae: 0.3, mse: 0.25, rmse: 0.5, r2: 0.8 },
};
/** @param {any} options */
export async function startUpstream(options = {}) {
  /** @type {any[]} */ const calls = [];
  let control = {
    status: 200,
    delay: 0,
    format: "custom",
    metadataStatus: 200,
    version: "fixture-v1",
    prediction: null,
    ...options,
  };
  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    if (req.url === "/__test/control") {
      control = {
        status: 200,
        delay: 0,
        format: "custom",
        metadataStatus: 200,
        version: "fixture-v1",
        prediction: null,
        ...JSON.parse(raw || "{}"),
      };
      res.writeHead(200, { "Content-Type": "application/json" }).end("{}");
      return;
    }
    calls.push({
      method: req.method,
      path: req.url,
      body: raw ? JSON.parse(raw) : undefined,
      headers: req.headers,
    });
    if (control.delay)
      await new Promise((resolve) => setTimeout(resolve, control.delay));
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/v1/model") {
      res
        .writeHead(control.metadataStatus)
        .end(JSON.stringify({ ...model, model_version: control.version }));
      return;
    }
    if (req.url === "/health/ready") {
      res.end(
        JSON.stringify({
          status: "ready",
          model_version: control.version,
          environment_version: "test",
        }),
      );
      return;
    }
    if (req.url === "/health/live") {
      res.end('{"status":"alive"}');
      return;
    }
    if (control.status !== 200) {
      res.setHeader("Retry-After", "1");
      res
        .writeHead(control.status)
        .end(
          JSON.stringify(
            control.format === "detail"
              ? {
                  detail: [
                    {
                      loc: ["body", "instances", 0, "MedInc"],
                      msg: "secret raw error",
                      type: "bad",
                    },
                  ],
                }
              : {
                  code: "validation_error",
                  message: "secret raw error",
                  request_id: randomUUID(),
                  issues: [
                    {
                      location: ["body", "instances", 0, "MedInc"],
                      message: "secret raw error",
                      type: "bad",
                    },
                  ],
                },
          ),
        );
      return;
    }
    if (control.format === "html") {
      res.setHeader("Content-Type", "text/html");
      res.end("<h1>Error</h1>");
      return;
    }
    if (control.format === "oversized") {
      res.end(JSON.stringify({ data: "x".repeat(300000) }));
      return;
    }
    res.end(
      JSON.stringify({
        predictions: [
          control.prediction ?? Number(JSON.parse(raw).instances[0].MedInc) / 2,
        ],
        environment_version: "test",
        model_version: control.version,
        mlflow_run_id: "fixture-run",
        request_id: randomUUID(),
      }),
    );
  });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(undefined));
  });
  const address = /** @type {import('node:net').AddressInfo} */ (
    server.address()
  );
  return {
    server,
    origin: "http://127.0.0.1:" + address.port,
    calls,
    /** @param {any} update */ setControl(update) {
      control = { ...control, ...update };
    },
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
