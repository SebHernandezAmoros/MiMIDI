export type OscillatorWaveform = "sine" | "square" | "sawtooth" | "triangle"

export type OscillatorPresetId = "warm" | "pluck" | "pulse" | "bright"

export type OscillatorPatternId = "rise" | "pulse" | "stairs"

export type OscillatorMotionMode = "off" | "vibrato" | "tremolo"

export type OscillatorMotionShape = "smooth" | "step" | "ramp" | "bounce"

export type OscillatorSettings = {
  waveform: OscillatorWaveform
  rootNote: string
  octave: number
  attack: number
  decay: number
  sustain: number
  release: number
  pattern: OscillatorPatternId
  motionMode: OscillatorMotionMode
  motionShape: OscillatorMotionShape
  motionRate: number
  motionDepth: number
}

export const OSCILLATOR_WAVEFORMS: OscillatorWaveform[] = [
  "sine",
  "square",
  "sawtooth",
  "triangle",
]

export const OSCILLATOR_ROOT_NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const

export const OSCILLATOR_PRESETS: Record<OscillatorPresetId, OscillatorSettings> = {
  warm: {
    waveform: "sine",
    rootNote: "C",
    octave: 4,
    attack: 0.04,
    decay: 0.16,
    sustain: 0.72,
    release: 0.28,
    pattern: "rise",
    motionMode: "off",
    motionShape: "smooth",
    motionRate: 4.8,
    motionDepth: 0.18,
  },
  pluck: {
    waveform: "triangle",
    rootNote: "D",
    octave: 4,
    attack: 0.006,
    decay: 0.12,
    sustain: 0.22,
    release: 0.12,
    pattern: "stairs",
    motionMode: "tremolo",
    motionShape: "bounce",
    motionRate: 7.2,
    motionDepth: 0.16,
  },
  pulse: {
    waveform: "square",
    rootNote: "A",
    octave: 3,
    attack: 0.01,
    decay: 0.08,
    sustain: 0.46,
    release: 0.16,
    pattern: "pulse",
    motionMode: "vibrato",
    motionShape: "step",
    motionRate: 5.4,
    motionDepth: 0.22,
  },
  bright: {
    waveform: "sawtooth",
    rootNote: "E",
    octave: 4,
    attack: 0.012,
    decay: 0.1,
    sustain: 0.62,
    release: 0.18,
    pattern: "rise",
    motionMode: "vibrato",
    motionShape: "ramp",
    motionRate: 6.2,
    motionDepth: 0.14,
  },
}

const WAVEFORM_SET = new Set<string>(OSCILLATOR_WAVEFORMS)
const ROOT_NOTE_SET = new Set<string>(OSCILLATOR_ROOT_NOTES)
const PATTERN_SET = new Set<string>(["rise", "pulse", "stairs"])
const MOTION_SET = new Set<string>(["off", "vibrato", "tremolo"])
const MOTION_SHAPE_SET = new Set<string>(["smooth", "step", "ramp", "bounce"])

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function isOscillatorWaveform(value: string): value is OscillatorWaveform {
  return WAVEFORM_SET.has(value)
}

export const OSCILLATOR_INSTRUMENT_ID = "oscillator"

export function getOscillatorInstrumentId() {
  return OSCILLATOR_INSTRUMENT_ID
}

export function normalizeOscillatorSettings(
  settings: Partial<OscillatorSettings>,
): OscillatorSettings {
  const fallback = OSCILLATOR_PRESETS.warm
  const waveform =
    typeof settings.waveform === "string" && isOscillatorWaveform(settings.waveform)
      ? settings.waveform
      : fallback.waveform
  const rootNote =
    typeof settings.rootNote === "string" && ROOT_NOTE_SET.has(settings.rootNote)
      ? settings.rootNote
      : fallback.rootNote
  const pattern =
    typeof settings.pattern === "string" && PATTERN_SET.has(settings.pattern)
      ? settings.pattern
      : fallback.pattern
  const motionMode =
    typeof settings.motionMode === "string" && MOTION_SET.has(settings.motionMode)
      ? settings.motionMode
      : fallback.motionMode
  const motionShape =
    typeof settings.motionShape === "string" && MOTION_SHAPE_SET.has(settings.motionShape)
      ? settings.motionShape
      : fallback.motionShape

  return {
    waveform,
    rootNote,
    octave: clamp(Math.round(settings.octave ?? fallback.octave), 2, 6),
    attack: clamp(settings.attack ?? fallback.attack, 0.001, 0.5),
    decay: clamp(settings.decay ?? fallback.decay, 0.01, 0.8),
    sustain: clamp(settings.sustain ?? fallback.sustain, 0.05, 1),
    release: clamp(settings.release ?? fallback.release, 0.02, 1),
    pattern,
    motionMode,
    motionShape,
    motionRate: clamp(settings.motionRate ?? fallback.motionRate, 0.1, 18),
    motionDepth: clamp(settings.motionDepth ?? fallback.motionDepth, 0, 1),
  }
}

export function getOscillatorPreset(id: OscillatorPresetId): OscillatorSettings {
  return { ...OSCILLATOR_PRESETS[id] }
}
