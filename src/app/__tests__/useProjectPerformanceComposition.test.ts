import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../domain/project/midiNoteMutations"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import { createDefaultProject } from "../../engine/project/projectModel"
import { useProjectPerformanceComposition } from "../useProjectPerformanceComposition"

const {
  useLabInstrumentCatalog,
  useLabPerform,
  useLabRecordingSession,
} = vi.hoisted(() => ({
  useLabInstrumentCatalog: vi.fn(),
  useLabPerform: vi.fn(),
  useLabRecordingSession: vi.fn(),
}))

vi.mock("../../features/lab/useLabInstrumentCatalog", () => ({
  useLabInstrumentCatalog,
}))

vi.mock("../../features/lab/useLabPerform", () => ({
  useLabPerform,
}))

vi.mock("../../features/lab/useLabRecordingSession", () => ({
  useLabRecordingSession,
}))

describe("useProjectPerformanceComposition", () => {
  it("composes instrument catalog, recording and performance without sequencers", () => {
    const defaultProject = createDefaultProject()
    const primaryTrack = getMidiTracks(defaultProject.timeline)[0]
    const project = appendNoteToTrack(defaultProject, primaryTrack.id, {
      duration: 0.5,
      id: "note-1",
      instrumentId: primaryTrack.instrumentId,
      note: "C4",
      startTime: 2,
      velocity: 0.8,
    })
    const applyUpdate = vi.fn()
    const setProjectMessage = vi.fn()
    const getTrackAutomationVolumeAtTime = vi.fn(() => 1)
    const instrumentCatalog = {
      availableInstruments: [],
      selectedInstrument: { id: primaryTrack.instrumentId },
    }
    const recording = {
      getCurrentRecordTime: vi.fn(),
      recordNotesAtTime: vi.fn(),
      recordNotesToActiveTrack: vi.fn(),
      recordingState: "idle",
      registerMidiEvent: vi.fn(),
    }
    const performance = { triggerSmcPad: vi.fn() }
    useLabInstrumentCatalog.mockReturnValue(instrumentCatalog)
    useLabRecordingSession.mockReturnValue(recording)
    useLabPerform.mockReturnValue(performance)

    const { result } = renderHook(() =>
      useProjectPerformanceComposition({
        projectSession: {
          applyUpdate,
          getTrackAutomationVolumeAtTime,
          isPrimaryTrackAudible: true,
          primaryTrack,
          project,
          setProjectMessage,
        },
      }),
    )

    expect(useLabInstrumentCatalog).toHaveBeenCalledWith(
      primaryTrack.instrumentId,
      project.pluginStates,
    )
    expect(useLabRecordingSession).toHaveBeenCalledWith(
      expect.objectContaining({
        getTrackAutomationVolumeAtTime,
        onProjectUpdate: applyUpdate,
        onUpdateMessage: setProjectMessage,
        primaryTrack,
      }),
    )
    expect(useLabPerform).toHaveBeenCalledWith({
      applyUpdate,
      getCurrentRecordTime: recording.getCurrentRecordTime,
      isPrimaryTrackAudible: true,
      primaryTrack,
      project,
      recordNotesAtTime: recording.recordNotesAtTime,
      recordNotesToActiveTrack: recording.recordNotesToActiveTrack,
      recordingState: recording.recordingState,
      registerMidiEvent: recording.registerMidiEvent,
      selectedInstrument: instrumentCatalog.selectedInstrument,
      setProjectMessage,
    })
    expect(result.current).toEqual({
      instrumentCatalog,
      performance,
      recording,
    })

    const recordingOptions = useLabRecordingSession.mock.calls[0][0]
    recordingOptions.onStopRecording()
    const compactProject = applyUpdate.mock.calls[0][0](project)
    expect(getMidiTrackNotes(getMidiTracks(compactProject.timeline)[0])[0].startTime)
      .toBe(0)
  })
})
