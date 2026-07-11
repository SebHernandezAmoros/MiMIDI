import { describe, expect, it } from "vitest"

import {
  getMidiTrackScheduledNotes,
  midiTrackScheduler,
} from "../midiTrackScheduler"
import type { MidiTrack } from "../../../domain/project/projectTypes"

function createMidiTrack(): MidiTrack {
  return {
    clips: [
      {
        id: "clip-a",
        notes: [
          {
            duration: 0.5,
            id: "note-a",
            instrumentId: "pure-sine",
            note: "C4",
            startTime: 0.25,
            velocity: 1,
          },
        ],
        startTime: 2,
      },
      {
        id: "clip-b",
        notes: [],
        startTime: 8,
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
    kind: "midi",
    muted: false,
    name: "Lead",
    noteTimelineDuration: 8,
    pan: 0,
    solo: false,
    trackType: "melodic",
    volume: 1,
    volumeAutomation: { enabled: false, points: [] },
  }
}

describe("midiTrackScheduler", () => {
  it("describes the MIDI scheduler kind", () => {
    expect(midiTrackScheduler.kind).toBe("midi")
  })

  it("resolves scheduled notes for one MIDI track", () => {
    const track = createMidiTrack()
    const [scheduledNote] = getMidiTrackScheduledNotes(track)

    expect(scheduledNote).toMatchObject({
      absoluteStartTime: 2.25,
      clip: track.clips[0],
      note: track.clips[0].notes[0],
      relativeStartTime: 0.25,
      track,
    })
    expect(getMidiTrackScheduledNotes(track)).toHaveLength(1)
  })
})
