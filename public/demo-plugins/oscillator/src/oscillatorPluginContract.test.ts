import { describe, expect, it } from "vitest"
import manifest from "./manifest.json"
import { oscillatorPlugin } from "./oscillatorPluginDefinition"

describe("oscillatorPlugin contract", () => {
  it("keeps manifest and plugin definition aligned", () => {
    expect(oscillatorPlugin.id).toBe(manifest.id)
    expect(oscillatorPlugin.name).toBe(manifest.name)
    expect(oscillatorPlugin.version).toBe(manifest.version)
    expect(oscillatorPlugin.description).toBe(manifest.description)
    expect(oscillatorPlugin.workspace).toBeDefined()
    expect(oscillatorPlugin.instruments?.instruments).toHaveLength(1)
    expect(oscillatorPlugin.instruments?.instruments[0]).toMatchObject({
      id: "oscillator",
      name: "Oscillator",
    })
  })
})
