import { describe, expect, it, vi } from "vitest"
import { createVoiceLfo } from "../lfoEngine"

function createContext() {
  const lfoSource = {
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
    },
    start: vi.fn(),
    type: "square" as OscillatorType,
  }
  const lfoGainNode = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
    },
  }
  const context = {
    createGain: vi.fn(() => lfoGainNode),
    createOscillator: vi.fn(() => lfoSource),
    currentTime: 6,
  }

  return {
    context,
    lfoGainNode,
    lfoSource,
  }
}

describe("createVoiceLfo", () => {
  it("uses the default waveform and clamps rate and depth", () => {
    const { context, lfoGainNode, lfoSource } = createContext()
    const frequencyTarget = {}

    const nodes = createVoiceLfo(
      context as unknown as BaseAudioContext,
      frequencyTarget as unknown as AudioParam,
      {
        depth: -4,
        rate: 0,
        target: "frequency",
      },
    )

    expect(nodes).toEqual({
      gainNode: lfoGainNode,
      source: lfoSource,
    })
    expect(lfoSource.type).toBe("sine")
    expect(lfoSource.frequency.setValueAtTime).toHaveBeenCalledWith(0.01, 6)
    expect(lfoGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 6)
    expect(lfoSource.connect).toHaveBeenCalledWith(lfoGainNode)
    expect(lfoGainNode.connect).toHaveBeenCalledWith(frequencyTarget)
    expect(lfoSource.start).toHaveBeenCalledOnce()
  })

  it("preserves waveform, positive rate and depth for a gain target", () => {
    const { context, lfoGainNode, lfoSource } = createContext()
    const gainTarget = {}

    createVoiceLfo(
      context as unknown as BaseAudioContext,
      gainTarget as unknown as AudioParam,
      {
        depth: 0.25,
        rate: 8,
        target: "gain",
        waveform: "triangle",
      },
    )

    expect(lfoSource.type).toBe("triangle")
    expect(lfoSource.frequency.setValueAtTime).toHaveBeenCalledWith(8, 6)
    expect(lfoGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.25, 6)
    expect(lfoGainNode.connect).toHaveBeenCalledWith(gainTarget)
  })
})
