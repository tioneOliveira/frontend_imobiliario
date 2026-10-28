import { randomUUID } from "node:crypto";
import { FIELD_KEYS } from "../shared/housing.mjs";
import { uuid } from "../shared/wire.mjs";
export class HttpError extends Error {
  /** @param {number} status @param {string} code @param {string} message @param {any} options */
  constructor(status, code, message, options = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = options.issues;
    this.requestId = options.requestId;
    this.retryAfter = options.retryAfter;
  }
  /** @param {string} fallback */
  body(fallback = randomUUID()) {
    return {
      code: this.code,
      message: this.message,
      request_id: this.requestId || fallback,
      ...(this.issues?.length ? { issues: this.issues } : {}),
    };
  }
}
/** @param {number} status @param {any} payload @param {string|null} retryAfter */
export function upstreamError(status, payload, retryAfter = null) {
  const requestId = uuid(payload?.request_id) ? payload.request_id : undefined;
  if (status === 422) {
    const raw = Array.isArray(payload?.issues)
      ? payload.issues
      : Array.isArray(payload?.detail)
        ? payload.detail
        : [];
    const issues = raw.slice(0, 100).map(
      /** @param {any} item */ (item) => {
        const loc = Array.isArray(item.location)
          ? item.location
          : Array.isArray(item.loc)
            ? item.loc
            : [];
        const field =
          loc.find(/** @param {any} x */ (x) => FIELD_KEYS.includes(x)) || null;
        return {
          field,
          message: field
            ? "Revise o valor informado para este campo."
            : "Revise os dados enviados para análise.",
        };
      },
    );
    return new HttpError(
      422,
      "validation_error",
      "Revise os campos destacados.",
      { requestId, issues },
    );
  }
  if (status === 429)
    return new HttpError(
      429,
      "rate_limited",
      "O serviço atingiu o limite de consultas. Aguarde para tentar novamente.",
      { requestId, retryAfter },
    );
  if (status === 503)
    return new HttpError(
      503,
      "model_not_ready",
      "O modelo está temporariamente indisponível. Tente novamente.",
      { requestId, retryAfter },
    );
  return new HttpError(
    status >= 400 && status < 600 ? status : 502,
    "upstream_error",
    "Não foi possível concluir a análise. Tente novamente.",
    { requestId },
  );
}
