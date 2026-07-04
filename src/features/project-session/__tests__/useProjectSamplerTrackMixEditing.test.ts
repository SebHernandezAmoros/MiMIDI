import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { addSamplerMix } from "../../../domain/project/samplerTrackMutations"
import { getSamplerTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectSamplerTrackMixEditing } from "../useProjectSamplerTrackMixEditing"

describe("useProjectSamplerTrackMixEditing", () => {
  it("routes sampler mute and solo updates through project history", () => {
    const project = addSamplerMix(
      createDefaultProject(),
      { bpm: 120, lanes: [], stepsPerBar: 16 },
      "Beat A",
    )
    const samplerTrack = getSamplerTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectSamplerTrackMixEditing({ applyUpdate }),
    )

    act(() => {
      result.current.updateSamplerTrackMutedHandler(samplerTrack.id, true)
      result.current.updateSamplerTrackSoloHandler(samplerTrack.id, true)
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const muteUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const soloUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    expect(getSamplerTracks(muteUpdater(project).timeline)[0].muted).toBe(true)
    expect(getSamplerTracks(soloUpdater(project).timeline)[0].solo).toBe(true)
  })
})
