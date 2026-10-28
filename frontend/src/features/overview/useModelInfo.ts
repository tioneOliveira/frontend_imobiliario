import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/client";
import { parseModel } from "../../services/response-validation";
import type { ModelInfo } from "../../domain/types";
export function useModelInfo(version?: string) {
  const [model, setModel] = useState<ModelInfo | null>(null),
    [status, setStatus] = useState<
      "unknown" | "loading" | "ready" | "unavailable"
    >("unknown");
  const [checkedAt, setCheckedAt] = useState<string | null>(null),
    [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      api("/health/ready", { signal: controller.signal }),
      api("/v1/model", { signal: controller.signal }).then(parseModel),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      const health = results[0];
      setStatus(
        health.status === "fulfilled" &&
          (health.value as { status?: string })?.status === "ready"
          ? "ready"
          : "unavailable",
      );
      setCheckedAt(new Date().toISOString());
      const info = results[1];
      setModel(info.status === "fulfilled" ? (info.value as ModelInfo) : null);
    });
    return () => controller.abort();
  }, [version, refreshKey]);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  return { model, status, checkedAt, refresh };
}
