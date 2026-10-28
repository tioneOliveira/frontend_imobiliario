/** @param {any} value */
export const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
/** @param {any} value */
export const uuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
/** @param {any} value */
export function validPrediction(value) {
  return (
    !!value &&
    Array.isArray(value.predictions) &&
    value.predictions.length === 1 &&
    typeof value.predictions[0] === "number" &&
    Number.isFinite(value.predictions[0]) &&
    ["model_version", "environment_version", "mlflow_run_id"].every((key) =>
      nonempty(value[key]),
    ) &&
    uuid(value.request_id)
  );
}
/** @param {any} value */
export function validModel(value) {
  return (
    !!value &&
    [
      "model_version",
      "environment_version",
      "mlflow_run_id",
      "dataset_version",
    ].every((key) => nonempty(value[key])) &&
    uuid(value.training_run_id) &&
    /^[a-f0-9]{64}$/.test(value.dataset_checksum) &&
    Number.isFinite(Date.parse(value.trained_at)) &&
    ["linear", "ridge", "lasso", "decision_tree", "random_forest"].includes(
      value.candidate_family,
    ) &&
    value.metrics &&
    ["mae", "mse", "rmse"].every(
      (key) =>
        typeof value.metrics[key] === "number" &&
        Number.isFinite(value.metrics[key]) &&
        value.metrics[key] >= 0,
    ) &&
    typeof value.metrics.r2 === "number" &&
    Number.isFinite(value.metrics.r2)
  );
}
/** @param {any} value */
export function validConfig(value) {
  return (
    !!value &&
    value.locale === "pt-BR" &&
    value.currency === "USD" &&
    value.time_zone === "America/Sao_Paulo" &&
    nonempty(value.dataset_reference) &&
    ((value.prediction_unit === "usd" && value.prediction_multiplier === 1) ||
      (value.prediction_unit === "california-housing-100k-usd" &&
        value.prediction_multiplier === 100000))
  );
}
