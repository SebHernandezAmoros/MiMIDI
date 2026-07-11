import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { usePluginWorkspaceNotePreview } from "../usePluginWorkspaceNotePreview"

describe("usePluginWorkspaceNotePreview", () => {
  it("starts a note with the selected instrument options and remembers its voice", () => {
    const startVoice = vi.fn(() => "voice-1")
    const stopVoice = vi.fn()
    const { result } = renderHook(() =>
      usePluginWorkspaceNotePreview({
        instruments: [{
          id: "soft-triangle",
          waveform: "triangle",
          envelope: {
            attack: 0.02,
            decay: 0.12,
            sustain: 0.68,
            release: 0.24,
          },
          volume: 0.22,
        }],
        startVoice,
        stopVoice,
      }),
    )

    act(() => {
      result.current.playNote("C4", "soft-triangle", 0.5)
    })

    expect(startVoice).toHaveBeenCalledWith("C4", 0.5, {
      waveform: "triangle",
      envelope: {
        attack: 0.02,
        decay: 0.12,
        sustain: 0.68,
        release: 0.24,
      },
      volume: 0.22,
    })

    act(() => {
      result.current.stopNote("C4")
    })

    expect(stopVoice).toHaveBeenCalledWith("voice-1")
  })

  it("forgets a stopped note and ignores later stop requests for it", () => {
    const startVoice = vi.fn(() => "voice-1")
    const stopVoice = vi.fn()
    const { result } = renderHook(() =>
      usePluginWorkspaceNotePreview({
        instruments: [],
        startVoice,
        stopVoice,
      }),
    )

    act(() => {
      result.current.playNote("D4", "missing-instrument", 1)
      result.current.stopNote("D4")
      result.current.stopNote("D4")
    })

    expect(startVoice).toHaveBeenCalledWith("D4", 1, {
      waveform: undefined,
      envelope: undefined,
      volume: undefined,
    })
    expect(stopVoice).toHaveBeenCalledTimes(1)
  })
})
