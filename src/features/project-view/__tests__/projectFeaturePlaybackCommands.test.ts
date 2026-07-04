import { describe, expect, it, vi } from "vitest"
import { createProjectFeaturePlaybackCommands } from "../projectFeaturePlaybackCommands"

describe("project feature playback commands", () => {
  it("plays the project from zero when playback is stopped", () => {
    const playProject = vi.fn()
    const stopPlayback = vi.fn()
    const commands = createProjectFeaturePlaybackCommands({
      isMixOnlyPlaying: false,
      isPlaying: false,
      playProject,
      stopPlayback,
    })

    commands.togglePlayback()

    expect(playProject).toHaveBeenCalledOnce()
    expect(stopPlayback).not.toHaveBeenCalled()
  })

  it("stops active MIDI playback", () => {
    const playProject = vi.fn()
    const stopPlayback = vi.fn()
    const commands = createProjectFeaturePlaybackCommands({
      isMixOnlyPlaying: false,
      isPlaying: true,
      playProject,
      stopPlayback,
    })

    commands.togglePlayback()

    expect(stopPlayback).toHaveBeenCalledOnce()
    expect(playProject).not.toHaveBeenCalled()
  })

  it("stops active mix-only playback", () => {
    const playProject = vi.fn()
    const stopPlayback = vi.fn()
    const commands = createProjectFeaturePlaybackCommands({
      isMixOnlyPlaying: true,
      isPlaying: false,
      playProject,
      stopPlayback,
    })

    commands.togglePlayback()

    expect(stopPlayback).toHaveBeenCalledOnce()
    expect(playProject).not.toHaveBeenCalled()
  })
})
