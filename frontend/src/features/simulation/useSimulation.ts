import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { initialState, reducer } from "../../domain/reducer";
import { parseDraft } from "../../domain/decimal";
import { createAnalysis } from "../../domain/analysis";
import { api, ApiError } from "../../services/client";
import type { HousingInstance, PresentationConfig } from "../../domain/types";
export function useSimulation(config: PresentationConfig | null) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState),
    [retryAt, setRetryAt] = useState<number | null>(null);
  const active = useRef<AbortController | null>(null),
    sequence = useRef(0);
  const cancel = useCallback(() => {
    sequence.current++;
    active.current?.abort();
    active.current = null;
    dispatch({ type: "cancel" });
  }, []);
  useEffect(
    () => () => {
      sequence.current++;
      active.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!retryAt) return;
    const id = setInterval(() => {
      if (Date.now() >= retryAt) setRetryAt(null);
    }, 1000);
    return () => clearInterval(id);
  }, [retryAt]);
  async function submit() {
    if (!config || active.current || (retryAt && Date.now() < retryAt)) return;
    const parsed = parseDraft(state.fields);
    if (!parsed.profile) {
      dispatch({ type: "errors", errors: parsed.errors });
      return;
    }
    const profile = { ...parsed.profile },
      revision = state.revision,
      token = ++sequence.current,
      controller = new AbortController();
    active.current = controller;
    let expired = false;
    const timeout = setTimeout(() => {
      expired = true;
      controller.abort();
    }, 15000);
    dispatch({
      type: "start",
      request: {
        token,
        submittedProfile: profile,
        submittedRevision: revision,
        startedAt: new Date().toISOString(),
      },
    });
    try {
      const result = await api("/v1/predictions", {
        method: "POST",
        body: JSON.stringify({ instances: [profile] }),
        signal: controller.signal,
      });
      if (sequence.current === token)
        dispatch({
          type: "success",
          token,
          analysis: createAnalysis(result, profile, config, revision),
        });
    } catch (error) {
      if (sequence.current !== token) return;
      if (error instanceof ApiError) {
        if (error.retryAt) setRetryAt(error.retryAt);
        dispatch({ type: "failure", token, error: error.body });
      } else
        dispatch({
          type: "failure",
          token,
          error: {
            code: expired ? "upstream_timeout" : "upstream_unreachable",
            message: expired
              ? "A consulta demorou mais que o esperado. Tente novamente."
              : error instanceof Error &&
                  error.message.includes("modelo retornou")
                ? error.message
                : "Não foi possível concluir a análise. Tente novamente.",
            request_id: "",
          },
        });
    } finally {
      clearTimeout(timeout);
      if (sequence.current === token) active.current = null;
    }
  }
  const clear = () => {
    cancel();
    dispatch({ type: "clear" });
  };
  const load = (profile: HousingInstance) => {
    cancel();
    dispatch({ type: "load", profile });
  };
  return { state, dispatch, submit, clear, load, retryAt };
}
