import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SamplerTrack } from "../../../domain/project/projectTypes"
import { SamplerTimelineLane } from "../SamplerTimelineLane"
import { createTrackTimelineLaneViewModel } from "../trackTimelineViewModel"

function createSamplerTrack(): SamplerTrack {
  return {
    kind: "sampler",
    clips: [{ id: "sampler-clip", startTime: 2 }],
    id: "sampler-track",
    muted: true,
    name: "Sampler Mix",
    pattern: {
      bpm: 120,
      lanes: [{ slotDbId: "slot-1", steps: [{ active: true }] }],
      stepsPerBar: 16,
    },
  }
}

describe("SamplerTimelineLane", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders sampler lane metadata and delegates lane and clip interactions", () => {
    const track = createSamplerTrack()
    const laneViewModel = createTrackTimelineLaneViewModel(track)
    const onClipPointerDown = vi.fn()
    const onSelectLane = vi.fn()
    const onStartEditing = vi.fn()

    const { container } = render(
      <SamplerTimelineLane
        editingMixName=""
        isEditing={false}
        laneViewModel={laneViewModel}
        onCancelEditing={vi.fn()}
        onClipPointerDown={onClipPointerDown}
        onCommitEditing={vi.fn()}
        onEditingMixNameChange={vi.fn()}
        onSelectLane={onSelectLane}
        onStartEditing={onStartEditing}
        playheadTime={3}
        renameDoubleLabel="Doble click para renombrar"
        selectedClipId={{ clipId: "sampler-clip", trackId: "sampler-track" }}
        selectedLaneId="sampler-track"
        timelineLength={12}
        track={track}
      />,
    )

    fireEvent.click(screen.getByRole("button"))
    fireEvent.doubleClick(screen.getByTitle("Doble click para renombrar"))
    const clipElement = container.querySelector(".track-timeline-clip")
    expect(clipElement).toBeTruthy()
    fireEvent.pointerDown(clipElement as Element)

    expect(screen.getByText(/120 BPM.*16 steps.*1 clip/)).toBeTruthy()
    expect(screen.getByText("Mute")).toBeTruthy()
    expect(container.querySelector(".track-timeline-lane-mix-active")).toBeTruthy()
    expect(container.querySelector(".track-timeline-clip-selected")).toBeTruthy()
    expect(container.querySelector(".track-timeline-clip-playing")).toBeTruthy()
    expect(onSelectLane).toHaveBeenCalledWith("sampler-track")
    expect(onStartEditing).toHaveBeenCalledWith("sampler-track", "Sampler Mix")
    expect(onClipPointerDown).toHaveBeenCalledWith(
      expect.any(Object),
      track,
      track.clips[0],
    )
  })

  it("keeps inline mix name editing controlled by the parent", () => {
    const track = createSamplerTrack()
    const laneViewModel = createTrackTimelineLaneViewModel(track)
    const onCancelEditing = vi.fn()
    const onCommitEditing = vi.fn()
    const onEditingMixNameChange = vi.fn()

    const { rerender } = render(
      <SamplerTimelineLane
        editingMixName="Renamed Mix"
        isEditing
        laneViewModel={laneViewModel}
        onCancelEditing={onCancelEditing}
        onClipPointerDown={vi.fn()}
        onCommitEditing={onCommitEditing}
        onEditingMixNameChange={onEditingMixNameChange}
        onSelectLane={vi.fn()}
        onStartEditing={vi.fn()}
        playheadTime={null}
        renameDoubleLabel="Doble click para renombrar"
        selectedClipId={null}
        selectedLaneId={null}
        timelineLength={12}
        track={track}
      />,
    )

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Changed Mix" },
    })
    fireEvent.blur(screen.getByRole("textbox"))

    expect(onEditingMixNameChange).toHaveBeenCalledWith("Changed Mix")
    expect(onCommitEditing).toHaveBeenCalledWith("sampler-track", "Renamed Mix")

    rerender(
      <SamplerTimelineLane
        editingMixName="Renamed Mix"
        isEditing
        laneViewModel={laneViewModel}
        onCancelEditing={onCancelEditing}
        onClipPointerDown={vi.fn()}
        onCommitEditing={onCommitEditing}
        onEditingMixNameChange={onEditingMixNameChange}
        onSelectLane={vi.fn()}
        onStartEditing={vi.fn()}
        playheadTime={null}
        renameDoubleLabel="Doble click para renombrar"
        selectedClipId={null}
        selectedLaneId={null}
        timelineLength={12}
        track={track}
      />,
    )

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" })

    expect(onCancelEditing).toHaveBeenCalled()
  })
})
