import { describe, expect, it } from "vitest"
import {
  createDefaultPluginStates,
  getEnabledPlugins,
  getPluginInstruments,
  getRegisteredPlugins,
  getRegisteredPluginSummaries,
  resolvePluginStates,
} from "./pluginRegistry"

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

  it("can override the enabled state of a registered plugin", () => {
    const enabledPlugins = getEnabledPlugins({
      "motion-synth-pack": false,
    })

    expect(enabledPlugins.some((plugin) => plugin.id === "motion-synth-pack")).toBe(false)
    expect(getPluginInstruments({ "motion-synth-pack": false })).toHaveLength(0)
  })

  it("resolves persisted states over default states", () => {
    const defaultStates = createDefaultPluginStates()
    const resolvedStates = resolvePluginStates({
      "motion-synth-pack": false,
    })
    const pluginSummary = getRegisteredPluginSummaries(resolvedStates)[0]

    expect(defaultStates["motion-synth-pack"]).toBe(true)
    expect(resolvedStates["motion-synth-pack"]).toBe(false)
    expect(pluginSummary?.enabled).toBe(false)
  })
})
