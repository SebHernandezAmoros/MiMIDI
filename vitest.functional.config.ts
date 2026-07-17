import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["e2e/**/*.functional.test.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    pool: "forks",
    fileParallelism: false,
  },
})
