import { updateAudioClipTrackMuted } from "../../domain/project/audioClipTrackMutations"
import type { MusicalProject } from "../../domain/project/projectTypes"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectAudioClipTrackMixEditingOptions = {
  applyUpdate: ApplyProjectUpdate
}

export function useProjectAudioClipTrackMixEditing(
  options: UseProjectAudioClipTrackMixEditingOptions,
) {
  const { applyUpdate } = options

  function updateAudioClipTrackMutedHandler(
    trackId: string,
    muted: boolean,
  ) {
    applyUpdate((project) =>
      updateAudioClipTrackMuted(project, trackId, muted),
    )
  }

  return {
    updateAudioClipTrackMutedHandler,
  }
}
