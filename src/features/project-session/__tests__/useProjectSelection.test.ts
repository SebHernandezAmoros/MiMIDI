import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectSelection } from "../useProjectSelection"

describe("useProjectSelection", () => {
  it("selects the initial melodic track outside sampler mode", () => {
    const project = createDefaultProject()
    const melodicTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "melodic",
    )
    const { result } = renderHook(() =>
      useProjectSelection({
        loadInitialProject: () => project,
        mode: "full",
      }),
    )

    expect(result.current.activeTrackId).toBe(melodicTrack?.id)
    expect(result.current.selectedRecordedNoteId).toBeNull()
  })

  it("selects the initial percussion track in sampler mode", () => {
    const project = createDefaultProject()
    const percussionTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "percussion",
    )
    const { result } = renderHook(() =>
      useProjectSelection({
        loadInitialProject: () => project,
        mode: "sampler-only",
      }),
    )

    expect(result.current.activeTrackId).toBe(percussionTrack?.id)
  })

  it("exposes the current selection setters without reloading the initial project", () => {
    const project = createDefaultProject()
    const loadInitialProject = vi.fn(() => project)
    const { result, rerender } = renderHook(() =>
      useProjectSelection({
        loadInitialProject,
        mode: "full",
      }),
    )

    act(() => {
      result.current.setActiveTrackId("track-next")
      result.current.setSelectedRecordedNoteId("note-selected")
    })
    rerender()

    expect(result.current.activeTrackId).toBe("track-next")
    expect(result.current.selectedRecordedNoteId).toBe("note-selected")
    expect(loadInitialProject).toHaveBeenCalledOnce()
  })
})
