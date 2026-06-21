import { createAudioClip } from "./projectFactories"
import { isAudioClipTrack } from "./timelineQueries"
import type { AudioClipTrack, MusicalProject } from "./projectTypes"

export function addAudioClipTrack(
  project: MusicalProject,
  entry: { name: string; dbId: string; duration: number },
): MusicalProject {
  const track: AudioClipTrack = {
    kind: "audio-clip",
    id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: entry.name,
    dbId: entry.dbId,
    duration: entry.duration,
    clips: [createAudioClip(0)],
    muted: false,
  }
  return { ...project, timeline: [...project.timeline, track] }
}

export function updateAudioClipStartTime(
  project: MusicalProject,
  trackId: string,
  clipId: string,
  startTime: number,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isAudioClipTrack(track) && track.id === trackId
        ? {
            ...track,
            clips: track.clips.map((clip) =>
              clip.id === clipId ? { ...clip, startTime: Math.max(0, startTime) } : clip,
            ),
          }
        : track,
    ),
  }
}

export function updateAudioClipTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isAudioClipTrack(track) && track.id === trackId ? { ...track, muted } : track,
    ),
  }
}
