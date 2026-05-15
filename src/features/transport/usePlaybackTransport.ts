import { useRef, useState } from "react"
import type {
  PlaybackHandle,
  PlayRecordedNotesOptions,
} from "../../application/use-cases/playRecordedNotes"
import { playRecordedNotes } from "../../application/use-cases/playRecordedNotes"
import { stopAllVoices } from "../../engine/audio/audioEngine"
import type { MusicalProject } from "../../engine/project/projectModel"

export type TransportState = "idle" | "playing"

export type PlaybackInfo = {
  startedAt: number
  contentStart: number
  contentEnd: number
}

export function usePlaybackTransport() {
  const [transportState, setTransportState] = useState<TransportState>("idle")
  const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo | null>(null)
  const playbackHandleRef = useRef<PlaybackHandle | null>(null)

  function stop() {
    playbackHandleRef.current?.cancel()
    playbackHandleRef.current = null
    setTransportState("idle")
    setPlaybackInfo(null)
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
    const startedAt = performance.now()
    const handle = playRecordedNotes(project, {
      ...options,
      onComplete: () => {
        playbackHandleRef.current = null
        setTransportState("idle")
        setPlaybackInfo(null)
        options.onComplete?.()
      },
    })
    playbackHandleRef.current = handle
    setPlaybackInfo({
      startedAt,
      contentStart: handle.contentStartTime,
      contentEnd: handle.contentEndTime,
    })
  }

  return {
    isPlaying: transportState === "playing",
    play,
    playbackInfo,
    state: transportState,
    stop,
  }
}
