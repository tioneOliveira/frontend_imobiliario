import { FIELDS, validateHousing } from "../../shared/housing.mjs";
import type { FieldName, HousingInstance } from "./types";
export function parseDraft(fields: Record<string, string>): {
  profile: HousingInstance | null;
  errors: Partial<Record<FieldName, string>>;
} {
  const profile = {} as HousingInstance;
  const errors: Partial<Record<FieldName, string>> = {};
  for (const field of FIELDS) {
    const text = (fields[field.key] || "").trim();
    if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) {
      errors[field.key] = "Informe um número sem separadores de milhar.";
      continue;
    }
    const value = Number(text.replace(",", "."));
    if (!Number.isFinite(value)) {
      errors[field.key] = "Informe um número válido.";
      continue;
    }
    profile[field.key] = value;
  }
  for (const issue of validateHousing(profile))
    if (issue.field && !errors[issue.field])
      errors[issue.field] = issue.message;
  return { profile: Object.keys(errors).length ? null : profile, errors };
}
