import type { MidiRecordedNote } from "../../engine/midi/events"
import {
  getMidiTracks,
  isAudioClipTrack,
  isMidiTrack,
} from "./timelineQueries"
import type {
  MidiClip,
  MidiTrack,
  MusicalProject,
  SamplerTrack,
  ScheduledTrackNote,
  TimelineTrack,
  TrackVolumeAutomation,
} from "./projectTypes"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getMidiClipDuration(clip: MidiClip): number {
  return Math.max(
    clip.notes.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0),
    0.25,
  )
}

export function getMidiTrackNotes(track: MidiTrack): MidiRecordedNote[] {
  return track.clips.flatMap((clip) => clip.notes)
}

export function getActiveClip(track: MidiTrack): MidiClip | null {
  return track.clips.at(-1) ?? null
}

export function getMidiTrackNoteCount(track: MidiTrack): number {
  return track.clips.reduce((sum, clip) => sum + clip.notes.length, 0)
}

export function hasSoloTracks(tracks: MidiTrack[]): boolean {
  return tracks.some((track) => track.solo)
}

export function isTrackAudible(
  track: MidiTrack,
  allTracks: MidiTrack[],
): boolean {
  if (hasSoloTracks(allTracks)) {
    return track.solo && !track.muted
  }

  return !track.muted
}

export function getTrackVolumeAutomationValue(
  automation: TrackVolumeAutomation,
  time: number,
) {
  if (!automation.enabled || automation.points.length === 0) {
    return 1
  }

  const clampedTime = Math.max(time, 0)
  const sortedPoints = [...automation.points].sort(
    (a, b) => a.time - b.time,
  )
  const firstPoint = sortedPoints[0]
  const lastPoint = sortedPoints.at(-1) ?? firstPoint

  if (clampedTime <= firstPoint.time) {
    return clamp(firstPoint.value, 0, 1.5)
  }

  if (clampedTime >= lastPoint.time) {
    return clamp(lastPoint.value, 0, 1.5)
  }

  for (let i = 0; i < sortedPoints.length - 1; i += 1) {
    const cur = sortedPoints[i]
    const next = sortedPoints[i + 1]

    if (clampedTime < cur.time || clampedTime > next.time) continue

    const segmentDuration = Math.max(next.time - cur.time, 0.0001)
    const segmentProgress = (clampedTime - cur.time) / segmentDuration

    return clamp(
      cur.value + (next.value - cur.value) * segmentProgress,
      0,
      1.5,
    )
  }

  return 1
}

export function getTrackTimelineClipDuration(track: MidiTrack): number {
  return track.clips.reduce((max, clip) => Math.max(max, getMidiClipDuration(clip)), 0.25)
}

export function getTrackNoteTimelineContentLength(track: MidiTrack): number {
  const activeClip = getActiveClip(track)
  if (!activeClip) return 1
  return Math.max(getMidiClipDuration(activeClip), 1)
}

export function getTrackNoteTimelineLength(track: MidiTrack): number {
  return Math.max(
    track.noteTimelineDuration,
    getTrackNoteTimelineContentLength(track),
  )
}

export function getSamplerTrackDuration(track: SamplerTrack): number {
  const secondsPerStep = 60 / track.pattern.bpm / 4
  return track.pattern.stepsPerBar * secondsPerStep
}

export function getTracksTimelineLength(timeline: TimelineTrack[]): number {
  const lastEnd = timeline.reduce((max, track) => {
    if (isMidiTrack(track)) {
      return track.clips.reduce(
        (innerMax, clip) => Math.max(innerMax, clip.startTime + getMidiClipDuration(clip)),
        max,
      )
    }
    if (isAudioClipTrack(track)) {
      return track.clips.reduce(
        (innerMax, clip) => Math.max(innerMax, clip.startTime + track.duration),
        max,
      )
    }
    const samplerDuration = getSamplerTrackDuration(track)
    return track.clips.reduce(
      (innerMax, clip) => Math.max(innerMax, clip.startTime + samplerDuration),
      max,
    )
  }, 0)

  return Math.max(lastEnd, 1)
}

export function getProjectTrackTimelineLength(
  project: MusicalProject,
): number {
  return Math.max(
    project.trackTimelineDuration,
    getTracksTimelineLength(project.timeline),
  )
}

export function getScheduledTrackNotes(
  project: MusicalProject,
): ScheduledTrackNote[] {
  return getMidiTracks(project.timeline).flatMap((track) =>
    track.clips.flatMap((clip) =>
      clip.notes.map((note) => ({
        absoluteStartTime: clip.startTime + note.startTime,
        clip,
        note,
        relativeStartTime: note.startTime,
        track,
      })),
    ),
  )
}
