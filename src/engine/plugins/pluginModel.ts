import type React from "react"
import type { AppLanguage } from "../../app/appI18n"
import type { MathematicalInstrument } from "../audio/mathematicalInstruments"
import type { MidiRecordedNote, SmcPadSoundId } from "../midi/events"

// ─── Tipos base ───────────────────────────────────────────────────────────────

export type MiMIDIPluginId = string
export type MiMIDIPluginStateMap = Record<MiMIDIPluginId, boolean>

export type InstrumentPluginContribution = {
  instruments: MathematicalInstrument[]
}

// ─── Output que un plugin puede enviar al proyecto ────────────────────────────

export type PluginMidiOutput = {
  type:         "midi"
  name:         string
  instrumentId: string
  notes:        MidiRecordedNote[]
}

export type PluginAudioOutput = {
  type:        "audio"
  name:        string
  blob:        Blob
  duration:    number
  destination: "sampler" | "project"
  dbId?:       string   // si el plugin ya guardó el blob, el host no lo vuelve a guardar
}

export type PluginOutput = PluginMidiOutput | PluginAudioOutput

// ─── Slots de inyección en vistas existentes ──────────────────────────────────

export type ToolSlotId =
  | "piano-toolbar"
  | "pad-toolbar"
  | "sampler-panel"
  | "edit-toolbar"

// ─── API que el host expone a los plugins ─────────────────────────────────────

export type MiMIDIPluginAPI = {
  audio: {
    playNote(note: string, instrumentId: string, duration: number): void
    stopNote(note: string): void
    triggerPad(padId: SmcPadSoundId, velocity?: number): void
  }
  project: {
    getBPM(): number
    getTracks(): { id: string; name: string; type: "melodic" | "percussion" }[]
  }
  transport: {
    readonly isPlaying: boolean
    readonly isRecording: boolean
    readonly bpm: number
    onPlay(cb: () => void): () => void
    onStop(cb: () => void): () => void
  }
  session: {
    sendOutput(output: PluginOutput): void
    storeClip(blob: Blob, name: string, duration: number): Promise<string>
    loadClip(dbId: string): Promise<Blob | null>
  }
  ui: {
    notify(message: string): void
  }
}

// ─── Props que reciben los componentes de plugin ──────────────────────────────

export type PluginWorkspaceProps = {
  api: MiMIDIPluginAPI
  language: AppLanguage
}

export type PluginToolSlotProps = {
  api: MiMIDIPluginAPI
  slotId: ToolSlotId
  language: AppLanguage
}

// ─── Definición de workspace ──────────────────────────────────────────────────

export type PluginWorkspaceDefinition = {
  component: React.ComponentType<PluginWorkspaceProps>
  cssUrl?: string
}

// ─── Definición completa de un plugin ────────────────────────────────────────

export type MiMIDIPluginDefinition = {
  id: MiMIDIPluginId
  name: string
  version: string
  description: string
  enabledByDefault: boolean
  instruments?: InstrumentPluginContribution
  workspace?: PluginWorkspaceDefinition
  toolSlots?: Partial<Record<ToolSlotId, React.ComponentType<PluginToolSlotProps>>>
}
