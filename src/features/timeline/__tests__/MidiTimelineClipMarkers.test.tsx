import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { MidiClip } from "../../../domain/project/projectTypes"
import { MidiTimelineClipMarkers } from "../MidiTimelineClipMarkers"

function createMidiClip(): MidiClip {
  return {
    id: "midi-clip",
    startTime: 0,
    notes: [
      {
        duration: 0.5,
        id: "late-note",
        instrumentId: "pure-sine",
        note: "C4",
        startTime: 1,
        velocity: 0.8,
      },
      {
        duration: 0.25,
        id: "smc-note",
        instrumentId: "pure-sine",
        note: "D4",
        playbackSource: "smc-pad",
        startTime: 0.25,
        velocity: 1,
      },
    ],
  }
}

describe("MidiTimelineClipMarkers", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders sorted note markers with relative timing styles", () => {
    const { container } = render(
      <MidiTimelineClipMarkers clip={createMidiClip()} clipDuration={2} />,
    )

    const markers = Array.from(
      container.querySelectorAll(".track-timeline-note-marker"),
    )

    expect(markers).toHaveLength(2)
    expect(markers.map((marker) =>
      (marker as HTMLElement).style.getPropertyValue("--track-marker-start"),
    )).toEqual(["0.125", "0.5"])
    expect((markers[0] as HTMLElement).style.getPropertyValue(
      "--track-marker-duration",
    )).toBe("0.125")
  })

  it("marks SMC Pad notes with the dedicated marker class", () => {
    const { container } = render(
      <MidiTimelineClipMarkers clip={createMidiClip()} clipDuration={2} />,
    )

    const smcMarkers = container.querySelectorAll(
      ".track-timeline-note-marker-smc",
    )

    expect(smcMarkers).toHaveLength(1)
  })
})
