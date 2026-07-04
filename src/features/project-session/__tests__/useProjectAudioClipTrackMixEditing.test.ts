import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { addAudioClipTrack } from "../../../domain/project/audioClipTrackMutations"
import { getAudioClipTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectAudioClipTrackMixEditing } from "../useProjectAudioClipTrackMixEditing"

describe("useProjectAudioClipTrackMixEditing", () => {
  it("routes audio clip track mute updates through project history", () => {
    const project = addAudioClipTrack(createDefaultProject(), {
      dbId: "sample-1",
      duration: 1,
      name: "Clip A",
    })
    const audioClipTrack = getAudioClipTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectAudioClipTrackMixEditing({ applyUpdate }),
    )

    act(() => {
      result.current.updateAudioClipTrackMutedHandler(
        audioClipTrack.id,
        true,
      )
    })

    expect(applyUpdate).toHaveBeenCalledOnce()

    const updater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    expect(getAudioClipTracks(updater(project).timeline)[0].muted).toBe(true)
  })
})
