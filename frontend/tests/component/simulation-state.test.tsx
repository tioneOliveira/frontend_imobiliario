import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { useSimulation } from "../../src/features/simulation/useSimulation";
import { EXAMPLE } from "../../src/features/simulation/example";
const config = {
  locale: "pt-BR",
  currency: "USD",
  time_zone: "America/Sao_Paulo",
  prediction_unit: "usd",
  prediction_multiplier: 1,
  dataset_reference: "test",
} as const;
const response = (value = 100, id = "12345678-1234-4123-8123-123456789012") =>
  new Response(
    JSON.stringify({
      predictions: [value],
      request_id: id,
      model_version: "v1",
      environment_version: "test",
      mlflow_run_id: "run",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("ciclo da consulta", () => {
  it("mantém o snapshot quando os campos mudam e impede POST duplicado", async () => {
    let resolve!: (value: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useSimulation(config));
    act(() => result.current.load(EXAMPLE));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit();
      void result.current.submit();
    });
    act(() =>
      result.current.dispatch({ type: "edit", field: "MedInc", value: "5" }),
    );
    await act(async () => {
      resolve(response());
      await pending;
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(result.current.state.result?.profile.MedInc).toBe(EXAMPLE.MedInc);
    expect(result.current.state.fields.MedInc).toBe("5");
  });
  it("preserva o resultado anterior no timeout", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response())
      .mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(new Error("aborted")),
            ),
          ),
      );
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useSimulation(config));
    act(() => result.current.load(EXAMPLE));
    await act(async () => {
      await result.current.submit();
    });
    const previous = result.current.state.result;
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.submit();
    });
    await act(async () => {
      vi.advanceTimersByTime(15001);
      await pending;
    });
    expect(result.current.state.result).toBe(previous);
    expect(result.current.state.error?.code).toBe("upstream_timeout");
    expect(result.current.state.history).toHaveLength(1);
  });
  it("ignora resposta de consulta cancelada após uma consulta nova", async () => {
    const resolvers: ((value: Response) => void)[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((done) => resolvers.push(done))),
    );
    const { result } = renderHook(() => useSimulation(config));
    act(() => result.current.load(EXAMPLE));
    let first!: Promise<void>, second!: Promise<void>;
    act(() => {
      first = result.current.submit();
    });
    act(() => result.current.clear());
    act(() => result.current.load({ ...EXAMPLE, MedInc: 5 }));
    act(() => {
      second = result.current.submit();
    });
    await act(async () => {
      resolvers[1](response(200, "12345678-1234-4123-8123-123456789013"));
      await second;
    });
    await act(async () => {
      resolvers[0](response(100));
      await first;
    });
    expect(result.current.state.result?.valueUsd).toBe(200);
    expect(result.current.state.history).toHaveLength(1);
  });
});
