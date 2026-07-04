import type React from "react"
import type { AppLanguage } from "../app/appI18n"
import type {
  PluginDefinitionCore,
  PluginOutput,
} from "../domain/plugins/pluginContracts"
import type { SmcPadSoundId } from "../domain/midi/smcPadTypes"

export type ToolSlotId =
  | "piano-toolbar"
  | "pad-toolbar"
  | "sampler-panel"
  | "edit-toolbar"

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

export type PluginWorkspaceProps = {
  api: MiMIDIPluginAPI
  language: AppLanguage
  version?: string
}

export type PluginToolSlotProps = {
  api: MiMIDIPluginAPI
  slotId: ToolSlotId
  language: AppLanguage
}

export type PluginWorkspaceDefinition = {
  component: React.ComponentType<PluginWorkspaceProps>
  cssUrl?: string
}

export type PluginToolSlotDefinition = React.ComponentType<PluginToolSlotProps>

export type MiMIDIPluginDefinition = PluginDefinitionCore & {
  workspace?: PluginWorkspaceDefinition
  toolSlots?: Partial<Record<ToolSlotId, PluginToolSlotDefinition>>
}
