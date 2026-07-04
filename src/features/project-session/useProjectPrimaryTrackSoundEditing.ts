import type {
  MidiTrack,
  MusicalProject,
} from "../../domain/project/projectTypes"
import {
  updateTrackEnvelope,
  updateTrackInstrument,
} from "../../domain/project/projectTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectPrimaryTrackSoundEditingOptions = {
  applyUpdate: ApplyProjectUpdate
  primaryTrack: MidiTrack
}

export function useProjectPrimaryTrackSoundEditing(
  options: UseProjectPrimaryTrackSoundEditingOptions,
) {
  const { applyUpdate, primaryTrack } = options

  function updatePrimaryTrackEnvelope(
    parameter: keyof MidiTrack["envelope"],
    value: number,
  ) {
    if (!Number.isFinite(value)) return
    const nextValue =
      parameter === "sustain"
        ? Math.min(Math.max(value, 0), 1)
        : Math.min(Math.max(value, 0.001), 2)
    applyUpdate((project) =>
      updateTrackEnvelope(project, primaryTrack.id, {
        [parameter]: nextValue,
      }),
    )
  }

  function updateTrackInstrumentId(instrumentId: MidiTrack["instrumentId"]) {
    applyUpdate((project) =>
      updateTrackInstrument(project, primaryTrack.id, instrumentId),
    )
  }

  return {
    updatePrimaryTrackEnvelope,
    updateTrackInstrumentId,
  }
}
