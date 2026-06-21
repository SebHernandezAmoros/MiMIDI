import {
  duplicateNoteInTrack,
  removeNoteFromTrack,
  updateNoteInTrack,
} from "../../domain/project/midiNoteMutations"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import type { MidiRecordedNote } from "../../engine/midi/events"
import type { MusicalProject } from "../../domain/project/projectTypes"

export type RecordedNoteDuplicationResolution = {
  message: string
  project: MusicalProject
}

export type RecordedNoteRemovalResolution = {
  message: string
  project: MusicalProject
  selectedRecordedNoteId: string | null
}

export type RecordedNoteRevertResolution = {
  applied: boolean
  message: string
  project: MusicalProject
}

export type RecordedNotePatch = Partial<Pick<MidiRecordedNote, "duration" | "startTime">>

export type RecordedNoteUpdateBlockResolution = {
  blocked: boolean
  message: string | null
}

const SMC_PAD_RESIZE_BLOCKED_MESSAGE =
  "Los golpes SMC Pad se pueden mover, pero no redimensionar."

export function resolveRecordedNoteDuplication({
  noteId,
  offsetSeconds = 0.05,
  project,
  trackId,
  trackName,
}: {
  noteId: string
  offsetSeconds?: number
  project: MusicalProject
  trackId: string
  trackName: string
}): RecordedNoteDuplicationResolution {
  return {
    message: `Nota duplicada en ${trackName}.`,
    project: duplicateNoteInTrack(project, trackId, noteId, offsetSeconds),
  }
}

export function resolveRecordedNoteUpdateBlock({
  historyMode,
  isDurationUpdate,
  isSmcPadNote,
}: {
  historyMode: "transient" | "commit"
  isDurationUpdate: boolean
  isSmcPadNote: boolean
}): RecordedNoteUpdateBlockResolution {
  const blocked = isSmcPadNote && isDurationUpdate
  return {
    blocked,
    message: blocked && historyMode === "commit"
      ? SMC_PAD_RESIZE_BLOCKED_MESSAGE
      : null,
  }
}

export function resolveRecordedNoteRevertToLastCommit({
  currentNote,
  project,
  snapshots,
  trackId,
  trackName,
}: {
  currentNote: MidiRecordedNote
  project: MusicalProject
  snapshots: MusicalProject[]
  trackId: string
  trackName: string
}): RecordedNoteRevertResolution {
  const candidate = [...snapshots].reverse().find((snapshot) => {
    const snapshotTrack = getMidiTracks(snapshot.timeline).find(
      (track) => track.id === trackId,
    )
    const snapshotNote = snapshotTrack
      ? getMidiTrackNotes(snapshotTrack).find((note) => note.id === currentNote.id)
      : undefined

    return (
      snapshotNote &&
      (snapshotNote.startTime !== currentNote.startTime ||
        snapshotNote.duration !== currentNote.duration)
    )
  })

  if (!candidate) {
    return {
      applied: false,
      message: "No hay un commit anterior para esta nota.",
      project,
    }
  }

  const snapshotTrack = getMidiTracks(candidate.timeline).find(
    (track) => track.id === trackId,
  )
  const snapshotNote = snapshotTrack
    ? getMidiTrackNotes(snapshotTrack).find((note) => note.id === currentNote.id)
    : undefined

  if (!snapshotNote) {
    return {
      applied: false,
      message: "No se encontro version anterior para esta nota.",
      project,
    }
  }

  return {
    applied: true,
    message: `Nota revertida en ${trackName}.`,
    project: updateNoteInTrack(project, trackId, currentNote.id, {
      duration: snapshotNote.duration,
      startTime: snapshotNote.startTime,
    }),
  }
}

export function resolveRecordedNoteSafePatch({
  patch,
  timelineSnapEnabled,
  timelineSnapStep,
}: {
  patch: RecordedNotePatch
  timelineSnapEnabled: boolean
  timelineSnapStep: number
}): RecordedNotePatch {
  const quantize = (value: number) =>
    timelineSnapEnabled
      ? Math.round(value / timelineSnapStep) * timelineSnapStep
      : value
  const safePatch: RecordedNotePatch = {}

  if (typeof patch.startTime === "number") {
    safePatch.startTime = Math.max(0, quantize(patch.startTime))
  }

  if (typeof patch.duration === "number") {
    safePatch.duration = Math.max(0.01, quantize(patch.duration))
  }

  return safePatch
}

export function resolveRecordedNoteRemoval({
  noteId,
  project,
  selectedRecordedNoteId,
  trackId,
  trackName,
}: {
  noteId: string
  project: MusicalProject
  selectedRecordedNoteId: string | null
  trackId: string
  trackName: string
}): RecordedNoteRemovalResolution {
  return {
    message: `Nota eliminada de ${trackName}.`,
    project: removeNoteFromTrack(project, trackId, noteId),
    selectedRecordedNoteId:
      selectedRecordedNoteId === noteId ? null : selectedRecordedNoteId,
  }
}
