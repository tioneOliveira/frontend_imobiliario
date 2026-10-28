import {
  validConfig,
  validModel,
  validPrediction,
} from "../../shared/wire.mjs";
import type {
  PresentationConfig,
  PredictionResponse,
  ModelInfo,
} from "../domain/types";
export function parseConfig(value: unknown): PresentationConfig {
  if (!validConfig(value))
    throw new Error("Configuração de apresentação inválida.");
  return value as PresentationConfig;
}
export function parsePrediction(value: unknown): PredictionResponse {
  if (!validPrediction(value))
    throw new Error("O serviço retornou uma estimativa incompleta.");
  return value as PredictionResponse;
}
export function parseModel(value: unknown): ModelInfo {
  if (!validModel(value))
    throw new Error("Informações do modelo indisponíveis.");
  return value as ModelInfo;
}
