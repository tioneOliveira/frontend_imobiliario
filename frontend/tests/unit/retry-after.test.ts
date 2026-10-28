import { it, expect } from "vitest";
import { ApiError } from "../../src/services/client";
const body = { code: "rate_limited", message: "Aguarde.", request_id: "test" };
it("interpreta Retry-After válido e ignora datas fora do intervalo", () => {
  const error = new ApiError(body, "1");
  expect(error.retryAt).toBeGreaterThan(Date.now());
  expect(new ApiError(body, "9".repeat(300)).retryAt).toBeNull();
  expect(new ApiError(body, "invalid").retryAt).toBeNull();
});
