import { spawn } from "node:child_process"

const testArgs = process.argv.slice(2)

const child = spawn(
  "npx",
  ["vitest", "run", "--config", "vitest.functional.config.ts", ...testArgs],
  {
    env: {
      ...process.env,
      MIMIDI_E2E_HEADED: "true",
    },
    shell: true,
    stdio: "inherit",
  },
)

child.on("exit", (code) => {
  process.exit(code ?? 1)
})
