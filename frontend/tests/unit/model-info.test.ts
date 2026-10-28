import { describe, it, expect } from "vitest";
import { validModel, validConfig } from "../../shared/wire.mjs";
import { model } from "../fixtures/upstream.mjs";
describe("metadados", () => {
  it("aceita R² negativo e rejeita métricas não finitas", () => {
    expect(
      validModel({ ...model, metrics: { ...model.metrics, r2: -0.5 } }),
    ).toBeTruthy();
    expect(
      validModel({ ...model, metrics: { ...model.metrics, mae: Infinity } }),
    ).toBeFalsy();
    expect(validModel({ ...model, dataset_checksum: "bad" })).toBeFalsy();
  });
  it("não permite combinações incoerentes de unidade", () => {
    expect(
      validConfig({
        locale: "pt-BR",
        currency: "USD",
        time_zone: "America/Sao_Paulo",
        prediction_unit: "usd",
        prediction_multiplier: 100000,
        dataset_reference: "test",
      }),
    ).toBeFalsy();
  });
});
