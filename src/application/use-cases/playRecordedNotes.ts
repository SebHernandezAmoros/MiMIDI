import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import { playSmcPadHit, PAD_SOUND_DEFAULTS, type PadSoundParams, type SmcPadSoundId } from "./playSmcPadHit"
import { findAvailableMathematicalInstrument } from "../../engine/audio/instrumentCatalog"
import {
  createPlayOptions,
} from "../../engine/audio/mathematicalInstruments"
import {
  getMidiTracks,
  getTrackVolumeAutomationValue,
  getScheduledTrackNotes,
  isTrackAudible,
  type MusicalProject,
} from "../../engine/project/projectModel"

export type PlaybackHandle = {
  cancel: () => void
  contentStartTime: number
  contentEndTime: number
}

export type PlayRecordedNotesOptions = PlayNoteOptions & {
  fromZero?: boolean
  onComplete?: () => void
  padSoundSettings?: Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>>
}

export function playRecordedNotes(
  project: MusicalProject,
  options: PlayRecordedNotesOptions = {},
): PlaybackHandle {
  const { fromZero = false, onComplete, ...playOverrides } = options
  const scheduledNotes = getScheduledTrackNotes(project)

  if (scheduledNotes.length === 0) {
    onComplete?.()

    return {
      cancel: () => {},
      contentStartTime: 0,
      contentEndTime: 0,
    }
  }

  let isCancelled = false
  const firstStartTime = fromZero
    ? 0
    : Math.min(...scheduledNotes.map((scheduledNote) => scheduledNote.absoluteStartTime))
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

      if (!isTrackAudible(track, getMidiTracks(project.timeline))) {
        return
      }

      const automationVolume = getTrackVolumeAutomationValue(
        track.volumeAutomation,
        scheduledNote.relativeStartTime,
      )
      const playbackPan = track.pan
      const playbackVolume = (recordedNote.playbackVolume ?? 1) * automationVolume

      if (recordedNote.playbackSource === "smc-pad" && recordedNote.smcPadSoundId) {
        const soundId = recordedNote.smcPadSoundId
        const soundParams = { ...PAD_SOUND_DEFAULTS[soundId], ...options.padSoundSettings?.[soundId] }
        playSmcPadHit(soundId, playbackVolume, playbackPan, soundParams)
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
    contentStartTime: firstStartTime,
    contentEndTime: lastEndTime,
  }
}
