import { describe, expect, it } from "vitest"

import {
  preventTrackTimelineClipOverlap,
  resolveTrackTimelineDraggedClipStart,
} from "../trackTimelineDrag"

describe("preventTrackTimelineClipOverlap", () => {
  it("clamps clip start time to zero", () => {
    expect(
      preventTrackTimelineClipOverlap({
        clipDuration: 1,
        initialStart: 0.5,
        newStart: -2,
        otherClips: [],
      }),
    ).toBe(0)
  })

  it("caps movement before the next clip", () => {
    expect(
      preventTrackTimelineClipOverlap({
        clipDuration: 1,
        initialStart: 0,
        newStart: 3,
        otherClips: [{ duration: 1, start: 2 }],
      }),
    ).toBe(1)
  })

  it("floors movement after the previous clip", () => {
    expect(
      preventTrackTimelineClipOverlap({
        clipDuration: 1,
        initialStart: 3,
        newStart: 0,
        otherClips: [{ duration: 1, start: 1 }],
      }),
    ).toBe(2)
  })
})

describe("resolveTrackTimelineDraggedClipStart", () => {
  it("converts pointer movement to seconds and prevents overlap", () => {
    expect(
      resolveTrackTimelineDraggedClipStart({
        clipDuration: 1,
        initialStart: 0,
        otherClips: [{ duration: 1, start: 2 }],
        pointerDeltaPixels: 100,
        secondsPerPixel: 0.05,
      }),
    ).toBe(1)
  })

  it("allows movement when no overlap is found", () => {
    expect(
      resolveTrackTimelineDraggedClipStart({
        clipDuration: 1,
        initialStart: 1,
        otherClips: [],
        pointerDeltaPixels: 20,
        secondsPerPixel: 0.1,
      }),
    ).toBe(3)
  })

  it("supports sampler clip drag with a shared pattern duration", () => {
    expect(
      resolveTrackTimelineDraggedClipStart({
        clipDuration: 2,
        initialStart: 4,
        otherClips: [
          { duration: 2, start: 0 },
          { duration: 2, start: 8 },
        ],
        pointerDeltaPixels: -40,
        secondsPerPixel: 0.1,
      }),
    ).toBe(2)
  })

  it("supports audio clip drag with track duration bounds", () => {
    expect(
      resolveTrackTimelineDraggedClipStart({
        clipDuration: 3,
        initialStart: 2,
        otherClips: [{ duration: 3, start: 6 }],
        pointerDeltaPixels: 80,
        secondsPerPixel: 0.05,
      }),
    ).toBe(3)
  })
})
