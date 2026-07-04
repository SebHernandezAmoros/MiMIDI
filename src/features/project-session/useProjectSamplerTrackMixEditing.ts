import type { MusicalProject } from "../../domain/project/projectTypes"
import {
  updateSamplerTrackMuted,
  updateSamplerTrackSolo,
} from "../../domain/project/samplerTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectSamplerTrackMixEditingOptions = {
  applyUpdate: ApplyProjectUpdate
}

export function useProjectSamplerTrackMixEditing(
  options: UseProjectSamplerTrackMixEditingOptions,
) {
  const { applyUpdate } = options

  function updateSamplerTrackMutedHandler(trackId: string, muted: boolean) {
    applyUpdate((project) =>
      updateSamplerTrackMuted(project, trackId, muted),
    )
  }

  function updateSamplerTrackSoloHandler(trackId: string, solo: boolean) {
    applyUpdate((project) =>
      updateSamplerTrackSolo(project, trackId, solo),
    )
  }

  return {
    updateSamplerTrackMutedHandler,
    updateSamplerTrackSoloHandler,
  }
}
