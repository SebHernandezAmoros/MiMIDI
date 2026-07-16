import type { PlayNoteOptions } from "./playNote"
import { playNote } from "./playNote"
import { playSmcPadHit, PAD_SOUND_DEFAULTS, smcPadSounds, type PadSoundParams, type SmcPadSoundId } from "./playSmcPadHit"
import type { PlaybackTimerPort } from "../ports/PlaybackTimerPort"
import { findAvailableMathematicalInstrument } from "../../engine/audio/instrumentCatalog"
import {
  createPlayOptions,
} from "../../engine/audio/mathematicalInstruments"
import { createBrowserPlaybackTimerPort } from "../../infrastructure/timing/browserPlaybackTimerPort"
import {
  getMidiTracks,
  getTrackVolumeAutomationValue,
  isTrackAudible,
  type MusicalProject,
} from "../../engine/project/projectModel"
import { getTrackScheduler } from "./trackSchedulers"

export type PlaybackHandle = {
  cancel: () => void
  contentStartTime: number
  contentEndTime: number
}

export type PlayRecordedNotesOptions = PlayNoteOptions & {
  fromZero?: boolean
  onComplete?: () => void
  padSoundSettings?: Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>>
  timerPort?: PlaybackTimerPort
}

const browserPlaybackTimerPort = createBrowserPlaybackTimerPort()

export function playRecordedNotes(
  project: MusicalProject,
  options: PlayRecordedNotesOptions = {},
): PlaybackHandle {
  const {
    fromZero = false,
    onComplete,
    timerPort = browserPlaybackTimerPort,
    ...playOverrides
  } = options
  const scheduledNotes = getMidiTracks(project.timeline).flatMap((track) => {
    const scheduler = getTrackScheduler(track)

    if (scheduler.kind !== "midi") {
      return []
    }

    return scheduler.getScheduledNotes(track)
  })

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
    timerPort.setTimeout(() => {
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
        const soundParams = recordedNote.playbackPadSoundParams
          ?? { ...PAD_SOUND_DEFAULTS[soundId], ...options.padSoundSettings?.[soundId] }
        playSmcPadHit(soundId, playbackVolume, playbackPan, soundParams)
        return
      }

      // Beats del secuenciador: notas en tracks de percusión sin playbackSource explícito
      if (scheduledNote.track.trackType === "percussion") {
        const sound = smcPadSounds.find((s) => s.note === recordedNote.note)
        if (sound) {
          const soundParams = { ...PAD_SOUND_DEFAULTS[sound.id], ...options.padSoundSettings?.[sound.id] }
          playSmcPadHit(sound.id, playbackVolume, playbackPan, soundParams)
          return
        }
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
  const completeTimerId = timerPort.setTimeout(
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
        timerPort.clearTimeout(timerId)
      }

      timerPort.clearTimeout(completeTimerId)
    },
    contentStartTime: firstStartTime,
    contentEndTime: lastEndTime,
  }
}
