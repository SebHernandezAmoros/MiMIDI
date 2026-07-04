import { describe, expect, it, vi } from "vitest"
import { createNoiseEngine } from "../noiseEngine"

function createContext(sampleRate = 4) {
  const channelData = new Float32Array(sampleRate * 2)
  const buffer = {
    getChannelData: vi.fn(() => channelData),
  }
  const source = {
    buffer: null as AudioBuffer | null,
    loop: false,
    start: vi.fn(),
  }
  const context = {
    createBuffer: vi.fn(() => buffer),
    createBufferSource: vi.fn(() => source),
    sampleRate,
  }

  return {
    buffer,
    channelData,
    context,
    source,
  }
}

describe("createNoiseEngine", () => {
  it("creates and caches the current two-second mono white-noise buffer", () => {
    const values = [0, 0.25, 0.5, 0.75, 1, 0, 0.25, 0.5]
    const random = vi.fn(() => values.shift() ?? 0.5)
    const engine = createNoiseEngine(random)
    const { buffer, channelData, context } = createContext()

    const first = engine.getWhiteNoiseBuffer(
      context as unknown as BaseAudioContext,
    )
    const second = engine.getWhiteNoiseBuffer(
      context as unknown as BaseAudioContext,
    )

    expect(first).toBe(buffer)
    expect(second).toBe(buffer)
    expect(context.createBuffer).toHaveBeenCalledOnce()
    expect(context.createBuffer).toHaveBeenCalledWith(1, 8, 4)
    expect(buffer.getChannelData).toHaveBeenCalledWith(0)
    expect(random).toHaveBeenCalledTimes(8)
    expect(Array.from(channelData)).toEqual([
      -1,
      -0.5,
      0,
      0.5,
      1,
      -1,
      -0.5,
      0,
    ])
  })

  it("creates a looping source without starting it", () => {
    const engine = createNoiseEngine(() => 0.5)
    const { buffer, context, source } = createContext()

    const result = engine.createLoopingNoiseSource(
      context as unknown as BaseAudioContext,
    )

    expect(result).toBe(source)
    expect(context.createBufferSource).toHaveBeenCalledOnce()
    expect(source.buffer).toBe(buffer)
    expect(source.loop).toBe(true)
    expect(source.start).not.toHaveBeenCalled()
  })
})
