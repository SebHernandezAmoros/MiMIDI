import { describe, expect, it } from "vitest"
import {
  createDefaultPluginStates,
  getEnabledPlugins,
  getPluginInstruments,
  getRegisteredPluginSummaries,
  resolvePluginStates,
} from "./pluginRegistry"
import type { MiMIDIPluginDefinition } from "./pluginModel"

// ─── Fixtures independientes del estado global del registry ──────────────────

const pluginA: MiMIDIPluginDefinition = {
  id: "test-pack-a",
  name: "Test Pack A",
  version: "1.0.0",
  description: "Plugin de prueba A",
  enabledByDefault: true,
  instruments: {
    instruments: [
      {
        id: "test-lead",
        name: "Test Lead",
        category: "base",
        waveform: "sine",
        volume: 0.2,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1 },
      },
    ],
  },
}

const pluginB: MiMIDIPluginDefinition = {
  id: "test-pack-b",
  name: "Test Pack B",
  version: "1.0.0",
  description: "Plugin de prueba B",
  enabledByDefault: false,
  instruments: {
    instruments: [
      {
        id: "test-pad",
        name: "Test Pad",
        category: "base",
        waveform: "triangle",
        volume: 0.15,
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.2 },
      },
    ],
  },
}

const fixtures = [pluginA, pluginB]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("pluginRegistry", () => {
  it("returns only enabled-by-default plugins when no state override", () => {
    const enabled = getEnabledPlugins(undefined, fixtures)
    expect(enabled.map((p) => p.id)).toContain("test-pack-a")
    expect(enabled.map((p) => p.id)).not.toContain("test-pack-b")
  })

  it("returns instruments only from enabled plugins", () => {
    const instruments = getPluginInstruments(undefined, fixtures)
    expect(instruments.some((i) => i.id === "test-lead")).toBe(true)
    expect(instruments.some((i) => i.id === "test-pad")).toBe(false)
  })

  it("can enable a disabled-by-default plugin via pluginStates", () => {
    const enabled = getEnabledPlugins({ "test-pack-b": true }, fixtures)
    expect(enabled.map((p) => p.id)).toContain("test-pack-b")
  })

  it("can disable an enabled-by-default plugin via pluginStates", () => {
    const enabled = getEnabledPlugins({ "test-pack-a": false }, fixtures)
    expect(enabled.map((p) => p.id)).not.toContain("test-pack-a")
    expect(getPluginInstruments({ "test-pack-a": false }, fixtures)).toHaveLength(0)
  })

  it("createDefaultPluginStates reflects enabledByDefault of each plugin", () => {
    const defaults = createDefaultPluginStates(fixtures)
    expect(defaults["test-pack-a"]).toBe(true)
    expect(defaults["test-pack-b"]).toBe(false)
  })

  it("resolvePluginStates merges persisted overrides over defaults", () => {
    const resolved = resolvePluginStates({ "test-pack-a": false, "test-pack-b": true }, fixtures)
    expect(resolved["test-pack-a"]).toBe(false)
    expect(resolved["test-pack-b"]).toBe(true)
  })

  it("getRegisteredPluginSummaries includes enabled flag and instrumentCount", () => {
    const summaries = getRegisteredPluginSummaries(undefined, fixtures)
    const a = summaries.find((s) => s.id === "test-pack-a")
    const b = summaries.find((s) => s.id === "test-pack-b")
    expect(a?.enabled).toBe(true)
    expect(a?.instrumentCount).toBe(1)
    expect(b?.enabled).toBe(false)
    expect(b?.instrumentCount).toBe(1)
  })

  it("getRegisteredPluginSummaries exposes workspace availability without leaking UI definitions", () => {
    const PluginWorkspace = () => null
    const withWorkspace: MiMIDIPluginDefinition = {
      ...pluginA,
      id: "test-pack-with-workspace",
      workspace: { component: PluginWorkspace },
      toolSlots: { "piano-toolbar": PluginWorkspace },
    }

    const summaries = getRegisteredPluginSummaries(undefined, [withWorkspace])
    const summary = summaries[0]

    expect(summary?.hasWorkspace).toBe(true)
    expect("workspace" in summary!).toBe(false)
    expect("toolSlots" in summary!).toBe(false)
  })

  it("deduplicates instruments with the same id across multiple plugins", () => {
    const withDupe: MiMIDIPluginDefinition[] = [
      pluginA,
      {
        ...pluginB,
        enabledByDefault: true,
        instruments: { instruments: [{ ...pluginA.instruments!.instruments[0]! }] },
      },
    ]
    const ids = getPluginInstruments(undefined, withDupe).map((i) => i.id)
    expect(ids.filter((id) => id === "test-lead")).toHaveLength(1)
  })
})
