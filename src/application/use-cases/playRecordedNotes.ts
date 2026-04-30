import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import { playSmcPadHit } from "./playSmcPadHit"
import {
  createPlayOptions,
  findMathematicalInstrument,
} from "../../engine/audio/mathematicalInstruments"
import type { MidiRecordedNote } from "../../engine/midi/events"
import {
  getTrackVolumeAutomationValue,
  isTrackAudible,
  type ProjectTrack,
} from "../../engine/project/projectModel"

export type PlaybackHandle = {
  cancel: () => void
}

export type PlayRecordedNotesOptions = PlayNoteOptions & {
  onComplete?: () => void
  tracks?: ProjectTrack[]
}

export function playRecordedNotes(
  recordedNotes: MidiRecordedNote[],
  options: PlayRecordedNotesOptions = {},
): PlaybackHandle {
  const { onComplete, tracks = [], ...playOverrides } = options

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

      const track = tracks.find(
        (candidateTrack) => candidateTrack.id === recordedNote.playbackTrackId,
      )

      if (track && !isTrackAudible(track, tracks)) {
        return
      }

      const automationVolume = track
        ? getTrackVolumeAutomationValue(track.volumeAutomation, recordedNote.startTime)
        : 1
      const playbackPan = track?.pan ?? recordedNote.playbackPan ?? 0
      const playbackVolume = (recordedNote.playbackVolume ?? 1) * automationVolume

      if (recordedNote.playbackSource === "smc-pad" && recordedNote.smcPadSoundId) {
        playSmcPadHit(recordedNote.smcPadSoundId, playbackVolume, playbackPan)
        return
      }

      const trackInstrument = findMathematicalInstrument(recordedNote.instrumentId)

      playNote(recordedNote.note, recordedNote.duration, {
        ...createPlayOptions(
          trackInstrument,
          playbackVolume,
          recordedNote.playbackEnvelope,
        ),
        pan: playbackPan,
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
