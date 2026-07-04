import { describe, expect, it } from "vitest"
import {
  resolveActiveTrackIdAfterTrackListChange,
  resolveTrackIdByOffset,
} from "../projectSessionTrackSelection"

describe("projectSessionTrackSelection", () => {
  const tracks = [
    { id: "track-1" },
    { id: "track-2" },
    { id: "track-3" },
  ]

  it("resolves previous and next track ids within the current bounds", () => {
    expect(
      resolveTrackIdByOffset({
        currentTrackId: "track-2",
        offset: -1,
        tracks,
      }),
    ).toBe("track-1")
    expect(
      resolveTrackIdByOffset({
        currentTrackId: "track-2",
        offset: 1,
        tracks,
      }),
    ).toBe("track-3")
  })

  it("returns null when navigation would leave the track bounds", () => {
    expect(
      resolveTrackIdByOffset({
        currentTrackId: "track-1",
        offset: -1,
        tracks,
      }),
    ).toBeNull()
    expect(
      resolveTrackIdByOffset({
        currentTrackId: "track-3",
        offset: 1,
        tracks,
      }),
    ).toBeNull()
  })

  it("falls back to the first track when current selection is unavailable", () => {
    expect(
      resolveTrackIdByOffset({
        currentTrackId: "missing-track",
        offset: 1,
        tracks,
      }),
    ).toBe("track-1")
    expect(
      resolveTrackIdByOffset({
        currentTrackId: "missing-track",
        offset: 1,
        tracks: [],
      }),
    ).toBeNull()
  })

  it("resolves fallback selection when the active track disappears", () => {
    expect(
      resolveActiveTrackIdAfterTrackListChange({
        currentTrackId: "track-2",
        tracks,
      }),
    ).toBeNull()
    expect(
      resolveActiveTrackIdAfterTrackListChange({
        currentTrackId: "missing-track",
        tracks,
      }),
    ).toBe("track-1")
    expect(
      resolveActiveTrackIdAfterTrackListChange({
        currentTrackId: "missing-track",
        tracks: [],
      }),
    ).toBeNull()
  })
})
