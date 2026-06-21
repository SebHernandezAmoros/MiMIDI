import type {
  AudioClip,
  MidiClip,
  MidiTrack,
  ProjectTrackType,
  SamplerClip,
} from "./projectTypes"

export function createMidiClip(startTime = 0): MidiClip {
  return { id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, notes: [], startTime }
}

export function createSamplerClip(startTime = 0): SamplerClip {
  return { id: `sclip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, startTime }
}

export function createAudioClip(startTime = 0): AudioClip {
  return { id: `aclip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, startTime }
}

export function createProjectTrack(
  index: number,
  trackType: ProjectTrackType = "melodic",
): MidiTrack {
  return {
    kind: "midi",
    clips: [],
    envelope: {
      attack: 0.02,
      decay: 0.12,
      sustain: 0.68,
      release: 0.24,
    },
    id: `track-${index}`,
    instrumentId: "pure-sine",
    muted: false,
    name: `Track ${index}`,
    noteTimelineDuration: 8,
    pan: 0,
    solo: false,
    trackType,
    volumeAutomation: {
      enabled: false,
      points: [
        { time: 0, value: 1 },
        { time: 4, value: 1 },
      ],
    },
    volume: 1,
  }
}
