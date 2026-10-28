import type { ApiErrorBody } from "../domain/types";
export class ApiError extends Error {
  body: ApiErrorBody;
  retryAt: number | null;
  constructor(body: ApiErrorBody, retryAfter: string | null = null) {
    super(body.message);
    this.body = body;
    const seconds =
      retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : null;
    const date = retryAfter ? Date.parse(retryAfter) : NaN;
    const candidate =
      seconds !== null
        ? Date.now() + seconds * 1000
        : Number.isFinite(date)
          ? date
          : null;
    this.retryAt =
      candidate !== null &&
      Number.isFinite(candidate) &&
      candidate > Date.now() &&
      candidate <= 8640000000000000
        ? candidate
        : null;
  }
}
export async function api(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(
      {
        code: typeof body?.code === "string" ? body.code : "upstream_error",
        message:
          typeof body?.message === "string"
            ? body.message
            : "Não foi possível concluir a consulta.",
        request_id: body?.request_id || "",
        issues: Array.isArray(body?.issues) ? body.issues : undefined,
      },
      response.headers.get("retry-after"),
    );
  return body;
}
