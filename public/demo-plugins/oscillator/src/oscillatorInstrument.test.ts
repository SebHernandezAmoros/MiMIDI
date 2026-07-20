import { afterEach, describe, expect, it } from "vitest"
import { oscillatorInstrument } from "./oscillatorInstrument"
import {
  clearOscillatorSettingsForTest,
  saveOscillatorSettings,
} from "./oscillatorSettingsStore"

describe("oscillatorInstrument", () => {
  afterEach(() => {
    clearOscillatorSettingsForTest()
  })

  it("exposes a single configurable instrument", () => {
    expect(oscillatorInstrument).toMatchObject({
      id: "oscillator",
      name: "Oscillator",
      category: "advanced",
    })
  })

  it("resolves waveform and envelope from the saved workspace settings", () => {
    saveOscillatorSettings({
      waveform: "square",
      attack: 0.13,
      decay: 0.21,
      sustain: 0.34,
      release: 0.55,
    })

    expect(oscillatorInstrument.waveform).toBe("square")
    expect(oscillatorInstrument.envelope).toEqual({
      attack: 0.13,
      decay: 0.21,
      sustain: 0.34,
      release: 0.55,
    })
  })

  it("translates motion settings to a piano-compatible LFO", () => {
    saveOscillatorSettings({
      motionMode: "vibrato",
      motionShape: "step",
      motionRate: 6,
      motionDepth: 0.5,
    })

    expect(oscillatorInstrument.lfo).toEqual({
      depth: 9,
      rate: 6,
      target: "frequency",
      waveform: "square",
    })
  })

  it("maps each motion shape to an LFO waveform supported by Piano", () => {
    const cases = [
      ["smooth", "sine"],
      ["step", "square"],
      ["ramp", "sawtooth"],
      ["bounce", "triangle"],
    ] as const

    for (const [motionShape, waveform] of cases) {
      saveOscillatorSettings({
        motionMode: "tremolo",
        motionShape,
        motionRate: 4,
        motionDepth: 0.5,
      })

      expect(oscillatorInstrument.lfo?.waveform).toBe(waveform)
    }
  })

  it("turns motion off when the LFO is disabled", () => {
    saveOscillatorSettings({
      motionMode: "off",
      motionRate: 6,
      motionDepth: 0.5,
    })

    expect(oscillatorInstrument.lfo).toBeUndefined()
  })
})
