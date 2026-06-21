import type { MidiRecordedNote } from "../../engine/midi/events"
import { createMidiClip } from "./projectFactories"
import { getMidiClipDuration } from "./timelineDurationQueries"
import { isMidiTrack } from "./timelineQueries"
import type { MidiTrack, MusicalProject } from "./projectTypes"

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

export function updateMidiClipStartTime(
  project: MusicalProject,
  trackId: string,
  clipId: string,
  startTime: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.map((clip) =>
      clip.id === clipId
        ? { ...clip, startTime: Math.max(0, startTime) }
        : clip,
    ),
  }))
}

/** @deprecated Use updateMidiClipStartTime */
export function updateMidiTrackStartTime(
  project: MusicalProject,
  trackId: string,
  startTime: number,
): MusicalProject {
  const track = project.timeline.find(
    (candidate) => isMidiTrack(candidate) && candidate.id === trackId,
  )
  const clipId = track?.clips[0]?.id
  if (!clipId) return project
  return updateMidiClipStartTime(project, trackId, clipId, startTime)
}

export function removeMidiClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.filter((clip) => clip.id !== clipId),
  }))
}

export function duplicateMidiClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    const sourceClip = track.clips.find((clip) => clip.id === clipId)
    if (!sourceClip) return track

    const clipDuration = getMidiClipDuration(sourceClip)
    const newClip = createMidiClip(sourceClip.startTime + clipDuration)
    newClip.notes = sourceClip.notes.map((note: MidiRecordedNote) => ({
      ...note,
      id: `${note.id}-dup-${Date.now()}`,
    }))

    return {
      ...track,
      clips: [...track.clips, newClip].sort(
        (left, right) => left.startTime - right.startTime,
      ),
    }
  })
}

export function createRecordingClip(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    const lastClip = track.clips.at(-1)
    const startTime = lastClip
      ? lastClip.startTime + getMidiClipDuration(lastClip)
      : 0
    return { ...track, clips: [...track.clips, createMidiClip(startTime)] }
  })
}

export function resetTrackClips(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: [createMidiClip(0)],
  }))
}
