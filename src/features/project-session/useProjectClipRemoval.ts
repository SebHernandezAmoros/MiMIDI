import { removeMidiClip } from "../../domain/project/midiClipMutations"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { removeSamplerClip } from "../../domain/project/samplerTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectClipRemovalOptions = {
  applyUpdate: ApplyProjectUpdate
}

export function useProjectClipRemoval(
  options: UseProjectClipRemovalOptions,
) {
  const { applyUpdate } = options

  function removeMidiClipHandler(trackId: string, clipId: string) {
    applyUpdate((project) => removeMidiClip(project, trackId, clipId))
  }

  function removeSamplerClipHandler(trackId: string, clipId: string) {
    applyUpdate((project) => removeSamplerClip(project, trackId, clipId))
  }

  return {
    removeMidiClipHandler,
    removeSamplerClipHandler,
  }
}
