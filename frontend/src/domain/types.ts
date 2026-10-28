export type FieldName =
  | "MedInc"
  | "HouseAge"
  | "AveRooms"
  | "AveBedrms"
  | "Population"
  | "AveOccup"
  | "Latitude"
  | "Longitude";
export type HousingInstance = Record<FieldName, number>;
export interface PresentationConfig {
  locale: "pt-BR";
  currency: "USD";
  time_zone: "America/Sao_Paulo";
  prediction_unit: "california-housing-100k-usd" | "usd";
  prediction_multiplier: 100000 | 1;
  dataset_reference: string;
}
export interface PredictionResponse {
  predictions: number[];
  model_version: string;
  environment_version: string;
  mlflow_run_id: string;
  request_id: string;
}
export interface ModelInfo {
  model_version: string;
  environment_version: string;
  mlflow_run_id: string;
  training_run_id: string;
  candidate_family: string;
  dataset_version: string;
  dataset_checksum: string;
  trained_at: string;
  metrics: { mae: number; mse: number; rmse: number; r2: number };
}
export interface Analysis {
  id: string;
  profile: Readonly<HousingInstance>;
  rawPrediction: number;
  predictionUnit: PresentationConfig["prediction_unit"];
  multiplier: number;
  valueUsd: number;
  completedAt: string;
  modelVersion: string;
  environmentVersion: string;
  mlflowRunId: string;
  submittedRevision: number;
  atypicalZero: boolean;
}
export interface ApiErrorBody {
  code: string;
  message: string;
  request_id: string;
  issues?: { field: FieldName | null; message: string }[];
}
export interface ActiveRequest {
  token: number;
  submittedProfile: HousingInstance;
  submittedRevision: number;
  startedAt: string;
}
export interface AppState {
  fields: Record<FieldName, string>;
  revision: number;
  fieldErrors: Partial<Record<FieldName, string>>;
  active: ActiveRequest | null;
  result: Analysis | null;
  error: ApiErrorBody | null;
  history: Analysis[];
  selectedIds: string[];
  referenceChanged: boolean;
}
export interface ComparisonRow {
  analysis: Analysis;
  absoluteDifferenceUsd: number;
  percentageDifference: number | null;
}
export type View = "overview" | "simulation" | "scenarios";
