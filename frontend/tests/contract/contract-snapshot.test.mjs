// @vitest-environment node
import { it, expect } from "vitest";
import { verifyContract } from "../../scripts/verify-contract.mjs";
it("preserva o snapshot e resolve referências dos contratos", async () =>
  expect((await verifyContract()).status).toBe("passed"));
