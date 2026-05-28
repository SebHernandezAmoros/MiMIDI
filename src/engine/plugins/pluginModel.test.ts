import { describe, expect, it } from "vitest"
import type {
  MiMIDIPluginDefinition,
  PluginOutput,
  ToolSlotId,
} from "./pluginModel"

// ─── pluginModel — tests de estructura de tipos y validación de contrato ──────
//
// No hay lógica de runtime en pluginModel.ts (solo tipos), así que los tests
// verifican que las estructuras correctas satisfacen los tipos esperados usando
// satisfies/typeof, y que los narrowings de PluginOutput funcionan bien en JS.

describe("pluginModel — PluginOutput narrowing", () => {
  it("discriminates midi output by type field", () => {
    const output: PluginOutput = {
      type: "midi",
      name: "Test Seq",
      instrumentId: "pure-sine",
      notes: [],
    }
    expect(output.type).toBe("midi")
    if (output.type === "midi") {
      expect(output.instrumentId).toBe("pure-sine")
    }
  })

  it("discriminates audio output by type field", () => {
    const blob = new Blob(["audio"], { type: "audio/webm" })
    const output: PluginOutput = {
      type: "audio",
      name: "Take 1",
      blob,
      duration: 3.5,
      destination: "sampler",
    }
    expect(output.type).toBe("audio")
    if (output.type === "audio") {
      expect(output.destination).toBe("sampler")
      expect(output.duration).toBe(3.5)
    }
  })

  it("audio output accepts optional dbId", () => {
    const blob = new Blob([])
    const output: PluginOutput = {
      type: "audio",
      name: "Cached",
      blob,
      duration: 1,
      destination: "project",
      dbId: "plugin-clip-abc123",
    }
    if (output.type === "audio") {
      expect(output.dbId).toBe("plugin-clip-abc123")
    }
  })
})

describe("pluginModel — MiMIDIPluginDefinition structure", () => {
  it("accepts a minimal plugin with no contributions", () => {
    const plugin: MiMIDIPluginDefinition = {
      id: "minimal-plugin",
      name: "Minimal",
      version: "0.1.0",
      description: "No contributions",
      enabledByDefault: false,
    }
    expect(plugin.id).toBe("minimal-plugin")
    expect(plugin.instruments).toBeUndefined()
    expect(plugin.workspace).toBeUndefined()
    expect(plugin.toolSlots).toBeUndefined()
  })

  it("accepts a plugin with instruments contribution", () => {
    const plugin: MiMIDIPluginDefinition = {
      id: "inst-plugin",
      name: "Inst Plugin",
      version: "1.0.0",
      description: "Instruments only",
      enabledByDefault: true,
      instruments: {
        instruments: [
          {
            id: "test-osc",
            name: "Test Osc",
            category: "base",
            waveform: "sine",
            volume: 0.2,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1 },
          },
        ],
      },
    }
    expect(plugin.instruments?.instruments).toHaveLength(1)
    expect(plugin.instruments?.instruments[0]?.id).toBe("test-osc")
  })

  it("toolSlotId values match the defined union", () => {
    const validSlots: ToolSlotId[] = [
      "piano-toolbar",
      "pad-toolbar",
      "sampler-panel",
      "edit-toolbar",
    ]
    expect(validSlots).toHaveLength(4)
    expect(validSlots).toContain("piano-toolbar")
    expect(validSlots).toContain("pad-toolbar")
  })
})
