import { it, expect } from "vitest";
import { initialState, reducer } from "../../src/domain/reducer";
import { compareAnalyses } from "../../src/domain/comparison";
import { EXAMPLE } from "../../src/features/simulation/example";
import type { Analysis } from "../../src/domain/types";
const analysis = (id: string, value = 100, version = "v1"): Analysis => ({
  id,
  profile: EXAMPLE,
  rawPrediction: value,
  predictionUnit: "usd",
  multiplier: 1,
  valueUsd: value,
  completedAt: new Date().toISOString(),
  modelVersion: version,
  environmentVersion: "test",
  mlflowRunId: "run",
  submittedRevision: 0,
  atypicalZero: value === 0,
});
it("limita seleção, muda referência e limpa sem alterar rascunho", () => {
  let state = {
    ...initialState(),
    history: Array.from({ length: 6 }, (_, i) => analysis(String(i))),
  };
  for (let i = 0; i < 6; i++)
    state = reducer(state, { type: "select", id: String(i) });
  expect(state.selectedIds).toHaveLength(5);
  state = reducer(state, { type: "select", id: "0" });
  expect(state.selectedIds[0]).toBe("1");
  expect(state.referenceChanged).toBe(true);
  state = reducer(state, { type: "edit", field: "MedInc", value: "8" });
  state = reducer(state, { type: "clearHistory" });
  expect(state.fields.MedInc).toBe("8");
  expect(state.history).toHaveLength(0);
});
it("calcula diferenças com precisão e informa mudança de modelo", () => {
  const result = compareAnalyses([
    analysis("a", 100),
    analysis("b", 125, "v2"),
  ]);
  expect(result.rows[1].absoluteDifferenceUsd).toBe(25);
  expect(result.rows[1].percentageDifference).toBe(25);
  expect(result.versionsDiffer).toBe(true);
});
