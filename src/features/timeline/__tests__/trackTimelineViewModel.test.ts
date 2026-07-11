import { describe, expect, it } from "vitest"

import {
  createTrackTimelineLaneGroups,
  createTrackTimelineLaneViewModel,
} from "../trackTimelineViewModel"
import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
} from "../../../domain/project/projectTypes"

function createMidiTrack(): MidiTrack {
  return {
    kind: "midi",
    clips: [
      {
        id: "empty-clip",
        notes: [],
        startTime: 0,
      },
      {
        id: "filled-clip",
        notes: [
          {
            duration: 1,
            id: "note-a",
            instrumentId: "pure-sine",
            note: "C4",
            startTime: 0.25,
            velocity: 1,
          },
        ],
        startTime: 2,
      },
    ],
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.8,
      release: 0.2,
    },
    id: "midi-track",
    instrumentId: "pure-sine",
    muted: false,
    name: "Midi Track",
    noteTimelineDuration: 8,
    pan: 0,
    solo: false,
    trackType: "melodic",
    volume: 1,
    volumeAutomation: { enabled: false, points: [] },
  }
}

function createSamplerTrack(): SamplerTrack {
  return {
    kind: "sampler",
    clips: [{ id: "sampler-clip", startTime: 1 }],
    id: "sampler-track",
    muted: false,
    name: "Sampler Track",
    pattern: {
      bpm: 120,
      lanes: [],
      stepsPerBar: 16,
    },
  }
}

function createAudioClipTrack(): AudioClipTrack {
  return {
    kind: "audio-clip",
    clips: [{ id: "audio-clip", startTime: 3 }],
    dbId: "audio-db",
    duration: 4,
    id: "audio-track",
    muted: false,
    name: "Audio Track",
  }
}

describe("trackTimelineViewModel", () => {
  it("builds MIDI lane data with only filled clips", () => {
    const viewModel = createTrackTimelineLaneViewModel(createMidiTrack())

    expect(viewModel.id).toBe("midi-track")
    expect(viewModel.kind).toBe("midi")
    expect(viewModel.muted).toBe(false)
    expect(viewModel.name).toBe("Midi Track")
    expect(viewModel.summaryLabel).toBe("1 notes · 1 clip")
    expect(viewModel.capabilities).toEqual({
      canDuplicateClip: true,
      canMute: true,
      canSolo: true,
      canTrim: false,
    })
    expect(viewModel.definition).toEqual({
      kind: "midi",
      role: "notes",
    })
    expect(viewModel.clips).toEqual([
      { duration: 1.25, id: "filled-clip", startTime: 2 },
    ])
    expect(viewModel.clipsById.get("filled-clip")).toEqual({
      duration: 1.25,
      id: "filled-clip",
      startTime: 2,
    })
    expect(viewModel.clipsById.has("empty-clip")).toBe(false)
  })

  it("builds sampler lane data from normalized clips", () => {
    const viewModel = createTrackTimelineLaneViewModel(createSamplerTrack())

    expect(viewModel.id).toBe("sampler-track")
    expect(viewModel.kind).toBe("sampler")
    expect(viewModel.muted).toBe(false)
    expect(viewModel.name).toBe("Sampler Track")
    expect(viewModel.summaryLabel).toBe("120 BPM · 16 steps · 1 clip")
    expect(viewModel.capabilities).toEqual({
      canDuplicateClip: true,
      canMute: true,
      canSolo: true,
      canTrim: false,
    })
    expect(viewModel.definition).toEqual({
      kind: "sampler",
      role: "pattern",
    })
    expect(viewModel.clips).toEqual([
      { duration: 2, id: "sampler-clip", startTime: 1 },
    ])
    expect(viewModel.clipsById.get("sampler-clip")?.duration).toBe(2)
  })

  it("builds audio lane data from normalized clips", () => {
    const viewModel = createTrackTimelineLaneViewModel(createAudioClipTrack())

    expect(viewModel.id).toBe("audio-track")
    expect(viewModel.kind).toBe("audio-clip")
    expect(viewModel.muted).toBe(false)
    expect(viewModel.name).toBe("Audio Track")
    expect(viewModel.summaryLabel).toBe("4.0s · audio · 1 clip")
    expect(viewModel.capabilities).toEqual({
      canDuplicateClip: false,
      canMute: true,
      canSolo: false,
      canTrim: false,
    })
    expect(viewModel.definition).toEqual({
      kind: "audio-clip",
      role: "audio",
    })
    expect(viewModel.clips).toEqual([
      { duration: 4, id: "audio-clip", startTime: 3 },
    ])
    expect(viewModel.clipsById.get("audio-clip")?.duration).toBe(4)
  })

  it("groups only visible timeline lanes by track kind", () => {
    const midiTrack = createMidiTrack()
    const emptyMidiTrack = {
      ...createMidiTrack(),
      clips: [{ id: "empty-only", notes: [], startTime: 0 }],
      id: "empty-midi-track",
    }
    const stepsTrack = {
      ...createMidiTrack(),
      id: "steps-track",
      trackType: "steps" as const,
    }
    const samplerTrack = {
      ...createSamplerTrack(),
      pattern: {
        bpm: 120,
        lanes: [{ slotDbId: "slot-1", steps: [{ active: true }] }],
        stepsPerBar: 16,
      },
    }
    const inactiveSamplerTrack = {
      ...createSamplerTrack(),
      id: "inactive-sampler-track",
      pattern: {
        bpm: 120,
        lanes: [{ slotDbId: "slot-2", steps: [{ active: false }] }],
        stepsPerBar: 16,
      },
    }
    const audioClipTrack = createAudioClipTrack()

    const groups = createTrackTimelineLaneGroups([
      midiTrack,
      emptyMidiTrack,
      stepsTrack,
      samplerTrack,
      inactiveSamplerTrack,
      audioClipTrack,
    ])

    expect(groups.midi.map((lane) => lane.track.id)).toEqual(["midi-track"])
    expect(groups.sampler.map((lane) => lane.track.id)).toEqual([
      "sampler-track",
    ])
    expect(groups.audioClip.map((lane) => lane.track.id)).toEqual([
      "audio-track",
    ])
    expect(groups.midi[0]?.viewModel.kind).toBe("midi")
    expect(groups.sampler[0]?.viewModel.kind).toBe("sampler")
    expect(groups.audioClip[0]?.viewModel.kind).toBe("audio-clip")
  })
})
