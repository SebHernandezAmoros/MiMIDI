import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { addAudioClipTrack } from "../../../domain/project/audioClipTrackMutations"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { addSamplerMix } from "../../../domain/project/samplerTrackMutations"
import {
  getAudioClipTracks,
  getMidiTracks,
  getSamplerTracks,
} from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectClipStartTimeEditing } from "../useProjectClipStartTimeEditing"

describe("useProjectClipStartTimeEditing", () => {
  it("snaps clip positions and routes transient and committed updates through history", () => {
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
    const withSamplerClip = addSamplerMix(
      withMidiClip,
      { bpm: 120, lanes: [], stepsPerBar: 16 },
      "Beat A",
    )
    const project = addAudioClipTrack(withSamplerClip, {
      dbId: "sample-1",
      duration: 1,
      name: "Clip A",
    })
    const midiClip = getMidiTracks(project.timeline)[0].clips[0]
    const samplerTrack = getSamplerTracks(project.timeline)[0]
    const audioTrack = getAudioClipTracks(project.timeline)[0]
    const applyTransientUpdate = vi.fn()
    const commitTransientUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectClipStartTimeEditing({
        applyTransientUpdate,
        commitTransientUpdate,
        timelineSnapEnabled: true,
        timelineSnapStep: 0.25,
      }),
    )

    act(() => {
      result.current.updateMidiClipStartTimeHandler(
        midiTrack.id,
        midiClip.id,
        -0.1,
        "transient",
      )
      result.current.updateSamplerClipStartTimeHandler(
        samplerTrack.id,
        samplerTrack.clips[0].id,
        0.38,
      )
      result.current.updateAudioClipStartTimeHandler(
        audioTrack.id,
        audioTrack.clips[0].id,
        0.26,
      )
    })

    expect(applyTransientUpdate).toHaveBeenCalledOnce()
    expect(commitTransientUpdate).toHaveBeenCalledTimes(2)

    const midiUpdater = applyTransientUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const samplerUpdater = commitTransientUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const audioUpdater = commitTransientUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    expect(getMidiTracks(midiUpdater(project).timeline)[0].clips[0].startTime).toBe(0)
    expect(
      getSamplerTracks(samplerUpdater(project).timeline)[0].clips[0].startTime,
    ).toBe(0.5)
    expect(
      getAudioClipTracks(audioUpdater(project).timeline)[0].clips[0].startTime,
    ).toBe(0.25)
  })
})
