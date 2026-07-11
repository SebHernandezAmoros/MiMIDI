import { useCallback } from "react"
import { compactTrackNotesStart } from "../domain/project/projectTrackMutations"
import { getMidiTracks } from "../domain/project/timelineQueries"
import { getMidiTrackNotes } from "../domain/project/timelineDurationQueries"
import { useLabInstrumentCatalog } from "../features/lab/useLabInstrumentCatalog"
import { useLabPerform } from "../features/lab/useLabPerform"
import type { useLabProject } from "../features/lab/useLabProject"
import { useLabRecordingSession } from "../features/lab/useLabRecordingSession"

type ProjectPerformanceSession = Pick<
  ReturnType<typeof useLabProject>,
  | "applyUpdate"
  | "getTrackAutomationVolumeAtTime"
  | "isPrimaryTrackAudible"
  | "primaryTrack"
  | "project"
  | "setProjectMessage"
>

export function useProjectPerformanceComposition({
  projectSession,
}: {
  projectSession: ProjectPerformanceSession
}) {
  const instrumentCatalog = useLabInstrumentCatalog(
    projectSession.primaryTrack.instrumentId,
    projectSession.project.pluginStates,
  )
  const onStopRecording = useCallback(() => {
    projectSession.applyUpdate((project) => {
      const track = getMidiTracks(project.timeline).find(
        (candidate) => candidate.id === projectSession.primaryTrack.id,
      )
      if (!track || getMidiTrackNotes(track).length === 0) return project
      return compactTrackNotesStart(project, projectSession.primaryTrack.id)
    })
  }, [projectSession.applyUpdate, projectSession.primaryTrack.id])
  const recording = useLabRecordingSession({
    getPerformanceTimestamp: () => globalThis.performance.now(),
    getTrackAutomationVolumeAtTime:
      projectSession.getTrackAutomationVolumeAtTime,
    onProjectUpdate: projectSession.applyUpdate,
    onStopRecording,
    onUpdateMessage: projectSession.setProjectMessage,
    primaryTrack: projectSession.primaryTrack,
  })
  const performance = useLabPerform({
    applyUpdate: projectSession.applyUpdate,
    getCurrentRecordTime: recording.getCurrentRecordTime,
    isPrimaryTrackAudible: projectSession.isPrimaryTrackAudible,
    primaryTrack: projectSession.primaryTrack,
    project: projectSession.project,
    recordNotesAtTime: recording.recordNotesAtTime,
    recordNotesToActiveTrack: recording.recordNotesToActiveTrack,
    recordingState: recording.recordingState,
    registerMidiEvent: recording.registerMidiEvent,
    selectedInstrument: instrumentCatalog.selectedInstrument,
    setProjectMessage: projectSession.setProjectMessage,
  })

  return { instrumentCatalog, performance, recording }
}
