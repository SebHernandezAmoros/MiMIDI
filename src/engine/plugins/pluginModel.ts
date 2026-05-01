import type { MathematicalInstrument } from "../audio/mathematicalInstruments"

export type MiMIDIPluginId = string
export type MiMIDIPluginStateMap = Record<MiMIDIPluginId, boolean>

export type InstrumentPluginContribution = {
  instruments: MathematicalInstrument[]
}

export type MiMIDIPluginDefinition = {
  description: string
  enabledByDefault: boolean
  id: MiMIDIPluginId
  instruments?: InstrumentPluginContribution
  name: string
  version: string
}
