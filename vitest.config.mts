import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit/component tests only. jsdom + mocked network: tests never reach a real backend.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
  },
});
