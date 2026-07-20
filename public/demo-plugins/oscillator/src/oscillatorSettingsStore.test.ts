import { afterEach, describe, expect, it } from "vitest"
import {
  clearOscillatorSettingsForTest,
  loadOscillatorSettings,
  saveOscillatorSettings,
} from "./oscillatorSettingsStore"

describe("oscillatorSettingsStore", () => {
  afterEach(() => {
    clearOscillatorSettingsForTest()
  })

  it("loads stable defaults when there is no saved configuration", () => {
    expect(loadOscillatorSettings()).toMatchObject({
      waveform: "sine",
      rootNote: "C",
      octave: 4,
    })
  })

  it("saves and restores normalized settings", () => {
    saveOscillatorSettings({
      waveform: "square",
      rootNote: "A",
      octave: 12,
      attack: 0.2,
    })

    expect(loadOscillatorSettings()).toMatchObject({
      waveform: "square",
      rootNote: "A",
      octave: 6,
      attack: 0.2,
    })
  })
})
