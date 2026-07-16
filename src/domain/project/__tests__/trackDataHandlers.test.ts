import { describe, expect, it } from "vitest"

import {
  audioClipTrackDataHandler,
  getTrackTimelineClips,
  getTrackDataHandler,
  midiTrackDataHandler,
  samplerTrackDataHandler,
  trackDataHandlers,
} from "../trackDataHandlers"
import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
} from "../projectTypes"

function createMidiTrack(): MidiTrack {
  return {
    kind: "midi",
    clips: [
      {
        id: "clip-a",
        startTime: 1.25,
        notes: [
          {
            id: "note-a",
            note: "C4",
            startTime: 0.5,
            duration: 1.25,
            velocity: 0.9,
            instrumentId: "pure-sine",
          },
        ],
      },
    ],
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.8,
      release: 0.2,
    },
    id: "track-midi",
    instrumentId: "pure-sine",
    muted: false,
    name: "Midi",
    noteTimelineDuration: 8,
    pan: 0,
    solo: false,
    trackType: "melodic",
    volumeAutomation: { enabled: false, points: [] },
    volume: 1,
  }
}

function createSamplerTrack(): SamplerTrack {
  return {
    kind: "sampler",
    clips: [{ id: "sample-clip", startTime: 2 }],
    id: "track-sampler",
    muted: false,
    name: "Sampler",
    pattern: {
      bpm: 120,
      stepsPerBar: 16,
      lanes: [],
    },
    solo: false,
  }
}

function createAudioClipTrack(): AudioClipTrack {
  return {
    kind: "audio-clip",
    clips: [{ id: "audio-clip", startTime: 3 }],
    dbId: "audio-db",
    duration: 4.5,
    id: "track-audio",
    muted: false,
    name: "Audio",
  }
}

describe("trackDataHandlers", () => {
  it("describes MIDI timeline clips and capabilities", () => {
    const track = createMidiTrack()

    expect(midiTrackDataHandler.kind).toBe("midi")
    expect(midiTrackDataHandler.getClips(track)).toEqual([
      { id: "clip-a", startTime: 1.25 },
    ])
    expect(midiTrackDataHandler.getClipDuration(track, "clip-a")).toBe(1.75)
    expect(midiTrackDataHandler.canMute).toBe(true)
    expect(midiTrackDataHandler.canSolo).toBe(true)
    expect(midiTrackDataHandler.canDeleteClip).toBe(true)
    expect(midiTrackDataHandler.canDuplicateClip).toBe(true)
    expect(midiTrackDataHandler.canTrim).toBe(false)
  })

  it("describes sampler timeline clips and capabilities", () => {
    const track = createSamplerTrack()

    expect(samplerTrackDataHandler.kind).toBe("sampler")
    expect(samplerTrackDataHandler.getClips(track)).toEqual([
      { id: "sample-clip", startTime: 2 },
    ])
    expect(samplerTrackDataHandler.getClipDuration(track, "sample-clip")).toBe(2)
    expect(samplerTrackDataHandler.canMute).toBe(true)
    expect(samplerTrackDataHandler.canSolo).toBe(true)
    expect(samplerTrackDataHandler.canDeleteClip).toBe(true)
    expect(samplerTrackDataHandler.canDuplicateClip).toBe(true)
    expect(samplerTrackDataHandler.canTrim).toBe(false)
  })

  it("describes audio timeline clips without inventing unsupported capabilities", () => {
    const track = createAudioClipTrack()

    expect(audioClipTrackDataHandler.kind).toBe("audio-clip")
    expect(audioClipTrackDataHandler.getClips(track)).toEqual([
      { id: "audio-clip", startTime: 3 },
    ])
    expect(audioClipTrackDataHandler.getClipDuration(track, "audio-clip")).toBe(4.5)
    expect(audioClipTrackDataHandler.canMute).toBe(true)
    expect(audioClipTrackDataHandler.canSolo).toBe(false)
    expect(audioClipTrackDataHandler.canDeleteClip).toBe(false)
    expect(audioClipTrackDataHandler.canDuplicateClip).toBe(false)
    expect(audioClipTrackDataHandler.canTrim).toBe(false)
  })

  it("resolves handlers by track kind", () => {
    expect(trackDataHandlers.map((handler) => handler.kind)).toEqual([
      "midi",
      "sampler",
      "audio-clip",
    ])
    expect(getTrackDataHandler(createMidiTrack())).toBe(midiTrackDataHandler)
    expect(getTrackDataHandler(createSamplerTrack())).toBe(samplerTrackDataHandler)
    expect(getTrackDataHandler(createAudioClipTrack())).toBe(audioClipTrackDataHandler)
  })

  it("normalizes clips with durations through the track handler registry", () => {
    expect(getTrackTimelineClips(createMidiTrack())).toEqual([
      { duration: 1.75, id: "clip-a", startTime: 1.25 },
    ])
    expect(getTrackTimelineClips(createSamplerTrack())).toEqual([
      { duration: 2, id: "sample-clip", startTime: 2 },
    ])
    expect(getTrackTimelineClips(createAudioClipTrack())).toEqual([
      { duration: 4.5, id: "audio-clip", startTime: 3 },
    ])
  })
})
