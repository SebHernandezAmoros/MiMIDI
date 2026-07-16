import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { MidiClip } from "../../../domain/project/projectTypes"
import { MidiTimelineClip } from "../MidiTimelineClip"

function createMidiClip(): MidiClip {
  return {
    id: "midi-clip",
    startTime: 2,
    notes: [
      {
        duration: 0.5,
        id: "note-1",
        instrumentId: "pure-sine",
        note: "C4",
        startTime: 0.25,
        velocity: 0.8,
      },
    ],
  }
}

describe("MidiTimelineClip", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders MIDI clip state and delegates pointer down", () => {
    const clip = createMidiClip()
    const onPointerDown = vi.fn()

    const { container } = render(
      <MidiTimelineClip
        clip={clip}
        clipDuration={4}
        isPlaying
        isSelected
        onPointerDown={onPointerDown}
        timelineLength={10}
      />,
    )

    const clipElement = container.querySelector(".track-timeline-clip")
    expect(clipElement).toBeTruthy()
    fireEvent.pointerDown(clipElement as Element)

    expect(clipElement?.classList.contains("track-timeline-clip-selected")).toBe(true)
    expect(clipElement?.classList.contains("track-timeline-clip-playing")).toBe(true)
    expect((clipElement as HTMLElement).style.getPropertyValue(
      "--track-clip-duration",
    )).toBe("0.4")
    expect((clipElement as HTMLElement).style.getPropertyValue(
      "--track-clip-start",
    )).toBe("0.2")
    expect(container.querySelector(".track-timeline-note-marker")).toBeTruthy()
    expect(onPointerDown).toHaveBeenCalledWith(expect.any(Object), clip)
  })
})
