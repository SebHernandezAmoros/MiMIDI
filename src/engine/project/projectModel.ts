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

export function updateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  patch: Partial<Pick<MidiRecordedNote, "startTime" | "duration">>,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: track.notes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    ...patch,
                  }
                : note,
            ),
          }
        : track,
    ),
  }
}

export function duplicateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  offsetSeconds = 0.05,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => {
      if (track.id !== trackId) {
        return track
      }

      const sourceNote = track.notes.find((note) => note.id === noteId)

      if (!sourceNote) {
        return track
      }

      const copiedNote: MidiRecordedNote = {
        ...sourceNote,
        id: `note-${sourceNote.note}-${(sourceNote.startTime + offsetSeconds).toFixed(3)}-${Date.now()}`,
        startTime: Math.max(0, sourceNote.startTime + offsetSeconds),
      }

      return {
        ...track,
        notes: [copiedNote, ...track.notes],
      }
    }),
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

export function removeTrack(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  if (project.tracks.length <= 1) {
    return project
  }

  return {
    ...project,
    tracks: project.tracks.filter((track) => track.id !== trackId),
  }
}

export function resetProject(project: MusicalProject): MusicalProject {
  const defaultProject = createDefaultProject()

  return {
    ...defaultProject,
    id: project.id,
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
    (typeof note.instrumentId === "string" || typeof note.instrumentId === "undefined") &&
    (note.playbackSource === undefined ||
      note.playbackSource === "note" ||
      note.playbackSource === "smc-pad") &&
    (note.smcPadSoundId === undefined ||
      note.smcPadSoundId === "kick" ||
      note.smcPadSoundId === "snare" ||
      note.smcPadSoundId === "hat" ||
      note.smcPadSoundId === "clap")
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
      playbackSource: note.playbackSource === "smc-pad" ? "smc-pad" : "note",
      smcPadSoundId:
        note.smcPadSoundId === "kick" ||
        note.smcPadSoundId === "snare" ||
        note.smcPadSoundId === "hat" ||
        note.smcPadSoundId === "clap"
          ? note.smcPadSoundId
          : undefined,
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
