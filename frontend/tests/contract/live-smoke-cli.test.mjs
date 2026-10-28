// @vitest-environment node
import { it, expect } from "vitest";
import { runSmoke } from "../../scripts/live-smoke.mjs";
import { model } from "../fixtures/upstream.mjs";
it("o smoke usa um POST e não exige preço histórico", async () => {
  /** @type {any[]} */ const calls = [];
  /** @type {typeof fetch} */ const request = async (input, options) => {
    const path = new URL(String(input)).pathname;
    calls.push({ path, method: options?.method || "GET" });
    const payload =
      path === "/api/config"
        ? {
            locale: "pt-BR",
            currency: "USD",
            time_zone: "America/Sao_Paulo",
            prediction_unit: "usd",
            prediction_multiplier: 1,
            dataset_reference: "test",
          }
        : path === "/api/v1/model"
          ? model
          : path === "/api/health/ready"
            ? { status: "ready" }
            : {
                predictions: [100000],
                model_version: "new-version",
                environment_version: "test",
                mlflow_run_id: "run",
                request_id: "12345678-1234-4123-8123-123456789012",
              };
    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
  };
  const report = await runSmoke("https://frontend.example", request);
  expect(report.value_usd).toBe(100000);
  expect(calls.filter((call) => call.method === "POST")).toHaveLength(1);
});
