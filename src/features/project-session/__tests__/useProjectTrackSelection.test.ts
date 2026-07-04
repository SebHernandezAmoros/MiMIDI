import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useProjectTrackSelection } from "../useProjectTrackSelection"

describe("useProjectTrackSelection", () => {
  const tracks = [
    { id: "track-1" },
    { id: "track-2" },
    { id: "track-3" },
  ]

  it("switches active track and clears the selected recorded note", () => {
    const setActiveTrackId = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectTrackSelection({
        currentTrackId: "track-1",
        setActiveTrackId,
        setSelectedRecordedNoteId,
        tracks,
      }),
    )

    act(() => {
      result.current.switchActiveTrack("track-2")
    })

    expect(setActiveTrackId).toHaveBeenCalledWith("track-2")
    expect(setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
  })

  it("switches by offset using the current bounded navigation rules", () => {
    const setActiveTrackId = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectTrackSelection({
        currentTrackId: "track-2",
        setActiveTrackId,
        setSelectedRecordedNoteId,
        tracks,
      }),
    )

    act(() => {
      result.current.switchTrackByOffset(1)
    })

    expect(setActiveTrackId).toHaveBeenCalledWith("track-3")
    expect(setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
  })

  it("does not clear selection when offset navigation cannot resolve a track", () => {
    const setActiveTrackId = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectTrackSelection({
        currentTrackId: "track-3",
        setActiveTrackId,
        setSelectedRecordedNoteId,
        tracks,
      }),
    )

    act(() => {
      result.current.switchTrackByOffset(1)
    })

    expect(setActiveTrackId).not.toHaveBeenCalled()
    expect(setSelectedRecordedNoteId).not.toHaveBeenCalled()
  })
})
