import { useEffect, useRef } from "react"
import type { SmcPadSoundId } from "../domain/midi/smcPadTypes"
import type { PluginOutput } from "../domain/plugins/pluginContracts"
import type { MiMIDIPluginAPI } from "./pluginHostModel"

export type PluginAPIDeps = {
  isPlaying: boolean
  isRecording: boolean
  bpm: number
  playNote(note: string, instrumentId: string, duration: number): void
  stopNote(note: string): void
  triggerPad(padId: SmcPadSoundId, velocity?: number): void
  getTracks(): { id: string; name: string; type: "melodic" | "percussion" }[]
  receivePluginOutput(output: PluginOutput): void
  notify(message: string): void
  storeClip(blob: Blob, name: string, duration: number): Promise<string>
  loadClip(dbId: string): Promise<Blob | null>
}

export function usePluginAPI(deps: PluginAPIDeps): MiMIDIPluginAPI {
  const playCallbacks = useRef<Set<() => void>>(new Set())
  const stopCallbacks = useRef<Set<() => void>>(new Set())
  const prevIsPlaying = useRef(deps.isPlaying)

  useEffect(() => {
    if (deps.isPlaying && !prevIsPlaying.current) {
      playCallbacks.current.forEach((callback) => callback())
    }
    if (!deps.isPlaying && prevIsPlaying.current) {
      stopCallbacks.current.forEach((callback) => callback())
    }
    prevIsPlaying.current = deps.isPlaying
  }, [deps.isPlaying])

  const depsRef = useRef(deps)
  depsRef.current = deps

  const apiRef = useRef<MiMIDIPluginAPI | null>(null)
  if (!apiRef.current) {
    apiRef.current = {
      audio: {
        playNote: (note, instrumentId, duration) =>
          depsRef.current.playNote(note, instrumentId, duration),
        stopNote: (note) => depsRef.current.stopNote(note),
        triggerPad: (padId, velocity) =>
          depsRef.current.triggerPad(padId, velocity),
      },
      project: {
        getBPM: () => depsRef.current.bpm,
        getTracks: () => depsRef.current.getTracks(),
      },
      transport: {
        get isPlaying() {
          return depsRef.current.isPlaying
        },
        get isRecording() {
          return depsRef.current.isRecording
        },
        get bpm() {
          return depsRef.current.bpm
        },
        onPlay: (callback) => {
          playCallbacks.current.add(callback)
          return () => playCallbacks.current.delete(callback)
        },
        onStop: (callback) => {
          stopCallbacks.current.add(callback)
          return () => stopCallbacks.current.delete(callback)
        },
      },
      session: {
        sendOutput: (output) => depsRef.current.receivePluginOutput(output),
        storeClip: (blob, name, duration) =>
          depsRef.current.storeClip(blob, name, duration),
        loadClip: (dbId) => depsRef.current.loadClip(dbId),
      },
      ui: {
        notify: (message) => depsRef.current.notify(message),
      },
    }
  }

  return apiRef.current
}

export type { PluginOutput } from "../domain/plugins/pluginContracts"
export type {
  MiMIDIPluginAPI,
  PluginToolSlotProps,
  PluginWorkspaceProps,
} from "./pluginHostModel"
