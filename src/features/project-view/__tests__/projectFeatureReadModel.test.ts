import { describe, expect, it } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { addSamplerMix } from "../../../domain/project/samplerTrackMutations"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultPattern } from "../../../engine/audio/sequencerModel"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { resolveProjectFeatureReadModel } from "../projectFeatureReadModel"

describe("project feature read model", () => {
  it("summarizes the initial project without counting steps tracks", () => {
    const project = createDefaultProject()

    expect(resolveProjectFeatureReadModel(project)).toEqual({
      hasPlayableContent: false,
      noteCount: 0,
      samplerMixCount: 0,
      trackCount: 2,
    })
  })

  it("summarizes playable notes and sampler mixes", () => {
    const project = createDefaultProject()
    const melodicTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "melodic",
    )!
    const stepsTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "steps",
    )!
    const withMelodicNote = appendNoteToTrack(project, melodicTrack.id, {
      duration: 0.5,
      id: "melodic-note",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 0,
      velocity: 0.9,
    })
    const withStepsNote = appendNoteToTrack(
      withMelodicNote,
      stepsTrack.id,
      {
        duration: 0.25,
        id: "steps-note",
        instrumentId: "pure-sine",
        note: "C2",
        startTime: 0,
        velocity: 0.8,
      },
    )
    const withSampler = addSamplerMix(
      withStepsNote,
      createDefaultPattern(),
      "Beat A",
    )

    expect(resolveProjectFeatureReadModel(withSampler)).toEqual({
      hasPlayableContent: true,
      noteCount: 1,
      samplerMixCount: 1,
      trackCount: 2,
    })
  })
})
