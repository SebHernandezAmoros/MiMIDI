import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import type { MidiRecordedNote } from "../../engine/midi/events"

export type PlaybackHandle = {
  cancel: () => void
}

export type PlayRecordedNotesOptions = PlayNoteOptions & {
  onComplete?: () => void
}

export function playRecordedNotes(
  recordedNotes: MidiRecordedNote[],
  options: PlayRecordedNotesOptions = {},
): PlaybackHandle {
  if (recordedNotes.length === 0) {
    options.onComplete?.()

    return {
      cancel: () => {},
    }
  }

  let isCancelled = false
  const firstStartTime = Math.min(
    ...recordedNotes.map((recordedNote) => recordedNote.startTime),
  )
  const lastEndTime = Math.max(
    ...recordedNotes.map(
      (recordedNote) => recordedNote.startTime + recordedNote.duration,
    ),
  )
  const timerIds = recordedNotes.map((recordedNote) =>
    window.setTimeout(() => {
      if (isCancelled) {
        return
      }

      playNote(recordedNote.note, recordedNote.duration, options)
    }, Math.max(recordedNote.startTime - firstStartTime, 0) * 1000),
  )
  const completeTimerId = window.setTimeout(
    () => {
      if (!isCancelled) {
        options.onComplete?.()
      }
    },
    Math.max(lastEndTime - firstStartTime, 0) * 1000,
  )

  return {
    cancel: () => {
      isCancelled = true

      for (const timerId of timerIds) {
        window.clearTimeout(timerId)
      }

      window.clearTimeout(completeTimerId)
    },
  }
}
