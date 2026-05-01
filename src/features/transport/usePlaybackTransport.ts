import { useRef, useState } from "react"
import type {
  PlaybackHandle,
  PlayRecordedNotesOptions,
} from "../../application/use-cases/playRecordedNotes"
import { playRecordedNotes } from "../../application/use-cases/playRecordedNotes"
import { stopAllVoices } from "../../engine/audio/audioEngine"
import type { MusicalProject } from "../../engine/project/projectModel"

export type TransportState = "idle" | "playing"

export function usePlaybackTransport() {
  const [transportState, setTransportState] = useState<TransportState>("idle")
  const playbackHandleRef = useRef<PlaybackHandle | null>(null)

  function stop() {
    playbackHandleRef.current?.cancel()
    playbackHandleRef.current = null
    setTransportState("idle")
    stopAllVoices()
  }

  function play(
    project: MusicalProject,
    options: PlayRecordedNotesOptions = {},
  ) {
    if (project.tracks.every((track) => track.notes.length === 0) || transportState === "playing") {
      return
    }

    stop()
    setTransportState("playing")
    playbackHandleRef.current = playRecordedNotes(project, {
      ...options,
      onComplete: () => {
        playbackHandleRef.current = null
        setTransportState("idle")
        options.onComplete?.()
      },
    })
  }

  return {
    isPlaying: transportState === "playing",
    play,
    state: transportState,
    stop,
  }
}
