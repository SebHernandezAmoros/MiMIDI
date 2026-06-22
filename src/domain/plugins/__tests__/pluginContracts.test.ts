import { describe, expect, it } from "vitest"
import type {
  MiMIDIPluginStateMap,
  PluginDefinitionCore,
  PluginOutput,
} from "../pluginContracts"

describe("plugin domain contracts", () => {
  it("models plugin enabled state by plugin id", () => {
    const states: MiMIDIPluginStateMap = {
      "plugin-a": true,
      "plugin-b": false,
    }

    expect(states["plugin-a"]).toBe(true)
    expect(states["plugin-b"]).toBe(false)
  })

  it("models plugin definitions without UI workspace contracts", () => {
    const plugin: PluginDefinitionCore = {
      description: "Instrument-only plugin",
      enabledByDefault: true,
      id: "instrument-pack",
      instruments: {
        instruments: [
          {
            category: "base",
            envelope: { attack: 0.01, decay: 0.1, release: 0.1, sustain: 0.8 },
            id: "domain-lead",
            name: "Domain Lead",
            volume: 0.2,
            waveform: "sine",
          },
        ],
      },
      name: "Instrument Pack",
      version: "1.0.0",
    }

    expect(plugin.instruments?.instruments[0]?.id).toBe("domain-lead")
    expect("workspace" in plugin).toBe(false)
    expect("toolSlots" in plugin).toBe(false)
  })

  it("discriminates midi plugin outputs by type", () => {
    const output: PluginOutput = {
      instrumentId: "pure-sine",
      name: "Generated melody",
      notes: [],
      type: "midi",
    }

    expect(output.type).toBe("midi")
    if (output.type === "midi") {
      expect(output.instrumentId).toBe("pure-sine")
    }
  })

  it("discriminates audio plugin outputs and keeps optional stored db id", () => {
    const output: PluginOutput = {
      blob: new Blob(["audio"], { type: "audio/webm" }),
      dbId: "plugin-audio-1",
      destination: "project",
      duration: 1.5,
      name: "Rendered take",
      type: "audio",
    }

    expect(output.type).toBe("audio")
    if (output.type === "audio") {
      expect(output.dbId).toBe("plugin-audio-1")
      expect(output.destination).toBe("project")
    }
  })
})
