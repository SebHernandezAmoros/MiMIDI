import type { MidiRecordedNote } from "../midi/events"
import type { MusicalNote } from "../midi/notes"

export type ProjectTrack = {
  id: string
  name: string
  notes: MidiRecordedNote[]
}

export type MusicalProject = {
  id: string
  name: string
  tracks: ProjectTrack[]
}

export function createDefaultProject(): MusicalProject {
  return {
    id: "project-1",
    name: "MiMIDI Project",
    tracks: [
      {
        id: "track-1",
        name: "Track 1",
        notes: [],
      },
    ],
  }
}

export function appendNoteToTrack(
  project: MusicalProject,
  trackId: string,
  note: MidiRecordedNote,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: [note, ...track.notes],
          }
        : track,
    ),
  }
}

export function clearTrackNotes(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: [],
          }
        : track,
    ),
  }
}

function isRecordedNote(value: unknown): value is MidiRecordedNote {
  if (!value || typeof value !== "object") {
    return false
  }

  const note = value as Record<string, unknown>

  return (
    typeof note.id === "string" &&
    typeof note.note === "string" &&
    typeof note.startTime === "number" &&
    typeof note.duration === "number" &&
    typeof note.velocity === "number"
  )
}

function isProjectTrack(value: unknown): value is ProjectTrack {
  if (!value || typeof value !== "object") {
    return false
  }

  const track = value as Record<string, unknown>

  return (
    typeof track.id === "string" &&
    typeof track.name === "string" &&
    Array.isArray(track.notes) &&
    track.notes.every(isRecordedNote)
  )
}

function normalizeTrackNotes(track: ProjectTrack): ProjectTrack {
  return {
    ...track,
    notes: track.notes.map((note) => ({
      ...note,
      note: note.note as MusicalNote,
    })),
  }
}

export function parseImportedProject(projectJson: string): MusicalProject {
  const parsedProject = JSON.parse(projectJson) as unknown

  if (!parsedProject || typeof parsedProject !== "object") {
    throw new Error("Invalid project file")
  }

  const project = parsedProject as Record<string, unknown>

  if (
    typeof project.id !== "string" ||
    typeof project.name !== "string" ||
    !Array.isArray(project.tracks) ||
    !project.tracks.every(isProjectTrack)
  ) {
    throw new Error("Project JSON does not match MiMIDI format")
  }

  return {
    id: project.id,
    name: project.name,
    tracks: project.tracks.map((track) => normalizeTrackNotes(track)),
  }
}
