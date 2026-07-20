import { OscillatorWorkspace } from "./OscillatorWorkspace"
import { oscillatorInstrument } from "./oscillatorInstrument"
import type { MiMIDIPluginDefinition } from "../../../../src/plugin-host/pluginHostModel"

const VERSION = "0.1.0"

export const oscillatorPlugin = {
  id: "oscillator",
  name: "Oscillator",
  version: VERSION,
  description: "Oscilador simple para disenar timbres basicos y enviar frases MIDI al proyecto.",
  enabledByDefault: true,
  instruments: {
    instruments: [oscillatorInstrument],
  },
  workspace: { component: OscillatorWorkspace },
} satisfies MiMIDIPluginDefinition
