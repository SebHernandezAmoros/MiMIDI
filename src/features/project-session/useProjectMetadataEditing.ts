import type {
  MidiTrack,
  MusicalProject,
} from "../../domain/project/projectTypes"
import {
  renameProject,
  renameTrack,
} from "../../domain/project/projectTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectMetadataEditingOptions = {
  applyUpdate: ApplyProjectUpdate
  primaryTrack: MidiTrack
}

export function useProjectMetadataEditing(
  options: UseProjectMetadataEditingOptions,
) {
  const { applyUpdate, primaryTrack } = options

  function updateProjectName(name: string) {
    applyUpdate((project) =>
      renameProject(project, name.trim() || "MiMIDI Project"),
    )
  }

  function updateTrackName(name: string) {
    applyUpdate((project) =>
      renameTrack(project, primaryTrack.id, name.trim() || "Track 1"),
    )
  }

  return {
    updateProjectName,
    updateTrackName,
  }
}
