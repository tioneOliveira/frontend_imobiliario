import { describe, it, expect } from "vitest";
import { parseDraft } from "../../src/domain/decimal";
import { createAnalysis } from "../../src/domain/analysis";
import { initialState, reducer } from "../../src/domain/reducer";
import { compareAnalyses } from "../../src/domain/comparison";
import { EXAMPLE } from "../../src/features/simulation/example";
const config = {
  locale: "pt-BR",
  currency: "USD",
  time_zone: "America/Sao_Paulo",
  prediction_unit: "california-housing-100k-usd",
  prediction_multiplier: 100000,
  dataset_reference: "test",
} as const;
const response = {
  predictions: [2.5],
  request_id: "12345678-1234-4123-8123-123456789012",
  model_version: "v1",
  environment_version: "test",
  mlflow_run_id: "run",
};
describe("perfil e estimativa", () => {
  it("preserva decimais e valida os limites", () => {
    const draft = Object.fromEntries(
      Object.entries(EXAMPLE).map(([key, value]) => [
        key,
        String(value).replace(".", ","),
      ]),
    );
    expect(parseDraft(draft).profile).toEqual(EXAMPLE);
    expect(
      parseDraft({ ...draft, AveRooms: "0" }).errors.AveRooms,
    ).toBeTruthy();
    expect(
      parseDraft({ ...draft, Latitude: "90", Longitude: "-180" }).profile,
    ).toBeTruthy();
    for (const value of ["", " ", "1e3", "1,234.5", "Infinity"])
      expect(
        parseDraft({ ...draft, MedInc: value }).errors.MedInc,
      ).toBeTruthy();
  });
  it("aplica a unidade uma vez e guarda cópia do perfil", () => {
    const p = { ...EXAMPLE };
    const analysis = createAnalysis(response, p, config, 1);
    p.MedInc = 0;
    expect(analysis.valueUsd).toBe(250000);
    expect(analysis.profile.MedInc).toBe(EXAMPLE.MedInc);
    expect(
      createAnalysis(
        response,
        p,
        { ...config, prediction_unit: "usd", prediction_multiplier: 1 },
        1,
      ).valueUsd,
    ).toBe(2.5);
    expect(() =>
      createAnalysis({ ...response, predictions: [-1] }, p, config, 1),
    ).toThrow();
  });
  it("limita histórico, deduplica ids e ignora token antigo", () => {
    let state = initialState();
    for (let i = 0; i < 11; i++) {
      state = reducer(state, {
        type: "start",
        request: {
          token: i,
          submittedProfile: EXAMPLE,
          submittedRevision: 0,
          startedAt: new Date().toISOString(),
        },
      });
      state = reducer(state, {
        type: "success",
        token: i,
        analysis: {
          ...createAnalysis(response, EXAMPLE, config, 0),
          id: String(i),
        },
      });
    }
    expect(state.history).toHaveLength(10);
    expect(state.history[0].id).toBe("10");
    const same = reducer(state, {
      type: "success",
      token: 0,
      analysis: state.history[0],
    });
    expect(same).toBe(state);
  });
  it("não divide por zero e avisa sobre versões diferentes", () => {
    const a = createAnalysis(
        { ...response, predictions: [0] },
        EXAMPLE,
        config,
        0,
      ),
      b = { ...a, id: "b", valueUsd: 100, modelVersion: "v2" };
    const result = compareAnalyses([a, b]);
    expect(result.rows[1].percentageDifference).toBeNull();
    expect(result.versionsDiffer).toBe(true);
  });
});
