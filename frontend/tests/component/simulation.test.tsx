import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SimulationForm } from "../../src/features/simulation/SimulationForm";
import { initialState } from "../../src/domain/reducer";
describe("formulário acessível", () => {
  it("não envia ao montar e oferece exemplo editável", () => {
    const submit = vi.fn(),
      load = vi.fn();
    render(
      <SimulationForm
        state={initialState()}
        ready={true}
        submit={submit}
        clear={vi.fn()}
        load={load}
        edit={vi.fn()}
        retryAt={null}
      />,
    );
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getAllByRole("textbox")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /Usar exemplo/ }));
    expect(load).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });
  it("impede o envio duplicado durante processamento", () => {
    const state = {
      ...initialState(),
      active: {
        token: 1,
        submittedProfile: {
          MedInc: 1,
          HouseAge: 1,
          AveRooms: 1,
          AveBedrms: 1,
          Population: 1,
          AveOccup: 1,
          Latitude: 1,
          Longitude: 1,
        },
        submittedRevision: 0,
        startedAt: new Date().toISOString(),
      },
    };
    render(
      <SimulationForm
        state={state}
        ready={true}
        submit={vi.fn()}
        clear={vi.fn()}
        load={vi.fn()}
        edit={vi.fn()}
        retryAt={null}
      />,
    );
    expect(screen.getByRole("button", { name: /Analisando/ })).toBeDisabled();
  });
});
