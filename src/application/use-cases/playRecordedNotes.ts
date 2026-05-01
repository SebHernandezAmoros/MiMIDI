import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import { playSmcPadHit } from "./playSmcPadHit"
import { findAvailableMathematicalInstrument } from "../../engine/audio/instrumentCatalog"
import {
  createPlayOptions,
} from "../../engine/audio/mathematicalInstruments"
import {
  getTrackVolumeAutomationValue,
  getScheduledTrackNotes,
  isTrackAudible,
  type MusicalProject,
} from "../../engine/project/projectModel"

export type PlaybackHandle = {
  cancel: () => void
}

export type PlayRecordedNotesOptions = PlayNoteOptions & {
  onComplete?: () => void
}

export function playRecordedNotes(
  project: MusicalProject,
  options: PlayRecordedNotesOptions = {},
): PlaybackHandle {
  const { onComplete, ...playOverrides } = options
  const scheduledNotes = getScheduledTrackNotes(project)

  if (scheduledNotes.length === 0) {
    onComplete?.()

    return {
      cancel: () => {},
    }
  }

  let isCancelled = false
  const firstStartTime = Math.min(
    ...scheduledNotes.map((scheduledNote) => scheduledNote.absoluteStartTime),
  )
  const lastEndTime = Math.max(
    ...scheduledNotes.map(
      (scheduledNote) =>
        scheduledNote.absoluteStartTime + scheduledNote.note.duration,
    ),
  )
  const timerIds = scheduledNotes.map((scheduledNote) =>
    window.setTimeout(() => {
      if (isCancelled) {
        return
      }

      const { note: recordedNote, track } = scheduledNote

      if (!isTrackAudible(track, project.tracks)) {
        return
      }

      const automationVolume = getTrackVolumeAutomationValue(
        track.volumeAutomation,
        scheduledNote.relativeStartTime,
      )
      const playbackPan = track.pan
      const playbackVolume = (recordedNote.playbackVolume ?? 1) * automationVolume

      if (recordedNote.playbackSource === "smc-pad" && recordedNote.smcPadSoundId) {
        playSmcPadHit(recordedNote.smcPadSoundId, playbackVolume, playbackPan)
        return
      }

      const trackInstrument = findAvailableMathematicalInstrument(
        recordedNote.instrumentId,
        project.pluginStates,
      )

      playNote(recordedNote.note, recordedNote.duration, {
        ...createPlayOptions(
          trackInstrument,
          playbackVolume,
          recordedNote.playbackEnvelope,
        ),
        pan: playbackPan,
        ...playOverrides,
      })
    }, Math.max(scheduledNote.absoluteStartTime - firstStartTime, 0) * 1000),
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
