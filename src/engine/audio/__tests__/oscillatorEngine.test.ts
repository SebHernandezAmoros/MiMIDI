import { describe, expect, it, vi } from "vitest"
import { createVoiceOscillator } from "../oscillatorEngine"

function createContext() {
  const oscillator = {
    frequency: {
      exponentialRampToValueAtTime: vi.fn(),
      setValueAtTime: vi.fn(),
    },
    type: "square" as OscillatorType,
  }
  const context = {
    createOscillator: vi.fn(() => oscillator),
    currentTime: 3,
  }

  return {
    context,
    oscillator,
  }
}

describe("createVoiceOscillator", () => {
  it("uses a sine waveform and schedules the requested base frequency", () => {
    const { context, oscillator } = createContext()

    const result = createVoiceOscillator(
      context as unknown as BaseAudioContext,
      440,
    )

    expect(result).toBe(oscillator)
    expect(context.createOscillator).toHaveBeenCalledOnce()
    expect(oscillator.type).toBe("sine")
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 3)
    expect(
      oscillator.frequency.exponentialRampToValueAtTime,
    ).not.toHaveBeenCalled()
  })

  it("preserves an explicit waveform without changing base frequency", () => {
    const { context, oscillator } = createContext()

    createVoiceOscillator(
      context as unknown as BaseAudioContext,
      220,
      { waveform: "triangle" },
    )

    expect(oscillator.type).toBe("triangle")
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(220, 3)
  })

  it("schedules the current exponential frequency sweep contract", () => {
    const { context, oscillator } = createContext()

    createVoiceOscillator(
      context as unknown as BaseAudioContext,
      440,
      {
        sweep: {
          duration: 0.75,
          from: 1200,
          to: 0,
        },
      },
    )

    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 3)
    expect(
      oscillator.frequency.exponentialRampToValueAtTime,
    ).toHaveBeenCalledWith(1, 3.75)
  })
})
