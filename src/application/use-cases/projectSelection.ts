import type { MidiRecordedNote } from "../../engine/midi/events"
import type {
  MidiTrack,
  MusicalProject,
  ProjectTrackType,
} from "../../domain/project/projectTypes"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../domain/project/timelineQueries"

export type ProjectSelectionMode =
  | "full"
  | "edit-only"
  | "project-only"
  | "perform-only"
  | "plugins-only"
  | "plugin-workspace"
  | "sampler-only"

export type ResolvePrimaryTrackOptions = {
  activeTrackId: string
  emptyTrack: MidiTrack
  melodicTracks: MidiTrack[]
  midiTracks: MidiTrack[]
  mode: ProjectSelectionMode
  percussionTracks: MidiTrack[]
}

function getInitialTrackTypeForMode(
  mode: ProjectSelectionMode,
): ProjectTrackType {
  return mode === "sampler-only" ? "percussion" : "melodic"
}

export function resolveInitialActiveTrackId(
  project: MusicalProject,
  mode: ProjectSelectionMode,
): string {
  const tracks = getMidiTracks(project.timeline)
  const targetType = getInitialTrackTypeForMode(mode)

  return tracks.find((track) => track.trackType === targetType)?.id ?? tracks[0]?.id ?? "track-1"
}

export function resolveProjectChangeActiveTrackId(
  project: MusicalProject,
  currentActiveTrackId: string,
): string {
  const tracks = getMidiTracks(project.timeline)

  return (
    tracks.find((track) => track.id === currentActiveTrackId)?.id ??
    tracks[0]?.id ??
    "track-1"
  )
}

export function resolveFirstProjectActiveTrackId(
  project: MusicalProject,
): string {
  return getMidiTracks(project.timeline)[0]?.id ?? "track-1"
}

export function resolvePrimaryTrack({
  activeTrackId,
  emptyTrack,
  melodicTracks,
  midiTracks,
  mode,
  percussionTracks,
}: ResolvePrimaryTrackOptions): MidiTrack {
  if (mode === "sampler-only") {
    return (
      percussionTracks.find((track) => track.id === activeTrackId) ??
      percussionTracks[0] ??
      midiTracks[0] ??
      emptyTrack
    )
  }

  if (mode === "perform-only") {
    return (
      melodicTracks.find((track) => track.id === activeTrackId) ??
      melodicTracks[0] ??
      emptyTrack
    )
  }

  return (
    midiTracks.find((track) => track.id === activeTrackId) ??
    melodicTracks[0] ??
    midiTracks[0] ??
    emptyTrack
  )
}

export function resolveSelectedRecordedNote(
  track: MidiTrack,
  selectedRecordedNoteId: string | null,
): MidiRecordedNote | null {
  if (!selectedRecordedNoteId) return null

  return getMidiTrackNotes(track).find((note) => note.id === selectedRecordedNoteId) ?? null
}
