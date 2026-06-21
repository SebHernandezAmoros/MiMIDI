import type {
  MusicalProject,
  ProjectTrackType,
} from "../../domain/project/projectTypes"
import {
  appendPadTrack,
  appendStepsTrack,
  appendTrack,
} from "../../domain/project/projectTrackLifecycle"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import { formatTrackAddedMessage } from "./projectSessionMessages"

export type TrackCreationType = Extract<
  ProjectTrackType,
  "melodic" | "percussion" | "steps"
>

export type TrackCreationResolution = {
  activeTrackId: string
  createdTrackId: string
  message: string
  project: MusicalProject
}

export function resolveTrackCreation({
  project,
  trackType,
}: {
  project: MusicalProject
  trackType: TrackCreationType
}): TrackCreationResolution {
  const nextProject =
    trackType === "percussion"
      ? appendPadTrack(project)
      : trackType === "steps"
        ? appendStepsTrack(project)
        : appendTrack(project)
  const nextTrack = getMidiTracks(nextProject.timeline).at(-1)

  if (!nextTrack) {
    return {
      activeTrackId: "track-1",
      createdTrackId: "track-1",
      message: formatTrackAddedMessage("Track 1"),
      project: nextProject,
    }
  }

  return {
    activeTrackId: nextTrack.id,
    createdTrackId: nextTrack.id,
    message: formatTrackAddedMessage(nextTrack.name),
    project: nextProject,
  }
}
