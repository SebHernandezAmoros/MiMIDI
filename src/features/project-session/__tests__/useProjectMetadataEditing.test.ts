import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectMetadataEditing } from "../useProjectMetadataEditing"

describe("useProjectMetadataEditing", () => {
  it("updates the trimmed project name through history with the current fallback", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectMetadataEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.updateProjectName("  Session Name  ")
      result.current.updateProjectName("   ")
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const namedUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const fallbackUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    expect(namedUpdater(project).name).toBe("Session Name")
    expect(fallbackUpdater(project).name).toBe("MiMIDI Project")
  })

  it("updates the active track name through history with the current fallback", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectMetadataEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.updateTrackName("  Lead Track  ")
      result.current.updateTrackName("   ")
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const namedUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const fallbackUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    const namedTrack = namedUpdater(project).timeline.find(
      (track) => track.id === primaryTrack.id,
    )
    const fallbackTrack = fallbackUpdater(project).timeline.find(
      (track) => track.id === primaryTrack.id,
    )
    expect(namedTrack?.name).toBe("Lead Track")
    expect(fallbackTrack?.name).toBe("Track 1")
  })
})
