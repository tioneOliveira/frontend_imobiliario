import { parsePrediction } from "../services/response-validation";
import type { Analysis, HousingInstance, PresentationConfig } from "./types";
export function createAnalysis(
  value: unknown,
  profile: HousingInstance,
  config: PresentationConfig,
  revision: number,
): Analysis {
  const response = parsePrediction(value),
    raw = response.predictions[0],
    usd = raw * config.prediction_multiplier;
  if (raw < 0 || !Number.isFinite(usd) || usd < 0)
    throw new Error(
      "O modelo retornou um valor que não pode ser interpretado como preço.",
    );
  return {
    id: response.request_id,
    profile: Object.freeze({ ...profile }),
    rawPrediction: raw,
    predictionUnit: config.prediction_unit,
    multiplier: config.prediction_multiplier,
    valueUsd: usd,
    completedAt: new Date().toISOString(),
    modelVersion: response.model_version,
    environmentVersion: response.environment_version,
    mlflowRunId: response.mlflow_run_id,
    submittedRevision: revision,
    atypicalZero: usd === 0,
  };
}
