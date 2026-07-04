import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { updateTrackVolumeAutomation } from "../../../domain/project/projectTrackMutations"
import { appendStepsTrack } from "../../../domain/project/projectTrackLifecycle"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectTimelineReadModel } from "../useProjectTimelineReadModel"

describe("useProjectTimelineReadModel", () => {
  it("derives timeline read values for the current project session", () => {
    const initialProject = createDefaultProject()
    const initialTrack = getMidiTracks(initialProject.timeline)[0]
    const withPrimaryNote = appendNoteToTrack(initialProject, initialTrack.id, {
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 1,
      velocity: 0.9,
    })
    const withAutomation = updateTrackVolumeAutomation(
      withPrimaryNote,
      initialTrack.id,
      {
        enabled: true,
        points: [
          { time: 0, value: 0.25 },
          { time: 2, value: 0.75 },
        ],
      },
    )
    const withStepsTrack = appendStepsTrack(withAutomation)
    const stepsTrack = getMidiTracks(withStepsTrack.timeline).find(
      (track) => track.trackType === "steps",
    )
    const project = stepsTrack
      ? appendNoteToTrack(withStepsTrack, stepsTrack.id, {
          duration: 0.25,
          id: "steps-note-1",
          instrumentId: "pure-sine",
          note: "C2",
          startTime: 0,
          velocity: 0.8,
        })
      : withStepsTrack
    const midiTracks = getMidiTracks(project.timeline)
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const { result } = renderHook(() =>
      useProjectTimelineReadModel({
        midiTracks,
        primaryTrack,
        project,
      }),
    )

    expect(result.current.projectTrackTimelineLength).toBeGreaterThanOrEqual(1.5)
    expect(result.current.primaryTrackNoteTimelineLength).toBeGreaterThanOrEqual(1.5)
    expect(result.current.activeClip?.id).toBe(primaryTrack.clips[0].id)
    expect(result.current.primaryTrackNotes).toHaveLength(1)
    expect(result.current.allRecordedNotes.map((note) => note.id)).toEqual(["note-1"])
    expect(result.current.noteCount).toBe(1)
    expect(result.current.isPrimaryTrackAudible).toBe(true)
    expect(result.current.getTrackAutomationVolumeAtTime(1)).toBe(0.5)
  })
})
