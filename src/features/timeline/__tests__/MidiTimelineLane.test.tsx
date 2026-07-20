import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { MidiTrack } from "../../../domain/project/projectTypes"
import { MidiTimelineLane } from "../MidiTimelineLane"
import { createTrackTimelineLaneViewModel } from "../trackTimelineViewModel"

function createMidiTrack(): MidiTrack {
  return {
    kind: "midi",
    clips: [
      {
        id: "midi-clip",
        startTime: 2,
        notes: [
          {
            duration: 1,
            id: "note-1",
            instrumentId: "pure-sine",
            note: "C4",
            startTime: 0,
            velocity: 0.8,
          },
        ],
      },
    ],
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.2 },
    id: "midi-track",
    instrumentId: "pure-sine",
    muted: true,
    name: "Lead Track",
    noteTimelineDuration: 8,
    pan: 0,
    solo: false,
    trackType: "melodic",
    volume: 0.9,
    volumeAutomation: { enabled: false, points: [] },
  }
}

describe("MidiTimelineLane", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders MIDI lane metadata and delegates lane and clip interactions", () => {
    const track = createMidiTrack()
    const laneViewModel = createTrackTimelineLaneViewModel(track)
    const onClipPointerDown = vi.fn()
    const onSelectTrack = vi.fn()

    const { container } = render(
      <MidiTimelineLane
        activeLabel="Activo"
        activeTrackId="midi-track"
        laneViewModel={laneViewModel}
        muteLabel="Silencio"
        onClipPointerDown={onClipPointerDown}
        onSelectTrack={onSelectTrack}
        playheadTime={3}
        selectedClipId={{ clipId: "midi-clip", trackId: "midi-track" }}
        selectedLaneId={null}
        timelineLength={10}
        track={track}
      />,
    )

    fireEvent.click(screen.getByRole("button"))
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" })
    const clipElement = container.querySelector(".track-timeline-clip")
    expect(clipElement).toBeTruthy()
    fireEvent.pointerDown(clipElement as Element)

    expect(screen.getByText("Lead Track")).toBeTruthy()
    expect(screen.getByText(laneViewModel.summaryLabel)).toBeTruthy()
    expect(screen.getByText("Silencio")).toBeTruthy()
    expect(screen.getByText("Activo")).toBeTruthy()
    expect(container.querySelector(".track-timeline-lane-active")).toBeTruthy()
    expect(container.querySelector(".track-timeline-lane-muted")).toBeTruthy()
    expect(container.querySelector(".track-timeline-clip-selected")).toBeTruthy()
    expect(container.querySelector(".track-timeline-clip-playing")).toBeTruthy()
    expect(onSelectTrack).toHaveBeenCalledWith("midi-track")
    expect(onClipPointerDown).toHaveBeenCalledWith(
      expect.any(Object),
      track,
      track.clips[0],
    )
  })

  it("selects the source track and focuses the virtual percussion lane", () => {
    const track = createMidiTrack()
    const laneViewModel = {
      ...createTrackTimelineLaneViewModel(track),
      id: "midi-track:beats",
      laneE2e: "edit-track-percussion-beats-lane",
      name: "Pad 1 - Beats",
      sourceTrackId: "midi-track",
    }
    const onSelectLane = vi.fn()
    const onSelectTrack = vi.fn()

    const { container } = render(
      <MidiTimelineLane
        activeLabel="Activo"
        activeTrackId="midi-track"
        laneViewModel={laneViewModel}
        muteLabel="Silencio"
        onClipPointerDown={vi.fn()}
        onSelectLane={onSelectLane}
        onSelectTrack={onSelectTrack}
        playheadTime={null}
        selectedClipId={null}
        selectedLaneId="midi-track:beats"
        timelineLength={10}
        track={track}
      />,
    )

    fireEvent.click(screen.getByRole("button"))
    fireEvent.keyDown(screen.getByRole("button"), { key: " " })

    expect(container.querySelector(".track-timeline-lane-active")).toBeTruthy()
    expect(onSelectTrack).toHaveBeenCalledWith("midi-track")
    expect(onSelectLane).toHaveBeenCalledWith("midi-track:beats")
  })
})
