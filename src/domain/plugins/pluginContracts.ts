import type { MathematicalInstrument } from "../../engine/audio/mathematicalInstruments"
import type { MidiRecordedNote } from "../../engine/midi/events"

export type MiMIDIPluginId = string

export type MiMIDIPluginStateMap = Record<MiMIDIPluginId, boolean>

export type InstrumentPluginContribution = {
  instruments: MathematicalInstrument[]
}

export type PluginDefinitionCore = {
  id: MiMIDIPluginId
  name: string
  version: string
  description: string
  enabledByDefault: boolean
  instruments?: InstrumentPluginContribution
}

export type PluginMidiOutput = {
  type: "midi"
  name: string
  instrumentId: string
  notes: MidiRecordedNote[]
}

export type PluginAudioOutput = {
  type: "audio"
  name: string
  blob: Blob
  duration: number
  destination: "sampler" | "project"
  dbId?: string
}

export type PluginOutput = PluginMidiOutput | PluginAudioOutput
