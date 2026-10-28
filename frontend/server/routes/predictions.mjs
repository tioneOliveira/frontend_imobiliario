import { validateHousing } from "../../shared/housing.mjs";
import { HttpError } from "../errors.mjs";
/** @param {any} body */
export function validatePredictionBody(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !Array.isArray(body.instances) ||
    body.instances.length !== 1
  )
    throw new HttpError(
      422,
      "validation_error",
      "Envie exatamente um perfil regional.",
    );
  const issues = validateHousing(body.instances[0]);
  if (issues.length)
    throw new HttpError(
      422,
      "validation_error",
      "Revise os campos destacados.",
      { issues },
    );
  return body;
}
