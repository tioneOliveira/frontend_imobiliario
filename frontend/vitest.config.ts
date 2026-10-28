import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx,mjs}"],
    exclude: ["tests/e2e/**"],
    restoreMocks: true,
    fileParallelism: false,
  },
});
