import type { MusicalProject } from "../../domain/project/projectTypes"
import { createProjectTrack } from "../../domain/project/projectFactories"
import { appendPadTrack, removeTrack } from "../../domain/project/projectTrackLifecycle"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import {
  formatStepsTrackRemovedMessage,
  formatTrackRemovedMessage,
} from "./projectSessionMessages"

export type ActiveTrackRemovalResolution = {
  activeTrackId: string
  message: string
  project: MusicalProject
}

export type StepsTrackRemovalResolution = {
  message: string
  project: MusicalProject
}

export function resolveActiveTrackRemoval({
  activeTrackId,
  project,
}: {
  activeTrackId: string
  project: MusicalProject
}): ActiveTrackRemovalResolution | null {
  const midiTracks = getMidiTracks(project.timeline)
  const activeTrack =
    midiTracks.find((track) => track.id === activeTrackId) ?? midiTracks[0]

  if (!activeTrack) return null

  const percussionTracks = midiTracks.filter(
    (track) => track.trackType === "percussion",
  )
  const isLastPercussionTrack =
    activeTrack.trackType === "percussion" && percussionTracks.length === 1
  const isLastMidiTrack = midiTracks.length === 1
  const currentIndex = midiTracks.findIndex(
    (track) => track.id === activeTrack.id,
  )
  const fallbackTrackId =
    midiTracks[currentIndex - 1]?.id ?? midiTracks[currentIndex + 1]?.id
  const withoutTrack = removeTrack(project, activeTrack.id)

  const nextProject = isLastPercussionTrack
    ? appendPadTrack(withoutTrack)
    : isLastMidiTrack
      ? {
          ...withoutTrack,
          timeline: [createProjectTrack(1), ...withoutTrack.timeline],
        }
      : withoutTrack

  return {
    activeTrackId: isLastPercussionTrack
      ? `track-${midiTracks.length}`
      : isLastMidiTrack
        ? "track-1"
        : (fallbackTrackId ?? ""),
    message: formatTrackRemovedMessage({
      isLastMidiTrack,
      isLastPercussionTrack,
      trackName: activeTrack.name,
    }),
    project: nextProject,
  }
}

export function resolveStepsTrackRemoval({
  project,
  trackId,
}: {
  project: MusicalProject
  trackId: string
}): StepsTrackRemovalResolution | null {
  const track = getMidiTracks(project.timeline).find(
    (timelineTrack) => timelineTrack.id === trackId,
  )

  if (!track) return null

  return {
    message: formatStepsTrackRemovedMessage(track.name),
    project: removeTrack(project, trackId),
  }
}
