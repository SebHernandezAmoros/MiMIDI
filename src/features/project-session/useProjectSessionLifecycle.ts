import type { MusicalProject } from "../../domain/project/projectTypes"
import {
  resolveProjectSessionClear,
  resolveProjectSessionRestart,
} from "./projectSessionLifecycle"

type UseProjectSessionLifecycleOptions = {
  applyUpdate: (
    update: (project: MusicalProject) => MusicalProject,
  ) => void
  clearSampleSlots: () => Promise<void>
  resetProject: (project: MusicalProject) => MusicalProject
  setActiveTrackId: (trackId: string) => void
  setProjectMessage: (message: string) => void
  setSelectedRecordedNoteId: (noteId: string | null) => void
}

export function useProjectSessionLifecycle({
  applyUpdate,
  clearSampleSlots,
  resetProject,
  setActiveTrackId,
  setProjectMessage,
  setSelectedRecordedNoteId,
}: UseProjectSessionLifecycleOptions) {
  function clearSession() {
    const resolution = resolveProjectSessionClear()
    applyUpdate(resolution.updateProject)
    setSelectedRecordedNoteId(resolution.selectedRecordedNoteId)
    setProjectMessage(resolution.message)
  }

  async function restartProject() {
    await clearSampleSlots()
    const resolution = resolveProjectSessionRestart({ resetProject })
    applyUpdate(resolution.updateProject)
    setActiveTrackId(resolution.activeTrackId)
    setSelectedRecordedNoteId(resolution.selectedRecordedNoteId)
    setProjectMessage(resolution.message)
  }

  return {
    clearSession,
    restartProject,
  }
}
