import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectPrimaryTrackSoundEditing } from "../useProjectPrimaryTrackSoundEditing"

describe("useProjectPrimaryTrackSoundEditing", () => {
  it("updates finite envelope values through project history with current clamps", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectPrimaryTrackSoundEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.updatePrimaryTrackEnvelope("sustain", 2)
      result.current.updatePrimaryTrackEnvelope("attack", 0)
      result.current.updatePrimaryTrackEnvelope("release", Number.NaN)
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const sustainUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const attackUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    const sustainTrack = getMidiTracks(sustainUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    const attackTrack = getMidiTracks(attackUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    expect(sustainTrack?.envelope.sustain).toBe(1)
    expect(attackTrack?.envelope.attack).toBe(0.001)
  })

  it("updates the primary track instrument through project history", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectPrimaryTrackSoundEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.updateTrackInstrumentId("fm-bell")
    })

    expect(applyUpdate).toHaveBeenCalledTimes(1)

    const instrumentUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const updatedTrack = getMidiTracks(instrumentUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    expect(updatedTrack?.instrumentId).toBe("fm-bell")
  })
})
