import { updateAudioClipStartTime } from "../../domain/project/audioClipTrackMutations"
import { updateMidiClipStartTime } from "../../domain/project/midiClipMutations"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { updateSamplerClipStartTime } from "../../domain/project/samplerTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void
type ClipEditHistoryMode = "transient" | "commit"

export type UseProjectClipStartTimeEditingOptions = {
  applyTransientUpdate: ApplyProjectUpdate
  commitTransientUpdate: ApplyProjectUpdate
  timelineSnapEnabled: boolean
  timelineSnapStep: number
}

function resolveClipStartTime(
  startTime: number,
  timelineSnapEnabled: boolean,
  timelineSnapStep: number,
) {
  const snapped = timelineSnapEnabled
    ? Math.round(startTime / timelineSnapStep) * timelineSnapStep
    : startTime
  return Math.max(0, snapped)
}

export function useProjectClipStartTimeEditing(
  options: UseProjectClipStartTimeEditingOptions,
) {
  const {
    applyTransientUpdate,
    commitTransientUpdate,
    timelineSnapEnabled,
    timelineSnapStep,
  } = options

  function applyClipUpdate(
    updater: ProjectUpdater,
    historyMode: ClipEditHistoryMode,
  ) {
    if (historyMode === "transient") {
      applyTransientUpdate(updater)
      return
    }
    commitTransientUpdate(updater)
  }

  function updateMidiClipStartTimeHandler(
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode: ClipEditHistoryMode = "commit",
  ) {
    const safeStartTime = resolveClipStartTime(
      startTime,
      timelineSnapEnabled,
      timelineSnapStep,
    )
    applyClipUpdate(
      (project) =>
        updateMidiClipStartTime(project, trackId, clipId, safeStartTime),
      historyMode,
    )
  }

  function updateSamplerClipStartTimeHandler(
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode: ClipEditHistoryMode = "commit",
  ) {
    const safeStartTime = resolveClipStartTime(
      startTime,
      timelineSnapEnabled,
      timelineSnapStep,
    )
    applyClipUpdate(
      (project) =>
        updateSamplerClipStartTime(project, trackId, clipId, safeStartTime),
      historyMode,
    )
  }

  function updateAudioClipStartTimeHandler(
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode: ClipEditHistoryMode = "commit",
  ) {
    const safeStartTime = resolveClipStartTime(
      startTime,
      timelineSnapEnabled,
      timelineSnapStep,
    )
    applyClipUpdate(
      (project) =>
        updateAudioClipStartTime(project, trackId, clipId, safeStartTime),
      historyMode,
    )
  }

  return {
    updateAudioClipStartTimeHandler,
    updateMidiClipStartTimeHandler,
    updateSamplerClipStartTimeHandler,
  }
}
