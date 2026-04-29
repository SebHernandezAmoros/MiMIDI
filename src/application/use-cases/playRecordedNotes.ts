import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import { playSmcPadHit } from "./playSmcPadHit"
import {
  createPlayOptions,
  findMathematicalInstrument,
} from "../../engine/audio/mathematicalInstruments"
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
  const { onComplete, ...playOverrides } = options

  if (recordedNotes.length === 0) {
    onComplete?.()

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

      if (recordedNote.playbackSource === "smc-pad" && recordedNote.smcPadSoundId) {
        playSmcPadHit(recordedNote.smcPadSoundId)
        return
      }

      const trackInstrument = findMathematicalInstrument(recordedNote.instrumentId)

      playNote(recordedNote.note, recordedNote.duration, {
        ...createPlayOptions(trackInstrument),
        ...playOverrides,
      })
    }, Math.max(recordedNote.startTime - firstStartTime, 0) * 1000),
  )
  const completeTimerId = window.setTimeout(
    () => {
      if (!isCancelled) {
        onComplete?.()
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
