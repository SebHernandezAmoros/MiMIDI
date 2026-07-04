import type { MusicalProject } from "../../domain/project/projectTypes"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import {
  getMidiTracks,
  getSamplerTracks,
} from "../../domain/project/timelineQueries"

export type ProjectFeatureReadModel = {
  hasPlayableContent: boolean
  noteCount: number
  samplerMixCount: number
  trackCount: number
}

export function resolveProjectFeatureReadModel(
  project: MusicalProject,
): ProjectFeatureReadModel {
  const projectTracks = getMidiTracks(project.timeline).filter(
    (track) => track.trackType !== "steps",
  )
  const noteCount = projectTracks.reduce(
    (total, track) => total + getMidiTrackNotes(track).length,
    0,
  )
  const samplerMixCount = getSamplerTracks(project.timeline).length

  return {
    hasPlayableContent: noteCount > 0 || samplerMixCount > 0,
    noteCount,
    samplerMixCount,
    trackCount: projectTracks.length,
  }
}
