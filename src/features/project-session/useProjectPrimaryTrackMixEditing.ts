import type {
  MidiTrack,
  MusicalProject,
  TrackVolumeAutomation,
} from "../../domain/project/projectTypes"
import {
  updateTrackMuted,
  updateTrackPan,
  updateTrackSolo,
  updateTrackVolume,
  updateTrackVolumeAutomation,
} from "../../domain/project/projectTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectPrimaryTrackMixEditingOptions = {
  applyUpdate: ApplyProjectUpdate
  primaryTrack: MidiTrack
}

export function useProjectPrimaryTrackMixEditing(
  options: UseProjectPrimaryTrackMixEditingOptions,
) {
  const { applyUpdate, primaryTrack } = options

  function togglePrimaryTrackMuted() {
    applyUpdate((project) =>
      updateTrackMuted(project, primaryTrack.id, !primaryTrack.muted),
    )
  }

  function togglePrimaryTrackSolo() {
    applyUpdate((project) =>
      updateTrackSolo(project, primaryTrack.id, !primaryTrack.solo),
    )
  }

  function updatePrimaryTrackVolume(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((project) =>
      updateTrackVolume(
        project,
        primaryTrack.id,
        Math.min(Math.max(value, 0), 1.5),
      ),
    )
  }

  function updatePrimaryTrackPan(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((project) => updateTrackPan(project, primaryTrack.id, value))
  }

  function updatePrimaryTrackVolumeAutomation(
    automation: TrackVolumeAutomation,
  ) {
    applyUpdate((project) =>
      updateTrackVolumeAutomation(project, primaryTrack.id, automation),
    )
  }

  return {
    togglePrimaryTrackMuted,
    togglePrimaryTrackSolo,
    updatePrimaryTrackPan,
    updatePrimaryTrackVolume,
    updatePrimaryTrackVolumeAutomation,
  }
}
