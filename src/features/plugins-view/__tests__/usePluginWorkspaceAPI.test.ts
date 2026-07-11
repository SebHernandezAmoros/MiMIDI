import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { usePluginWorkspaceAPI } from "../usePluginWorkspaceAPI"

describe("usePluginWorkspaceAPI", () => {
  it("composes audio, project, session and notification contracts", async () => {
    const clip = new Blob(["clip"], { type: "audio/webm" })
    const playNote = vi.fn()
    const stopNote = vi.fn()
    const triggerPad = vi.fn()
    const receivePluginOutput = vi.fn()
    const notify = vi.fn()
    const storeClip = vi.fn(async () => "plugin-clip-1")
    const loadClip = vi.fn(async () => clip)
    const getTracks = vi.fn(() => [{
      id: "track-1",
      name: "Track 1",
      type: "melodic" as const,
    }])
    const { result } = renderHook(() =>
      usePluginWorkspaceAPI({
        audio: { playNote, stopNote, triggerPad },
        notify,
        project: { bpm: 96, getTracks },
        session: { loadClip, receivePluginOutput, storeClip },
        transport: { isPlaying: false, isRecording: true },
      }),
    )
    const output = {
      instrumentId: "pure-sine",
      name: "Plugin notes",
      notes: [],
      type: "midi" as const,
    }

    act(() => {
      result.current.audio.playNote("C4", "pure-sine", 0.5)
      result.current.audio.stopNote("C4")
      result.current.audio.triggerPad("kick", 0.8)
      result.current.session.sendOutput(output)
      result.current.ui.notify("Ready")
    })

    expect(result.current.project.getBPM()).toBe(96)
    expect(result.current.project.getTracks()).toEqual([{
      id: "track-1",
      name: "Track 1",
      type: "melodic",
    }])
    expect(result.current.transport.isRecording).toBe(true)
    expect(playNote).toHaveBeenCalledWith("C4", "pure-sine", 0.5)
    expect(stopNote).toHaveBeenCalledWith("C4")
    expect(triggerPad).toHaveBeenCalledWith("kick", 0.8)
    expect(receivePluginOutput).toHaveBeenCalledWith(output)
    expect(notify).toHaveBeenCalledWith("Ready")
    await expect(
      result.current.session.storeClip(clip, "Clip", 1.25),
    ).resolves.toBe("plugin-clip-1")
    await expect(
      result.current.session.loadClip("plugin-clip-1"),
    ).resolves.toBe(clip)
  })

  it("preserves live transport state and callbacks", () => {
    const onPlay = vi.fn()
    const dependencies = {
      audio: {
        playNote: vi.fn(),
        stopNote: vi.fn(),
        triggerPad: vi.fn(),
      },
      notify: vi.fn(),
      project: { bpm: 120, getTracks: vi.fn(() => []) },
      session: {
        loadClip: vi.fn(),
        receivePluginOutput: vi.fn(),
        storeClip: vi.fn(),
      },
    }
    const { result, rerender } = renderHook(
      ({ isPlaying }) =>
        usePluginWorkspaceAPI({
          ...dependencies,
          transport: { isPlaying, isRecording: false },
        }),
      { initialProps: { isPlaying: false } },
    )
    result.current.transport.onPlay(onPlay)

    rerender({ isPlaying: true })

    expect(result.current.transport.isPlaying).toBe(true)
    expect(result.current.transport.bpm).toBe(120)
    expect(onPlay).toHaveBeenCalledTimes(1)
  })
})
