import { describe, expect, it, vi } from "vitest"
import type { PlaybackTimerPort } from "../../ports/PlaybackTimerPort"
import { playSmcPadHit } from "../playSmcPadHit"

vi.mock("../../../engine/audio/audioEngine", () => ({
  playFrequency: vi.fn(),
  playNoise: vi.fn(),
}))

describe("SMC Pad playback use-case", () => {
  it("schedules delayed clap bursts through an injected timer port", () => {
    const timerPort: PlaybackTimerPort = {
      setTimeout: vi.fn((_callback, _delayMs) => 1),
      clearTimeout: vi.fn(),
    }

    playSmcPadHit("clap", 1, 0, {}, timerPort)

    expect(timerPort.setTimeout).toHaveBeenCalledTimes(2)
    expect(timerPort.setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 0)
    expect(timerPort.setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 8)
  })

  it("schedules the shaker return through an injected timer port", () => {
    const timerPort: PlaybackTimerPort = {
      setTimeout: vi.fn((_callback, _delayMs) => 1),
      clearTimeout: vi.fn(),
    }

    playSmcPadHit("shaker", 1, 0, {}, timerPort)

    expect(timerPort.setTimeout).toHaveBeenCalledTimes(1)
    expect(timerPort.setTimeout).toHaveBeenCalledWith(expect.any(Function), 22)
  })
})
