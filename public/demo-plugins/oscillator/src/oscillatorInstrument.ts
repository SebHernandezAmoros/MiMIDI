import type { MathematicalInstrument } from "../../../../src/engine/audio/mathematicalInstruments"
import {
  getOscillatorInstrumentId,
  type OscillatorMotionShape,
} from "./oscillatorModel"
import { loadOscillatorSettings } from "./oscillatorSettingsStore"

const MOTION_SHAPE_WAVEFORM: Record<OscillatorMotionShape, "sine" | "square" | "sawtooth" | "triangle"> = {
  smooth: "sine",
  step: "square",
  ramp: "sawtooth",
  bounce: "triangle",
}

export const oscillatorInstrument = {
  category: "advanced",
  id: getOscillatorInstrumentId(),
  name: "Oscillator",
  volume: 0.18,
  get waveform() {
    return loadOscillatorSettings().waveform
  },
  get envelope() {
    const settings = loadOscillatorSettings()
    return {
      attack: settings.attack,
      decay: settings.decay,
      sustain: settings.sustain,
      release: settings.release,
    }
  },
  get lfo() {
    const settings = loadOscillatorSettings()
    if (settings.motionMode === "off" || settings.motionDepth <= 0) return undefined

    return {
      depth: settings.motionMode === "vibrato"
        ? settings.motionDepth * 18
        : settings.motionDepth * 0.18,
      rate: settings.motionRate,
      target: settings.motionMode === "vibrato" ? "frequency" : "gain",
      waveform: MOTION_SHAPE_WAVEFORM[settings.motionShape],
    } as const
  },
} satisfies MathematicalInstrument
