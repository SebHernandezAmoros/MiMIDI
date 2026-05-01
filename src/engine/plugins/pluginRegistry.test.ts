import { describe, expect, it } from "vitest"
import { getEnabledPlugins, getPluginInstruments, getRegisteredPlugins } from "./pluginRegistry"

describe("pluginRegistry", () => {
  it("returns registered internal plugins", () => {
    const plugins = getRegisteredPlugins()

    expect(plugins.length).toBeGreaterThan(0)
    expect(plugins[0]?.id).toBe("motion-synth-pack")
  })

  it("returns enabled plugin instruments", () => {
    const instruments = getPluginInstruments()

    expect(instruments.some((instrument) => instrument.id === "glass-pluck")).toBe(true)
    expect(instruments.some((instrument) => instrument.id === "pulse-drift")).toBe(true)
  })

  it("keeps plugins enabled by default in the active catalog", () => {
    const enabledPlugins = getEnabledPlugins()

    expect(enabledPlugins.some((plugin) => plugin.id === "motion-synth-pack")).toBe(true)
  })
})
