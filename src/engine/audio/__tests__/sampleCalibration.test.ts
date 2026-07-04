import { describe, expect, it } from "vitest"
import type { AudioCalibration } from "../audioTypes"
import { resolveSampleCalibration } from "../sampleCalibration"

function createCalibration(
  overrides: Partial<AudioCalibration> = {},
): AudioCalibration {
  return {
    fadeIn: 0,
    fadeOut: 0,
    gain: 1,
    trimEnd: 1,
    trimStart: 0,
    tune: 0,
    ...overrides,
  }
}

describe("resolveSampleCalibration", () => {
  it("resolves trim, tune, real duration and fades", () => {
    const result = resolveSampleCalibration(
      10,
      createCalibration({
        fadeIn: 0.5,
        fadeOut: 0.75,
        trimEnd: 0.8,
        trimStart: 0.2,
        tune: 12,
      }),
    )

    expect(result).toEqual({
      bufferDuration: 6,
      fadeIn: 0.5,
      fadeOut: 0.75,
      offset: 2,
      playbackRate: 2,
      realDuration: 3,
    })
  })

  it("clamps trim and combined fades while preserving minimum duration", () => {
    const result = resolveSampleCalibration(
      10,
      createCalibration({
        fadeIn: 4,
        fadeOut: 4,
        trimEnd: -2,
        trimStart: 2,
      }),
    )

    expect(result.offset).toBe(10)
    expect(result.bufferDuration).toBe(0.001)
    expect(result.playbackRate).toBe(1)
    expect(result.realDuration).toBe(0.001)
    expect(result.fadeIn).toBeCloseTo(0.0009)
    expect(result.fadeOut).toBeCloseTo(0)
  })

  it("supports tuning down and clamps negative fades to zero", () => {
    const result = resolveSampleCalibration(
      8,
      createCalibration({
        fadeIn: -1,
        fadeOut: -2,
        trimEnd: 0.5,
        tune: -12,
      }),
    )

    expect(result.bufferDuration).toBe(4)
    expect(result.playbackRate).toBe(0.5)
    expect(result.realDuration).toBe(8)
    expect(result.fadeIn).toBe(0)
    expect(result.fadeOut).toBe(0)
  })
})
