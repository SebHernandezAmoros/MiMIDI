import { useState } from "react"
import {
  resolveInitialActiveTrackId,
  type ProjectSelectionMode,
} from "../../application/use-cases/projectSelection"
import type { MusicalProject } from "../../domain/project/projectTypes"

type UseProjectSelectionOptions = {
  loadInitialProject: () => MusicalProject
  mode: ProjectSelectionMode
}

export function useProjectSelection({
  loadInitialProject,
  mode,
}: UseProjectSelectionOptions) {
  const [activeTrackId, setActiveTrackId] = useState(() =>
    resolveInitialActiveTrackId(loadInitialProject(), mode),
  )
  const [selectedRecordedNoteId, setSelectedRecordedNoteId] = useState<
    string | null
  >(null)

  return {
    activeTrackId,
    selectedRecordedNoteId,
    setActiveTrackId,
    setSelectedRecordedNoteId,
  }
}
