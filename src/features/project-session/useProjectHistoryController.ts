import { useCallback } from "react"
import type { MusicalProject } from "../../domain/project/projectTypes"
import {
  resolveRedoProjectHistoryAction,
  resolveUndoProjectHistoryAction,
  type ProjectHistoryActionResolution,
} from "./projectSessionHistory"

type UseProjectHistoryControllerOptions = {
  activeTrackId: string
  redo: () => MusicalProject | null
  setActiveTrackId: (trackId: string) => void
  setProjectMessage: (message: string) => void
  setSelectedRecordedNoteId: (noteId: string | null) => void
  undo: () => MusicalProject | null
}

export function useProjectHistoryController({
  activeTrackId,
  redo,
  setActiveTrackId,
  setProjectMessage,
  setSelectedRecordedNoteId,
  undo,
}: UseProjectHistoryControllerOptions) {
  const applyResolution = useCallback(
    (resolution: ProjectHistoryActionResolution) => {
      if (resolution.applied) {
        setSelectedRecordedNoteId(null)
        setActiveTrackId(resolution.activeTrackId)
      }
      setProjectMessage(resolution.message)
    },
    [setActiveTrackId, setProjectMessage, setSelectedRecordedNoteId],
  )

  const undoProjectEdit = useCallback(() => {
    applyResolution(resolveUndoProjectHistoryAction(undo(), activeTrackId))
  }, [activeTrackId, applyResolution, undo])

  const redoProjectEdit = useCallback(() => {
    applyResolution(resolveRedoProjectHistoryAction(redo(), activeTrackId))
  }, [activeTrackId, applyResolution, redo])

  return {
    redoProjectEdit,
    undoProjectEdit,
  }
}
