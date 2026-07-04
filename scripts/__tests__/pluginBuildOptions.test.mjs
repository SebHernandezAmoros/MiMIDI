// @vitest-environment node

import { describe, expect, it } from "vitest"
import * as esbuild from "esbuild"
import { createPluginEsbuildOptions } from "../pluginBuildOptions.mjs"

async function bundleSource(source) {
  const result = await esbuild.build({
    ...createPluginEsbuildOptions({ combinedCss: "" }),
    stdin: {
      contents: source,
      loader: "js",
      resolveDir: process.cwd(),
    },
    write: false,
    logLevel: "silent",
  })

  return result.outputFiles[0].text
}

describe("plugin build options", () => {
  it("does not load the React host runtime for instrument-only plugins", async () => {
    const output = await bundleSource(`
      export default {
        id: "instrument-only",
        name: "Instrument Only",
        version: "1.0.0",
        description: "No UI",
        enabledByDefault: true,
        instruments: { instruments: [] }
      }
    `)

    expect(output).not.toContain("__MIMIDI_RUNTIME__")
  })

  it("loads the React host runtime only when the plugin imports React", async () => {
    const output = await bundleSource(`
      import { createElement } from "react"
      export default createElement
    `)

    expect(output).toContain("__MIMIDI_RUNTIME__")
  })
})
