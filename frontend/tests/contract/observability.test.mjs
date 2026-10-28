// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import YAML from "yaml";
import { createTelemetry } from "../../server/observability.mjs";
describe("observabilidade", () => {
  it("expõe histograma e regras com limites definidos", async () => {
    const metrics = createTelemetry(() => {});
    metrics.duration.observe(
      {
        route: "/v1/predictions",
        method: "POST",
        outcome: "success",
        status: "200",
      },
      0.1,
    );
    expect(await metrics.registry.metrics()).toContain('le="13"');
    const rules = YAML.parse(
      await readFile(
        new URL("../../observability/prometheus-rules.yml", import.meta.url),
        "utf8",
      ),
    );
    expect(rules.groups[0].rules).toHaveLength(2);
    expect(rules.groups[0].rules[1].expr).toContain(">= 20");
    expect(rules.groups[0].rules[1].for).toBe("5m");
  });
});
