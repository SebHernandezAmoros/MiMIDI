import type {
  ADSREnvelope,
  AudioWaveform,
  PlayFrequencyOptions,
} from "./audioEngine"

export type MathematicalInstrumentId =
  | "pure-sine"
  | "soft-triangle"
  | "bright-square"
  | "saw-lead"

export type MathematicalInstrument = {
  id: MathematicalInstrumentId
  name: string
  waveform: AudioWaveform
  volume: number
  envelope: ADSREnvelope
}

export const mathematicalInstruments: MathematicalInstrument[] = [
  {
    id: "pure-sine",
    name: "Pure Sine",
    waveform: "sine",
    volume: 0.22,
    envelope: {
      attack: 0.02,
      decay: 0.12,
      sustain: 0.68,
      release: 0.24,
    },
  },
  {
    id: "soft-triangle",
    name: "Soft Triangle",
    waveform: "triangle",
    volume: 0.24,
    envelope: {
      attack: 0.04,
      decay: 0.18,
      sustain: 0.7,
      release: 0.32,
    },
  },
  {
    id: "bright-square",
    name: "Bright Square",
    waveform: "square",
    volume: 0.14,
    envelope: {
      attack: 0.01,
      decay: 0.08,
      sustain: 0.54,
      release: 0.16,
    },
  },
  {
    id: "saw-lead",
    name: "Saw Lead",
    waveform: "sawtooth",
    volume: 0.16,
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.62,
      release: 0.2,
    },
  },
]

export function findMathematicalInstrument(
  instrumentId: MathematicalInstrumentId,
) {
  return (
    mathematicalInstruments.find((instrument) => instrument.id === instrumentId) ??
    mathematicalInstruments[0]
  )
}

export function createPlayOptions(
  instrument: MathematicalInstrument,
  volumeScale = 1,
): PlayFrequencyOptions {
  return {
    waveform: instrument.waveform,
    volume: instrument.volume * volumeScale,
    envelope: instrument.envelope,
  }
}
