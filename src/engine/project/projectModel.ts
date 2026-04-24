import type { MathematicalInstrumentId } from "../audio/mathematicalInstruments"
import type { MidiRecordedNote } from "../midi/events"
import type { MusicalNote } from "../midi/notes"

export type ProjectTrack = {
  id: string
  instrumentId: MathematicalInstrumentId
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
    tracks: [createProjectTrack(1)],
  }
}

export function createProjectTrack(index: number): ProjectTrack {
  return {
    id: `track-${index}`,
    instrumentId: "pure-sine",
    name: `Track ${index}`,
    notes: [],
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

export function appendNotesToTrack(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: [[...notes].reverse(), track.notes].flat(),
          }
        : track,
    ),
  }
}

export function removeNoteFromTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: track.notes.filter((note) => note.id !== noteId),
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

export function clearAllTrackNotes(project: MusicalProject): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      notes: [],
    })),
  }
}

export function renameProject(
  project: MusicalProject,
  name: string,
): MusicalProject {
  return {
    ...project,
    name,
  }
}

export function renameTrack(
  project: MusicalProject,
  trackId: string,
  name: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            name,
          }
        : track,
    ),
  }
}

export function updateTrackInstrument(
  project: MusicalProject,
  trackId: string,
  instrumentId: MathematicalInstrumentId,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            instrumentId,
          }
        : track,
    ),
  }
}

export function appendTrack(project: MusicalProject): MusicalProject {
  return {
    ...project,
    tracks: [...project.tracks, createProjectTrack(project.tracks.length + 1)],
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
    typeof note.velocity === "number" &&
    (typeof note.instrumentId === "string" || typeof note.instrumentId === "undefined")
  )
}

function isProjectTrack(value: unknown): value is ProjectTrack {
  if (!value || typeof value !== "object") {
    return false
  }

  const track = value as Record<string, unknown>

  return (
    typeof track.id === "string" &&
    (typeof track.instrumentId === "string" ||
      typeof track.instrumentId === "undefined") &&
    typeof track.name === "string" &&
    Array.isArray(track.notes) &&
    track.notes.every(isRecordedNote)
  )
}

function normalizeTrackNotes(track: ProjectTrack): ProjectTrack {
  return {
    ...track,
    instrumentId: (track.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
    notes: track.notes.map((note) => ({
      ...note,
      note: note.note as MusicalNote,
      instrumentId: (note.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
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
