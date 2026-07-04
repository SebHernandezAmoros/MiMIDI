import { isSmcPadRecordedNote, type MidiRecordedNote } from "../../engine/midi/events"
import { updateNoteInTrack } from "../../domain/project/midiNoteMutations"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import type {
  MidiTrack,
  MusicalProject,
} from "../../domain/project/projectTypes"
import {
  resolveRecordedNoteDuplication,
  resolveRecordedNoteRemoval,
  resolveRecordedNoteRevertToLastCommit,
  resolveRecordedNoteSafePatch,
  resolveRecordedNoteUpdateBlock,
  type RecordedNotePatch,
} from "./projectSessionNoteEditing"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type SelectedNoteHistoryStatus = "modificada" | "sin-cambios" | null

export type UseProjectNoteEditingOptions = {
  applyTransientUpdate: ApplyProjectUpdate
  applyUpdate: ApplyProjectUpdate
  commitTransientUpdate: ApplyProjectUpdate
  primaryTrack: MidiTrack
  primaryTrackNotes: MidiRecordedNote[]
  project: MusicalProject
  selectedRecordedNote: MidiRecordedNote | null
  selectedRecordedNoteId: string | null
  setProjectMessage: (message: string) => void
  setSelectedRecordedNoteId: (noteId: string | null) => void
  timelineSnapEnabled: boolean
  timelineSnapStep: number
  undoStack: MusicalProject[]
}

function resolveSelectedNoteHistoryStatus({
  primaryTrack,
  selectedRecordedNote,
  selectedRecordedNoteId,
  undoStack,
}: Pick<
  UseProjectNoteEditingOptions,
  "primaryTrack" | "selectedRecordedNote" | "selectedRecordedNoteId" | "undoStack"
>): SelectedNoteHistoryStatus {
  if (!selectedRecordedNoteId || !selectedRecordedNote) return null

  const latestSnapshot = undoStack.at(-1)
  if (!latestSnapshot) return "sin-cambios"

  const snapshotTrack = getMidiTracks(latestSnapshot.timeline).find(
    (track) => track.id === primaryTrack.id,
  )
  const snapshotNote = snapshotTrack
    ? getMidiTrackNotes(snapshotTrack).find(
        (note) => note.id === selectedRecordedNoteId,
      )
    : undefined

  return !snapshotNote ||
    snapshotNote.startTime !== selectedRecordedNote.startTime ||
    snapshotNote.duration !== selectedRecordedNote.duration
    ? "modificada"
    : "sin-cambios"
}

export function useProjectNoteEditing(options: UseProjectNoteEditingOptions) {
  const {
    applyTransientUpdate,
    applyUpdate,
    commitTransientUpdate,
    primaryTrack,
    primaryTrackNotes,
    project,
    selectedRecordedNote,
    selectedRecordedNoteId,
    setProjectMessage,
    setSelectedRecordedNoteId,
    timelineSnapEnabled,
    timelineSnapStep,
    undoStack,
  } = options

  const selectedNoteHistoryStatus = resolveSelectedNoteHistoryStatus({
    primaryTrack,
    selectedRecordedNote,
    selectedRecordedNoteId,
    undoStack,
  })

  function selectRecordedNote(noteId: string) {
    setSelectedRecordedNoteId(noteId)
  }

  function removeRecordedNote(noteId: string) {
    const removalResult: {
      current: ReturnType<typeof resolveRecordedNoteRemoval> | null
    } = {
      current: null,
    }

    applyUpdate((currentProject) => {
      removalResult.current = resolveRecordedNoteRemoval({
        noteId,
        project: currentProject,
        selectedRecordedNoteId,
        trackId: primaryTrack.id,
        trackName: primaryTrack.name,
      })
      return removalResult.current.project
    })

    if (!removalResult.current) return
    setSelectedRecordedNoteId(removalResult.current.selectedRecordedNoteId)
    setProjectMessage(removalResult.current.message)
  }

  function updateRecordedNote(
    noteId: string,
    patch: RecordedNotePatch,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const noteToUpdate = primaryTrackNotes.find((note) => note.id === noteId)
    if (!noteToUpdate) return

    const updateBlock = resolveRecordedNoteUpdateBlock({
      historyMode,
      isDurationUpdate: typeof patch.duration === "number",
      isSmcPadNote: isSmcPadRecordedNote(noteToUpdate),
    })
    if (updateBlock.blocked) {
      if (updateBlock.message) setProjectMessage(updateBlock.message)
      return
    }

    const safePatch = resolveRecordedNoteSafePatch({
      patch,
      timelineSnapEnabled,
      timelineSnapStep,
    })
    const updateProject = (currentProject: MusicalProject) =>
      updateNoteInTrack(currentProject, primaryTrack.id, noteId, safePatch)

    if (historyMode === "transient") {
      applyTransientUpdate(updateProject)
      return
    }
    commitTransientUpdate(updateProject)
  }

  function duplicateSelectedRecordedNote() {
    if (!selectedRecordedNote) return
    const duplicationResult: {
      current: ReturnType<typeof resolveRecordedNoteDuplication> | null
    } = {
      current: null,
    }

    applyUpdate((currentProject) => {
      duplicationResult.current = resolveRecordedNoteDuplication({
        noteId: selectedRecordedNote.id,
        offsetSeconds: timelineSnapEnabled ? timelineSnapStep : 0.05,
        project: currentProject,
        trackId: primaryTrack.id,
        trackName: primaryTrack.name,
      })
      return duplicationResult.current.project
    })

    if (duplicationResult.current) setProjectMessage(duplicationResult.current.message)
  }

  function revertSelectedNoteToLastCommit() {
    if (!selectedRecordedNote) return

    const revertResult = resolveRecordedNoteRevertToLastCommit({
      currentNote: selectedRecordedNote,
      project,
      snapshots: undoStack,
      trackId: primaryTrack.id,
      trackName: primaryTrack.name,
    })
    if (revertResult.applied) {
      applyUpdate(() => revertResult.project)
    }
    setProjectMessage(revertResult.message)
  }

  function updateSelectedNoteStartTime(value: number) {
    if (!selectedRecordedNote) return
    updateRecordedNote(selectedRecordedNote.id, {
      startTime: Number.isFinite(value) ? value : 0,
    })
  }

  function updateSelectedNoteDuration(value: number) {
    if (!selectedRecordedNote) return
    updateRecordedNote(selectedRecordedNote.id, {
      duration: Number.isFinite(value) ? value : 0.01,
    })
  }

  return {
    duplicateSelectedRecordedNote,
    removeRecordedNote,
    revertSelectedNoteToLastCommit,
    selectRecordedNote,
    selectedNoteHistoryStatus,
    updateRecordedNote,
    updateSelectedNoteDuration,
    updateSelectedNoteStartTime,
  }
}
