import { useRef, useState } from "react"
import type {
  PlaybackHandle,
  PlayRecordedNotesOptions,
} from "../../application/use-cases/playRecordedNotes"
import { playRecordedNotes } from "../../application/use-cases/playRecordedNotes"
import { stopAllVoices } from "../../engine/audio/audioEngine"
import type { MidiRecordedNote } from "../../engine/midi/events"
import type { ProjectTrack } from "../../engine/project/projectModel"

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
    recordedNotes: MidiRecordedNote[],
    options: PlayRecordedNotesOptions & { tracks?: ProjectTrack[] } = {},
  ) {
    if (recordedNotes.length === 0 || transportState === "playing") {
      return
    }

    stop()
    setTransportState("playing")
    playbackHandleRef.current = playRecordedNotes(recordedNotes, {
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
