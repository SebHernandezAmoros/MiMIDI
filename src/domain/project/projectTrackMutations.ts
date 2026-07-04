import type { ADSREnvelope } from "../../engine/audio/audioTypes"
import type { MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import { isMidiTrack } from "./timelineQueries"
import type {
  MidiTrack,
  MusicalProject,
  TrackVolumeAutomation,
} from "./projectTypes"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function mapMidiTrack(
  project: MusicalProject,
  trackId: string,
  updater: (track: MidiTrack) => MidiTrack,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isMidiTrack(track) && track.id === trackId ? updater(track) : track,
    ),
  }
}

export function renameProject(
  project: MusicalProject,
  name: string,
): MusicalProject {
  return { ...project, name }
}

export function updateProjectTrackTimelineDuration(
  project: MusicalProject,
  duration: number,
): MusicalProject {
  return {
    ...project,
    trackTimelineDuration: clamp(duration, 1, 9999),
  }
}

export function renameTrack(
  project: MusicalProject,
  trackId: string,
  name: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      track.id === trackId ? { ...track, name } : track,
    ),
  }
}

export function updateTrackNoteTimelineDuration(
  project: MusicalProject,
  trackId: string,
  duration: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    noteTimelineDuration: clamp(duration, 1, 9999),
  }))
}

export function compactTrackNotesStart(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    if (track.clips.length === 0) return track
    const lastIdx = track.clips.length - 1
    const lastClip = track.clips[lastIdx]
    if (lastClip.notes.length === 0) return track

    const earliest = lastClip.notes.reduce(
      (min, note) => Math.min(min, note.startTime),
      Number.POSITIVE_INFINITY,
    )

    if (!Number.isFinite(earliest) || earliest <= 0) return track

    const newClips = track.clips.slice()
    newClips[lastIdx] = {
      ...lastClip,
      notes: lastClip.notes.map((note) => ({
        ...note,
        startTime: Math.max(0, note.startTime - earliest),
      })),
    }

    return { ...track, clips: newClips }
  })
}

export function updateTrackInstrument(
  project: MusicalProject,
  trackId: string,
  instrumentId: MathematicalInstrumentId,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({ ...track, instrumentId }))
}

export function updateTrackEnvelope(
  project: MusicalProject,
  trackId: string,
  patch: Partial<ADSREnvelope>,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    envelope: { ...track.envelope, ...patch },
  }))
}

export function updateTrackVolume(
  project: MusicalProject,
  trackId: string,
  volume: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    volume: clamp(volume, 0, 1.5),
  }))
}

export function updateTrackPan(
  project: MusicalProject,
  trackId: string,
  pan: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    pan: clamp(pan, -1, 1),
  }))
}

export function updateTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({ ...track, muted }))
}

export function updateTrackSolo(
  project: MusicalProject,
  trackId: string,
  solo: boolean,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({ ...track, solo }))
}

export function updateTrackVolumeAutomation(
  project: MusicalProject,
  trackId: string,
  automation: TrackVolumeAutomation,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    volumeAutomation: {
      ...automation,
      points: [...automation.points].sort((a, b) => a.time - b.time),
    },
  }))
}
