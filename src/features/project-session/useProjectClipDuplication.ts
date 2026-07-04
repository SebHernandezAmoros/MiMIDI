import { duplicateMidiClip } from "../../domain/project/midiClipMutations"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { duplicateSamplerClip } from "../../domain/project/samplerTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectClipDuplicationOptions = {
  applyUpdate: ApplyProjectUpdate
}

export function useProjectClipDuplication(
  options: UseProjectClipDuplicationOptions,
) {
  const { applyUpdate } = options

  function duplicateMidiClipHandler(trackId: string, clipId: string) {
    applyUpdate((project) => duplicateMidiClip(project, trackId, clipId))
  }

  function duplicateSamplerClipHandler(trackId: string, clipId: string) {
    applyUpdate((project) => duplicateSamplerClip(project, trackId, clipId))
  }

  return {
    duplicateMidiClipHandler,
    duplicateSamplerClipHandler,
  }
}
