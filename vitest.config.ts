import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Each file gets its own temp SQLite database; run files serially to keep it simple and fast enough.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
