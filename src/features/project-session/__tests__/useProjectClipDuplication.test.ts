import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { addSamplerMix } from "../../../domain/project/samplerTrackMutations"
import {
  getMidiTracks,
  getSamplerTracks,
} from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectClipDuplication } from "../useProjectClipDuplication"

describe("useProjectClipDuplication", () => {
  it("routes MIDI and sampler clip duplication through project history", () => {
    const initialProject = createDefaultProject()
    const midiTrack = getMidiTracks(initialProject.timeline)[0]
    const withMidiClip = appendNoteToTrack(initialProject, midiTrack.id, {
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 0,
      velocity: 0.9,
    })
    const project = addSamplerMix(
      withMidiClip,
      { bpm: 120, lanes: [], stepsPerBar: 16 },
      "Beat A",
    )
    const midiClip = getMidiTracks(project.timeline)[0].clips[0]
    const samplerTrack = getSamplerTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectClipDuplication({ applyUpdate }),
    )

    act(() => {
      result.current.duplicateMidiClipHandler(midiTrack.id, midiClip.id)
      result.current.duplicateSamplerClipHandler(
        samplerTrack.id,
        samplerTrack.clips[0].id,
      )
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const midiUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const samplerUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    expect(getMidiTracks(midiUpdater(project).timeline)[0].clips).toHaveLength(2)
    expect(
      getSamplerTracks(samplerUpdater(project).timeline)[0].clips,
    ).toHaveLength(2)
  })
})
