import { describe, expect, it, vi } from "vitest"
import { createVoiceFxChain } from "../fxChain"

function createContext() {
  const waveShaper = {
    connect: vi.fn(),
    curve: null as Float32Array | null,
    oversample: "none" as OverSampleType,
  }
  const filter = {
    connect: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    type: "lowpass" as BiquadFilterType,
  }
  const context = {
    createBiquadFilter: vi.fn(() => filter),
    createWaveShaper: vi.fn(() => waveShaper),
    currentTime: 4,
  }
  const input = { connect: vi.fn() }

  return { context, filter, input, waveShaper }
}

describe("createVoiceFxChain", () => {
  it("keeps the input unchanged when FX are disabled", () => {
    const { context, input } = createContext()

    const tail = createVoiceFxChain(
      context as unknown as BaseAudioContext,
      input as unknown as AudioNode,
      { distortion: 0 },
    )

    expect(tail).toBe(input)
    expect(context.createWaveShaper).not.toHaveBeenCalled()
    expect(context.createBiquadFilter).not.toHaveBeenCalled()
    expect(input.connect).not.toHaveBeenCalled()
  })

  it("creates the current distortion curve and oversampling", () => {
    const { context, input, waveShaper } = createContext()

    const tail = createVoiceFxChain(
      context as unknown as BaseAudioContext,
      input as unknown as AudioNode,
      { distortion: 0.5 },
    )

    expect(tail).toBe(waveShaper)
    expect(waveShaper.curve).toBeInstanceOf(Float32Array)
    expect(waveShaper.curve).toHaveLength(256)
    expect(waveShaper.oversample).toBe("2x")
    expect(input.connect).toHaveBeenCalledWith(waveShaper)
  })

  it("chains filter after distortion and applies its parameters", () => {
    const { context, filter, input, waveShaper } = createContext()

    const tail = createVoiceFxChain(
      context as unknown as BaseAudioContext,
      input as unknown as AudioNode,
      {
        distortion: 0.25,
        filter: {
          type: "highpass",
          frequency: 1200,
          Q: 3,
        },
      },
    )

    expect(tail).toBe(filter)
    expect(waveShaper.connect).toHaveBeenCalledWith(filter)
    expect(filter.type).toBe("highpass")
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 4)
    expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(3, 4)
  })
})
