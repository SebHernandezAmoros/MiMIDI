import { useEffect, useRef } from "react"
import type { SmcPadSoundId } from "../midi/events"
import type { MiMIDIPluginAPI, PluginOutput } from "./pluginModel"

// ─── Deps que el host pasa al builder ────────────────────────────────────────

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

// ─── Hook que construye el API y gestiona el transport pub/sub ────────────────

export function usePluginAPI(deps: PluginAPIDeps): MiMIDIPluginAPI {
  const playCallbacks = useRef<Set<() => void>>(new Set())
  const stopCallbacks = useRef<Set<() => void>>(new Set())

  // Dispara callbacks cuando cambia el estado de reproducción
  const prevIsPlaying = useRef(deps.isPlaying)
  useEffect(() => {
    if (deps.isPlaying && !prevIsPlaying.current) {
      playCallbacks.current.forEach(cb => cb())
    }
    if (!deps.isPlaying && prevIsPlaying.current) {
      stopCallbacks.current.forEach(cb => cb())
    }
    prevIsPlaying.current = deps.isPlaying
  }, [deps.isPlaying])

  // Ref estable para evitar recrear el objeto api en cada render
  const depsRef = useRef(deps)
  depsRef.current = deps

  const apiRef = useRef<MiMIDIPluginAPI | null>(null)
  if (!apiRef.current) {
    apiRef.current = {
      audio: {
        playNote:  (note, id, dur) => depsRef.current.playNote(note, id, dur),
        stopNote:  note            => depsRef.current.stopNote(note),
        triggerPad:(id, vel)       => depsRef.current.triggerPad(id, vel),
      },
      project: {
        getBPM:    () => depsRef.current.bpm,
        getTracks: () => depsRef.current.getTracks(),
      },
      transport: {
        get isPlaying()   { return depsRef.current.isPlaying },
        get isRecording() { return depsRef.current.isRecording },
        get bpm()         { return depsRef.current.bpm },
        onPlay: cb => {
          playCallbacks.current.add(cb)
          return () => playCallbacks.current.delete(cb)
        },
        onStop: cb => {
          stopCallbacks.current.add(cb)
          return () => stopCallbacks.current.delete(cb)
        },
      },
      session: {
        sendOutput:  output            => depsRef.current.receivePluginOutput(output),
        storeClip:   (blob, name, dur) => depsRef.current.storeClip(blob, name, dur),
        loadClip:    dbId              => depsRef.current.loadClip(dbId),
      },
      ui: {
        notify: msg => depsRef.current.notify(msg),
      },
    }
  }

  return apiRef.current
}

// ─── Re-export de tipos útiles para componentes de plugin ────────────────────

export type { MiMIDIPluginAPI, PluginOutput, PluginWorkspaceProps, PluginToolSlotProps }
  from "./pluginModel"
