import { clearAllTrackNotes } from "../../domain/project/midiNoteMutations"
import type { MusicalProject } from "../../domain/project/projectTypes"
import {
  formatProjectRestartedMessage,
  formatSessionClearedMessage,
} from "./projectSessionMessages"

export type ProjectSessionClearResolution = {
  message: string
  selectedRecordedNoteId: null
  updateProject: (project: MusicalProject) => MusicalProject
}

export type ProjectSessionRestartResolution = ProjectSessionClearResolution & {
  activeTrackId: "track-1"
}

export function resolveProjectSessionClear(): ProjectSessionClearResolution {
  return {
    message: formatSessionClearedMessage(),
    selectedRecordedNoteId: null,
    updateProject: clearAllTrackNotes,
  }
}

export function resolveProjectSessionRestart({
  resetProject,
}: {
  resetProject: (project: MusicalProject) => MusicalProject
}): ProjectSessionRestartResolution {
  return {
    activeTrackId: "track-1",
    message: formatProjectRestartedMessage(),
    selectedRecordedNoteId: null,
    updateProject: resetProject,
  }
}
