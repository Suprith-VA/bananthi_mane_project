import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/api/**/*.test.js"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files one at a time — avoids race conditions on shared DB
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    globalSetup: ["tests/api/globalSetup.js"],
    reporters: ["verbose"],
  },
});
