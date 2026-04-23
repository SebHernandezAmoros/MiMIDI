import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import type { MidiRecordedNote } from "../../engine/midi/events"

export type PlaybackHandle = {
  cancel: () => void
}

export function playRecordedNotes(
  recordedNotes: MidiRecordedNote[],
  options: PlayNoteOptions = {},
): PlaybackHandle {
  if (recordedNotes.length === 0) {
    return {
      cancel: () => {},
    }
  }

  const firstStartTime = Math.min(
    ...recordedNotes.map((recordedNote) => recordedNote.startTime),
  )
  const timerIds = recordedNotes.map((recordedNote) =>
    window.setTimeout(() => {
      playNote(recordedNote.note, recordedNote.duration, options)
    }, Math.max(recordedNote.startTime - firstStartTime, 0) * 1000),
  )

  return {
    cancel: () => {
      for (const timerId of timerIds) {
        window.clearTimeout(timerId)
      }
    },
  }
}
