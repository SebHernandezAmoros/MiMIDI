import type { SequencerPattern } from "../../engine/audio/sequencerModel"
import { createSamplerClip } from "./projectFactories"
import { getSamplerTrackDuration } from "./timelineDurationQueries"
import { isSamplerTrack } from "./timelineQueries"
import type { MusicalProject, SamplerTrack } from "./projectTypes"

function mapSamplerTrack(
  project: MusicalProject,
  trackId: string,
  updater: (track: SamplerTrack) => SamplerTrack,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isSamplerTrack(track) && track.id === trackId ? updater(track) : track,
    ),
  }
}

export function addSamplerMix(
  project: MusicalProject,
  pattern: SequencerPattern,
  name: string,
): MusicalProject {
  const mix: SamplerTrack = {
    kind: "sampler",
    id: `smix-${Date.now()}`,
    clips: [createSamplerClip(0)],
    muted: false,
    solo: false,
    name,
    pattern,
  }
  return { ...project, timeline: [...project.timeline, mix] }
}

export function removeSamplerMix(
  project: MusicalProject,
  mixId: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.filter((track) => track.id !== mixId),
  }
}

export function updateSamplerClipStartTime(
  project: MusicalProject,
  trackId: string,
  clipId: string,
  startTime: number,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.map((clip) =>
      clip.id === clipId
        ? { ...clip, startTime: Math.max(0, startTime) }
        : clip,
    ),
  }))
}

/** @deprecated Use updateSamplerClipStartTime */
export function updateSamplerMixStartTime(
  project: MusicalProject,
  mixId: string,
  startTime: number,
): MusicalProject {
  const track = project.timeline.find(
    (candidate) => isSamplerTrack(candidate) && candidate.id === mixId,
  )
  const clipId = track?.clips[0]?.id
  if (!clipId) return project
  return updateSamplerClipStartTime(project, mixId, clipId, startTime)
}

export function duplicateSamplerClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (track) => {
    const sourceClip = track.clips.find((clip) => clip.id === clipId)
    if (!sourceClip) return track

    const samplerDuration = getSamplerTrackDuration(track)
    const newClip = createSamplerClip(sourceClip.startTime + samplerDuration)

    return {
      ...track,
      clips: [...track.clips, newClip].sort(
        (left, right) => left.startTime - right.startTime,
      ),
    }
  })
}

export function renameSamplerMix(
  project: MusicalProject,
  mixId: string,
  name: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isSamplerTrack(track) && track.id === mixId
        ? { ...track, name }
        : track,
    ),
  }
}

export function removeSamplerClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.filter((clip) => clip.id !== clipId),
  }))
}

export function updateSamplerTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (track) => ({ ...track, muted }))
}

export function updateSamplerTrackSolo(
  project: MusicalProject,
  trackId: string,
  solo: boolean,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (track) => ({ ...track, solo }))
}
