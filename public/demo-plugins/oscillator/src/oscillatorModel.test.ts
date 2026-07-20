import { describe, expect, it } from "vitest"
import {
  getOscillatorInstrumentId,
  getOscillatorPreset,
  isOscillatorWaveform,
  normalizeOscillatorSettings,
} from "./oscillatorModel"

describe("oscillatorModel", () => {
  it("accepts only supported waveforms", () => {
    expect(isOscillatorWaveform("sine")).toBe(true)
    expect(isOscillatorWaveform("noise")).toBe(false)
  })

  it("normalizes values outside the supported ranges", () => {
    const settings = normalizeOscillatorSettings({
      waveform: "noise" as never,
      rootNote: "H",
      octave: 12,
      attack: -1,
      decay: 99,
      sustain: 3,
      release: -4,
      pattern: "unknown" as never,
      motionMode: "wide" as never,
      motionShape: "jitter" as never,
      motionRate: 30,
      motionDepth: -1,
    })

    expect(settings.waveform).toBe("sine")
    expect(settings.rootNote).toBe("C")
    expect(settings.octave).toBe(6)
    expect(settings.attack).toBe(0.001)
    expect(settings.decay).toBe(0.8)
    expect(settings.sustain).toBe(1)
    expect(settings.release).toBe(0.02)
    expect(settings.pattern).toBe("rise")
    expect(settings.motionMode).toBe("off")
    expect(settings.motionShape).toBe("smooth")
    expect(settings.motionRate).toBe(18)
    expect(settings.motionDepth).toBe(0)
  })

  it("returns stable presets and instrument ids", () => {
    const preset = getOscillatorPreset("pulse")

    expect(preset.waveform).toBe("square")
    expect(preset.motionMode).toBe("vibrato")
    expect(preset.motionShape).toBe("step")
    expect(getOscillatorInstrumentId()).toBe("oscillator")
  })
})
