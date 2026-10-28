import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { initialState } from "../../src/domain/reducer";
import { ScenariosPage } from "../../src/features/scenarios/ScenariosPage";
import { HistoryPanel } from "../../src/features/scenarios/HistoryPanel";
import type { Analysis } from "../../src/domain/types";
import { EXAMPLE } from "../../src/features/simulation/example";
const analysis: Analysis = {
  id: "a",
  profile: EXAMPLE,
  rawPrediction: 2,
  predictionUnit: "california-housing-100k-usd",
  multiplier: 100000,
  valueUsd: 200000,
  completedAt: "2026-10-27T12:00:00Z",
  modelVersion: "v1",
  environmentVersion: "test",
  mlflowRunId: "run",
  submittedRevision: 0,
  atypicalZero: false,
};
describe("comparação", () => {
  it("não desenha dados quando não há histórico", () => {
    render(
      <ScenariosPage
        state={initialState()}
        toggle={vi.fn()}
        reuse={vi.fn()}
        clear={vi.fn()}
        onSimulate={vi.fn()}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar primeiro cenário" }),
    ).toBeEnabled();
  });
  it("reutilizar não envia consulta", () => {
    const reuse = vi.fn();
    render(
      <HistoryPanel
        history={[analysis]}
        selected={[]}
        toggle={vi.fn()}
        reuse={reuse}
        clear={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reutilizar cenário 1" }),
    );
    expect(reuse).toHaveBeenCalledWith(analysis);
  });
});
