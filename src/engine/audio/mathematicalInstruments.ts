import type {
  ADSREnvelope,
  AudioLfo,
  AudioWaveform,
  PlayFrequencyOptions,
} from "./audioEngine"

export type MathematicalInstrumentId =
  | "pure-sine"
  | "soft-triangle"
  | "bright-square"
  | "saw-lead"
  | "vibrato-lead"
  | "tremolo-pad"

export type MathematicalInstrument = {
  category: "advanced" | "base"
  id: MathematicalInstrumentId
  name: string
  waveform: AudioWaveform
  volume: number
  envelope: ADSREnvelope
  lfo?: AudioLfo
}

export const mathematicalInstruments: MathematicalInstrument[] = [
  {
    category: "base",
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
    category: "base",
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
    category: "base",
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
    category: "base",
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
  {
    category: "advanced",
    id: "vibrato-lead",
    name: "Vibrato Lead",
    waveform: "sawtooth",
    volume: 0.15,
    envelope: {
      attack: 0.01,
      decay: 0.08,
      sustain: 0.64,
      release: 0.22,
    },
    lfo: {
      rate: 5.2,
      depth: 11,
      waveform: "sine",
    },
  },
  {
    category: "advanced",
    id: "tremolo-pad",
    name: "Tremolo Pad",
    waveform: "triangle",
    volume: 0.2,
    envelope: {
      attack: 0.08,
      decay: 0.16,
      sustain: 0.72,
      release: 0.28,
    },
    lfo: {
      rate: 4.2,
      depth: 0.045,
      target: "gain",
      waveform: "sine",
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

export function getInstrumentCategoryLabel(category: MathematicalInstrument["category"]) {
  return category === "advanced" ? "Avanzado" : "Base"
}

export function getInstrumentCategoryDescription(
  category: MathematicalInstrument["category"],
) {
  return category === "advanced"
    ? "Incluye modulacion o comportamiento sonoro mas expresivo para exploracion avanzada."
    : "Incluye instrumentos matematicos base para pruebas limpias, grabacion y referencia."
}

export function createPlayOptions(
  instrument: MathematicalInstrument,
  volumeScale = 1,
  envelopeOverrides?: Partial<ADSREnvelope>,
): PlayFrequencyOptions {
  return {
    waveform: instrument.waveform,
    volume: instrument.volume * volumeScale,
    envelope: {
      ...instrument.envelope,
      ...envelopeOverrides,
    },
    lfo: instrument.lfo,
  }
}
