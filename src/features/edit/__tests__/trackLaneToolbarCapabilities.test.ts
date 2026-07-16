import { describe, expect, it } from "vitest"

import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
} from "../../../domain/project/projectTypes"
import {
  resolveActiveTrackLaneContext,
  resolveSelectedTrackLaneClipDeletion,
  resolveSelectedTrackLaneClipDeleteCommand,
  resolveTrackLaneDuplicateClipCommand,
  resolveTrackLaneDeleteClipAction,
  resolveTrackLaneDuplicateClipAvailability,
  resolveTrackLaneMuteSoloState,
  resolveTrackLaneToolbarCapabilities,
} from "../trackLaneToolbarCapabilities"

function createMidiTrack(): MidiTrack {
  return {
    kind: "midi",
    clips: [],
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 },
    id: "midi-track",
    instrumentId: "pure-sine",
    muted: false,
    name: "Midi",
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
    clips: [],
    id: "sampler-track",
    muted: false,
    name: "Sampler",
    pattern: {
      bpm: 120,
      lanes: [],
      stepsPerBar: 16,
    },
    solo: false,
  }
}

function createAudioClipTrack(): AudioClipTrack {
  return {
    kind: "audio-clip",
    clips: [],
    dbId: "audio-db",
    duration: 3,
    id: "audio-track",
    muted: false,
    name: "Audio",
  }
}

describe("resolveTrackLaneToolbarCapabilities", () => {
  it("uses track data handler capabilities for MIDI lanes", () => {
    expect(resolveTrackLaneToolbarCapabilities(createMidiTrack())).toEqual({
      canDeleteClip: true,
      canDuplicateClip: true,
      canMute: true,
      canSolo: true,
      canTrim: false,
    })
  })

  it("uses track data handler capabilities for sampler lanes", () => {
    expect(resolveTrackLaneToolbarCapabilities(createSamplerTrack())).toEqual({
      canDeleteClip: true,
      canDuplicateClip: true,
      canMute: true,
      canSolo: true,
      canTrim: false,
    })
  })

  it("keeps audio clip toolbar actions aligned with unsupported capabilities", () => {
    expect(resolveTrackLaneToolbarCapabilities(createAudioClipTrack())).toEqual({
      canDeleteClip: false,
      canDuplicateClip: false,
      canMute: true,
      canSolo: false,
      canTrim: false,
    })
  })
})

describe("resolveActiveTrackLaneContext", () => {
  it("resolves the selected sampler lane before other tracks", () => {
    const primaryTrack = createMidiTrack()
    const samplerTrack = createSamplerTrack()
    const context = resolveActiveTrackLaneContext({
      primaryTrack,
      selectedLaneId: samplerTrack.id,
      timeline: [primaryTrack, samplerTrack, createAudioClipTrack()],
    })

    expect(context.activeSamplerTrack).toBe(samplerTrack)
    expect(context.activeAudioTrack).toBeNull()
    expect(context.activeTimelineTrack).toBe(samplerTrack)
  })

  it("resolves the selected audio clip lane when no sampler lane matches", () => {
    const primaryTrack = createMidiTrack()
    const audioTrack = createAudioClipTrack()
    const context = resolveActiveTrackLaneContext({
      primaryTrack,
      selectedLaneId: audioTrack.id,
      timeline: [primaryTrack, createSamplerTrack(), audioTrack],
    })

    expect(context.activeSamplerTrack).toBeNull()
    expect(context.activeAudioTrack).toBe(audioTrack)
    expect(context.activeTimelineTrack).toBe(audioTrack)
  })

  it("falls back to the primary MIDI track when no selected lane matches", () => {
    const primaryTrack = createMidiTrack()
    const context = resolveActiveTrackLaneContext({
      primaryTrack,
      selectedLaneId: "missing-lane",
      timeline: [primaryTrack, createSamplerTrack(), createAudioClipTrack()],
    })

    expect(context.activeSamplerTrack).toBeNull()
    expect(context.activeAudioTrack).toBeNull()
    expect(context.activeTimelineTrack).toBe(primaryTrack)
  })
})

describe("resolveTrackLaneMuteSoloState", () => {
  it("reads MIDI mute and solo state", () => {
    expect(
      resolveTrackLaneMuteSoloState({
        ...createMidiTrack(),
        muted: true,
        solo: true,
      }),
    ).toEqual({ isMuted: true, isSolo: true })
  })

  it("reads sampler mute and solo state", () => {
    expect(
      resolveTrackLaneMuteSoloState({
        ...createSamplerTrack(),
        muted: true,
        solo: true,
      }),
    ).toEqual({ isMuted: true, isSolo: true })
  })

  it("keeps audio clip solo unsupported while preserving muted state", () => {
    expect(
      resolveTrackLaneMuteSoloState({
        ...createAudioClipTrack(),
        muted: true,
      }),
    ).toEqual({ isMuted: true, isSolo: false })
  })
})

describe("resolveTrackLaneDuplicateClipAvailability", () => {
  it("allows duplication when the lane capability and target clip are both available", () => {
    expect(
      resolveTrackLaneDuplicateClipAvailability({
        capabilities: { canDuplicateClip: true },
        hasDuplicateTargetClip: true,
      }),
    ).toBe(true)
  })

  it("blocks duplication when the lane capability does not support it", () => {
    expect(
      resolveTrackLaneDuplicateClipAvailability({
        capabilities: { canDuplicateClip: false },
        hasDuplicateTargetClip: true,
      }),
    ).toBe(false)
  })

  it("blocks duplication when there is no target clip", () => {
    expect(
      resolveTrackLaneDuplicateClipAvailability({
        capabilities: { canDuplicateClip: true },
        hasDuplicateTargetClip: false,
      }),
    ).toBe(false)
  })
})

describe("resolveTrackLaneDuplicateClipCommand", () => {
  it("resolves a MIDI duplicate command when a MIDI clip is available", () => {
    expect(
      resolveTrackLaneDuplicateClipCommand({
        midiClipId: "clip-a",
        samplerClipId: null,
        track: createMidiTrack(),
      }),
    ).toEqual({
      action: "duplicate-midi-clip",
      clipId: "clip-a",
      trackId: "midi-track",
    })
  })

  it("resolves a sampler duplicate command when a sampler clip is available", () => {
    expect(
      resolveTrackLaneDuplicateClipCommand({
        midiClipId: null,
        samplerClipId: "sampler-clip-a",
        track: createSamplerTrack(),
      }),
    ).toEqual({
      action: "duplicate-sampler-clip",
      clipId: "sampler-clip-a",
      trackId: "sampler-track",
    })
  })

  it("does not resolve duplicate commands for audio clip lanes", () => {
    expect(
      resolveTrackLaneDuplicateClipCommand({
        midiClipId: "clip-a",
        samplerClipId: "sampler-clip-a",
        track: createAudioClipTrack(),
      }),
    ).toBeNull()
  })

  it("does not resolve duplicate commands without a matching clip", () => {
    expect(
      resolveTrackLaneDuplicateClipCommand({
        midiClipId: null,
        samplerClipId: null,
        track: createMidiTrack(),
      }),
    ).toBeNull()
  })
})

describe("resolveTrackLaneDeleteClipAction", () => {
  it("shows and enables delete when the lane supports it and a deletable clip is selected", () => {
    expect(
      resolveTrackLaneDeleteClipAction({
        capabilities: { canDeleteClip: true },
        hasDeletableSelectedClip: true,
      }),
    ).toEqual({ isEnabled: true, isVisible: true })
  })

  it("shows delete disabled when the lane supports it but no deletable clip is selected", () => {
    expect(
      resolveTrackLaneDeleteClipAction({
        capabilities: { canDeleteClip: true },
        hasDeletableSelectedClip: false,
      }),
    ).toEqual({ isEnabled: false, isVisible: true })
  })

  it("hides delete when the lane does not support clip deletion", () => {
    expect(
      resolveTrackLaneDeleteClipAction({
        capabilities: { canDeleteClip: false },
        hasDeletableSelectedClip: true,
      }),
    ).toEqual({ isEnabled: false, isVisible: false })
  })
})

describe("resolveSelectedTrackLaneClipDeletion", () => {
  it("does not allow deletion when there is no selected clip", () => {
    expect(
      resolveSelectedTrackLaneClipDeletion({
        selectedClip: null,
        timeline: [createMidiTrack()],
      }),
    ).toBe(false)
  })

  it("allows deleting a selected MIDI clip when the track has more than one clip", () => {
    expect(
      resolveSelectedTrackLaneClipDeletion({
        selectedClip: { clipId: "clip-a", trackId: "midi-track", type: "midi" },
        timeline: [
          {
            ...createMidiTrack(),
            clips: [
              { id: "clip-a", notes: [], startTime: 0 },
              { id: "clip-b", notes: [], startTime: 1 },
            ],
          },
        ],
      }),
    ).toBe(true)
  })

  it("blocks deleting the last MIDI clip in a track", () => {
    expect(
      resolveSelectedTrackLaneClipDeletion({
        selectedClip: { clipId: "clip-a", trackId: "midi-track", type: "midi" },
        timeline: [
          {
            ...createMidiTrack(),
            clips: [{ id: "clip-a", notes: [], startTime: 0 }],
          },
        ],
      }),
    ).toBe(false)
  })

  it("allows deleting a selected sampler clip when the track has more than one clip", () => {
    expect(
      resolveSelectedTrackLaneClipDeletion({
        selectedClip: {
          clipId: "sampler-clip-a",
          trackId: "sampler-track",
          type: "sampler",
        },
        timeline: [
          {
            ...createSamplerTrack(),
            clips: [
              { id: "sampler-clip-a", startTime: 0 },
              { id: "sampler-clip-b", startTime: 1 },
            ],
          },
        ],
      }),
    ).toBe(true)
  })

  it("blocks deletion when the selected clip track does not exist", () => {
    expect(
      resolveSelectedTrackLaneClipDeletion({
        selectedClip: { clipId: "clip-a", trackId: "missing-track", type: "midi" },
        timeline: [createMidiTrack()],
      }),
    ).toBe(false)
  })
})

describe("resolveSelectedTrackLaneClipDeleteCommand", () => {
  it("returns null when there is no selected clip", () => {
    expect(resolveSelectedTrackLaneClipDeleteCommand(null)).toBeNull()
  })

  it("resolves the command for deleting a selected MIDI clip", () => {
    expect(
      resolveSelectedTrackLaneClipDeleteCommand({
        clipId: "clip-a",
        trackId: "midi-track",
        type: "midi",
      }),
    ).toEqual({
      action: "remove-midi-clip",
      clipId: "clip-a",
      trackId: "midi-track",
    })
  })

  it("resolves the command for deleting a selected sampler clip", () => {
    expect(
      resolveSelectedTrackLaneClipDeleteCommand({
        clipId: "sampler-clip-a",
        trackId: "sampler-track",
        type: "sampler",
      }),
    ).toEqual({
      action: "remove-sampler-clip",
      clipId: "sampler-clip-a",
      trackId: "sampler-track",
    })
  })
})
