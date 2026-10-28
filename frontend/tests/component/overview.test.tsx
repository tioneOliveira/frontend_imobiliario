import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OverviewDashboard } from "../../src/features/overview/OverviewDashboard";
describe("painel sem dados", () => {
  it("mostra estado vazio sem inventar indicadores", () => {
    render(
      <OverviewDashboard
        result={null}
        history={[]}
        model={null}
        config={null}
        onSimulate={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Seu próximo cenário começa aqui/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/433.854/)).not.toBeInTheDocument();
  });
});
