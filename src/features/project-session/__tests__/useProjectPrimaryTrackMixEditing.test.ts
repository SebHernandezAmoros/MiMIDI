import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectPrimaryTrackMixEditing } from "../useProjectPrimaryTrackMixEditing"

describe("useProjectPrimaryTrackMixEditing", () => {
  it("toggles primary track mute and solo through project history", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectPrimaryTrackMixEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.togglePrimaryTrackMuted()
      result.current.togglePrimaryTrackSolo()
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const muteUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const soloUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    const mutedTrack = getMidiTracks(muteUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    const soloTrack = getMidiTracks(soloUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    expect(mutedTrack?.muted).toBe(!primaryTrack.muted)
    expect(soloTrack?.solo).toBe(!primaryTrack.solo)
  })

  it("updates finite volume and pan values through project history with current clamps", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectPrimaryTrackMixEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.updatePrimaryTrackVolume(2)
      result.current.updatePrimaryTrackPan(-2)
      result.current.updatePrimaryTrackVolume(Number.NaN)
      result.current.updatePrimaryTrackPan(Number.POSITIVE_INFINITY)
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const volumeUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const panUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    const volumeTrack = getMidiTracks(volumeUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    const panTrack = getMidiTracks(panUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )
    expect(volumeTrack?.volume).toBe(1.5)
    expect(panTrack?.pan).toBe(-1)
  })

  it("updates primary track volume automation through project history", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectPrimaryTrackMixEditing({
        applyUpdate,
        primaryTrack,
      }),
    )

    act(() => {
      result.current.updatePrimaryTrackVolumeAutomation({
        enabled: true,
        points: [
          { time: 4, value: 0.5 },
          { time: 1, value: 1 },
        ],
      })
    })

    expect(applyUpdate).toHaveBeenCalledTimes(1)

    const automationUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const updatedTrack = getMidiTracks(automationUpdater(project).timeline).find(
      (track) => track.id === primaryTrack.id,
    )

    expect(updatedTrack?.volumeAutomation).toEqual({
      enabled: true,
      points: [
        { time: 1, value: 1 },
        { time: 4, value: 0.5 },
      ],
    })
  })
})
