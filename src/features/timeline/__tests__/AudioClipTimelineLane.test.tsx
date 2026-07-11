import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AudioClipTrack } from "../../../domain/project/projectTypes"
import { AudioClipTimelineLane } from "../AudioClipTimelineLane"
import { createTrackTimelineLaneViewModel } from "../trackTimelineViewModel"

function createAudioClipTrack(): AudioClipTrack {
  return {
    kind: "audio-clip",
    clips: [{ id: "audio-clip", startTime: 2 }],
    dbId: "audio-db",
    duration: 4,
    id: "audio-track",
    muted: true,
    name: "Audio Track",
  }
}

describe("AudioClipTimelineLane", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders audio clip lane metadata and delegates interactions", () => {
    const track = createAudioClipTrack()
    const laneViewModel = createTrackTimelineLaneViewModel(track)
    const onSelectLane = vi.fn()
    const onClipPointerDown = vi.fn()

    const { container } = render(
      <AudioClipTimelineLane
        laneViewModel={laneViewModel}
        onClipPointerDown={onClipPointerDown}
        onSelectLane={onSelectLane}
        playheadTime={3}
        selectedLaneId="audio-track"
        timelineLength={12}
        track={track}
      />,
    )

    fireEvent.click(screen.getByRole("button"))
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" })
    const clipElement = container.querySelector(".track-timeline-clip")
    expect(clipElement).toBeTruthy()
    fireEvent.pointerDown(clipElement as Element)

    expect(screen.getByText(/4\.0s.*audio.*1 clip/)).toBeTruthy()
    expect(screen.getByText("Mute")).toBeTruthy()
    expect(container.querySelector(".track-timeline-lane-mix-active")).toBeTruthy()
    expect(container.querySelector(".track-timeline-clip-playing")).toBeTruthy()
    expect(onSelectLane).toHaveBeenCalledWith("audio-track")
    expect(onClipPointerDown).toHaveBeenCalledWith(
      expect.any(Object),
      track,
      track.clips[0],
    )
  })
})
