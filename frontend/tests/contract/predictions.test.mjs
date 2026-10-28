// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApplication } from "../../server/app.mjs";
import { loadConfig } from "../../server/config.mjs";
import { createTelemetry } from "../../server/observability.mjs";
import { startUpstream, canonical } from "../fixtures/upstream.mjs";
/** @type {any} */ let upstream;
/** @type {any} */ let app;
/** @type {string} */ let base;
/** @type {any[]} */ const logs = [];
beforeAll(async () => {
  upstream = await startUpstream();
  const config = {
    ...loadConfig({
      NODE_ENV: "test",
      UPSTREAM_API_ORIGIN: upstream.origin,
      PREDICTION_UNIT: "california-housing-100k-usd",
    }),
    upstreamTimeoutMs: 60,
  };
  app = createApplication(config, {
    telemetry: createTelemetry((record) => logs.push(record)),
  });
  await new Promise((resolve) => {
    app.server.listen(0, "127.0.0.1", () => resolve(undefined));
  });
  base = "http://127.0.0.1:" + app.server.address().port;
});
beforeEach(() => {
  upstream.setControl({
    status: 200,
    delay: 0,
    format: "custom",
    metadataStatus: 200,
  });
  upstream.calls.length = 0;
});
afterAll(async () => {
  app.server.closeAllConnections();
  await new Promise((resolve) => app.server.close(resolve));
  await upstream.close();
});
/** @param {any} body @param {any} extra */
const post = (body = { instances: [canonical] }, extra = {}) =>
  fetch(base + "/api/v1/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...extra,
  });
describe("superfície de mesma origem", () => {
  it("configuração e saúde local não chamam upstream", async () => {
    expect(
      (await (await fetch(base + "/api/config")).json()).prediction_multiplier,
    ).toBe(100000);
    expect((await fetch(base + "/healthz")).status).toBe(200);
    expect(upstream.calls).toHaveLength(0);
  });
  it("encaminha uma instância, sem multiplicar e sem vazar cookies", async () => {
    const response = await post(undefined, {
      headers: {
        "Content-Type": "application/json",
        Cookie: "secret=1",
        Authorization: "secret",
      },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-frontend-request-id")).toBeTruthy();
    expect((await response.json()).predictions).toEqual([canonical.MedInc / 2]);
    expect(upstream.calls[0].body.instances).toEqual([canonical]);
    expect(upstream.calls[0].headers.cookie).toBeUndefined();
    expect(upstream.calls[0].headers.authorization).toBeUndefined();
  });
  it.each([
    { instances: [] },
    { instances: [canonical, canonical] },
    { instances: [{ ...canonical, extra: 1 }] },
    { instances: [{ ...canonical, AveRooms: 0 }] },
    { instances: [{ ...canonical, Latitude: 91 }] },
  ])("rejeita perfil fora do contrato antes de chamar a rede", async (body) => {
    expect((await post(body)).status).toBe(422);
    expect(upstream.calls).toHaveLength(0);
  });
  it("rejeita JSON inválido, tipo incorreto e corpo excessivo", async () => {
    expect((await post(undefined, { body: "{bad" })).status).toBe(400);
    expect(
      (await post(undefined, { headers: { "Content-Type": "text/plain" } }))
        .status,
    ).toBe(415);
    expect((await post(undefined, { body: " ".repeat(17000) })).status).toBe(
      413,
    );
    expect(upstream.calls).toHaveLength(0);
  });
  it("rejeita origem externa, query e rota genérica", async () => {
    expect(
      (
        await post(undefined, {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://evil.example",
          },
        })
      ).status,
    ).toBe(403);
    expect(
      (await fetch(base + "/api/config?url=http://evil.example")).status,
    ).toBe(400);
    expect((await fetch(base + "/api/unknown")).status).toBe(404);
    expect((await fetch(base + "/api/v1/predictions")).status).toBe(405);
    expect((await fetch(base + "/metrics")).status).toBe(404);
  });
  it.each(["custom", "detail"])(
    "normaliza erro 422 %s sem ecoar o texto bruto",
    async (format) => {
      upstream.setControl({ status: 422, format });
      const response = await post(),
        body = await response.json();
      expect(response.status).toBe(422);
      expect(body.issues[0].field).toBe("MedInc");
      expect(JSON.stringify(body)).not.toContain("secret");
    },
  );
  it("preserva 429 e Retry-After sem repetir", async () => {
    upstream.setControl({ status: 429 });
    const response = await post();
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("1");
    expect(upstream.calls).toHaveLength(1);
  });
  it("mantém /healthz disponível com modelo indisponível", async () => {
    upstream.setControl({ status: 503 });
    expect((await post()).status).toBe(503);
    expect((await fetch(base + "/healthz")).status).toBe(200);
  });
  it.each(["html", "oversized"])(
    "rejeita resposta inesperada %s",
    async (format) => {
      upstream.setControl({ format });
      expect((await post()).status).toBe(502);
    },
  );
  it("encerra upstream atrasado sem retentativa", async () => {
    upstream.setControl({ delay: 150 });
    expect((await post()).status).toBe(504);
    expect(upstream.calls).toHaveLength(1);
  });
  it("expõe metadados válidos, logs e métricas sem conteúdo do formulário", async () => {
    expect((await fetch(base + "/api/v1/model")).status).toBe(200);
    await post();
    const text = JSON.stringify(logs);
    expect(text).not.toContain("MedInc");
    expect(text).not.toContain("8.3252");
    expect(text).toContain("frontend_request_id");
    const metrics = await app.telemetry.registry.metrics();
    expect(metrics).toContain("frontend_upstream_requests_total");
    expect(metrics).toContain("frontend_upstream_duration_seconds");
  });
  it("falha para origem/unidade inseguras", () => {
    expect(() =>
      loadConfig({
        UPSTREAM_API_ORIGIN: "http://evil.example",
        PREDICTION_UNIT: "usd",
      }),
    ).toThrow();
    expect(() =>
      loadConfig({ UPSTREAM_API_ORIGIN: "https://other.example" }),
    ).toThrow();
  });
});
