import { playFrequency, playNoise } from "../../engine/audio/audioEngine"
import type { MusicalNote } from "../../engine/midi/notes"

export type SmcPadSynthSettings = {
  decayScale: number
  distortion: number
  hatLength: number
  kickTune: number
  hatFlicker: boolean
  velocity: number
}

export type SmcPadSoundId = "kick" | "snare" | "hat" | "clap" | "tom" | "cowbell" | "rimshot" | "shaker"

type SmcPadSoundDescriptor = {
  accent: string
  description: string
  duration: number
  id: SmcPadSoundId
  label: string
  note: MusicalNote
}

export const smcPadSounds: SmcPadSoundDescriptor[] = [
  {
    id: "kick",
    label: "Kick",
    accent: "smc-pad-accent-kick",
    description: "Golpe grave con subcapa corta.",
    note: "C2",
    duration: 0.2,
  },
  {
    id: "snare",
    label: "Snare",
    accent: "smc-pad-accent-snare",
    description: "Ruido con crack medio y cola corta.",
    note: "D2",
    duration: 0.11,
  },
  {
    id: "hat",
    label: "Hat",
    accent: "smc-pad-accent-hat",
    description: "Chispa brillante y cerrada.",
    note: "F#2",
    duration: 0.045,
  },
  {
    id: "clap",
    label: "Clap",
    accent: "smc-pad-accent-clap",
    description: "Tres rafagas cortas encadenadas.",
    note: "A#2",
    duration: 0.085,
  },
  {
    id: "tom",
    label: "Tom",
    accent: "smc-pad-accent-tom",
    description: "Golpe medio con sweep tonal.",
    note: "E2",
    duration: 0.22,
  },
  {
    id: "cowbell",
    label: "Cencerro",
    accent: "smc-pad-accent-cowbell",
    description: "Metal resonante de dos tonos.",
    note: "G#2",
    duration: 0.35,
  },
  {
    id: "rimshot",
    label: "Rim",
    accent: "smc-pad-accent-rimshot",
    description: "Click seco y agudo.",
    note: "C#2",
    duration: 0.07,
  },
  {
    id: "shaker",
    label: "Shaker",
    accent: "smc-pad-accent-shaker",
    description: "Sacudida granular doble.",
    note: "D#2",
    duration: 0.12,
  },
]

export function getSmcPadSoundDescriptor(soundId: SmcPadSoundId) {
  return smcPadSounds.find((sound) => sound.id === soundId) ?? smcPadSounds[0]
}

const DEFAULT_SYNTH_SETTINGS: SmcPadSynthSettings = {
  decayScale: 1,
  distortion: 0,
  hatLength: 0.045,
  kickTune: 42,
  hatFlicker: false,
  velocity: 1,
}

export function playSmcPadHit(
  soundId: SmcPadSoundId,
  volumeScale = 1,
  pan = 0,
  settings: Partial<SmcPadSynthSettings> = {},
) {
  const {
    decayScale: ds,
    distortion,
    hatLength,
    kickTune,
    hatFlicker,
    velocity,
  } = { ...DEFAULT_SYNTH_SETTINGS, ...settings }

  const v = Math.max(volumeScale, 0) * velocity
  const dist = distortion > 0 ? distortion : undefined

  switch (soundId) {
    case "kick":
      playFrequency(kickTune, 0.1 + 0.12 * ds, {
        pan,
        waveform: "sine",
        volume: 0.72 * v,
        envelope: { attack: 0.001, decay: 0.09 * ds, sustain: 0.02, release: 0.09 * ds },
        sweep: { from: 180, to: kickTune, duration: 0.08 },
        distortion: dist ? dist * 0.5 : undefined,
      })
      playFrequency(kickTune * 1.2, 0.08 + 0.06 * ds, {
        pan,
        waveform: "triangle",
        volume: 0.26 * v,
        envelope: { attack: 0.001, decay: 0.05 * ds, sustain: 0.01, release: 0.07 * ds },
        sweep: { from: 110, to: kickTune * 1.2, duration: 0.05 },
      })
      return

    case "snare":
      playNoise(0.08 + 0.06 * ds, {
        pan,
        volume: 0.32 * v,
        envelope: { attack: 0.001, decay: 0.038 * ds, sustain: 0.05, release: 0.07 * ds },
        filter: { type: "bandpass", frequency: 320, Q: 0.8 },
        distortion: dist,
      })
      playFrequency(200, 0.08 + 0.03 * ds, {
        pan,
        waveform: "triangle",
        volume: 0.12 * v,
        envelope: { attack: 0.001, decay: 0.028 * ds, sustain: 0.02, release: 0.05 * ds },
        sweep: { from: 220, to: 100, duration: 0.05 },
      })
      return

    case "hat":
      playNoise(hatLength, {
        pan,
        volume: 0.14 * v,
        envelope: {
          attack: 0.001,
          decay: hatLength * 0.3,
          sustain: 0.005,
          release: hatLength * 0.4,
        },
        filter: { type: "highpass", frequency: 6000, Q: 0.5 },
        distortion: dist,
      })
      playFrequency(8400, hatLength * 0.7, {
        pan,
        waveform: "square",
        volume: 0.018 * v,
        envelope: {
          attack: 0.001,
          decay: hatLength * 0.15,
          sustain: 0.008,
          release: hatLength * 0.25,
        },
        sweep: { from: 9200, to: 7000, duration: hatLength * 0.6 },
        lfo: hatFlicker ? { depth: 150, rate: 60, target: "frequency" } : undefined,
      })
      return

    case "clap":
      ;[0, 18, 38].forEach((delayMs, burstIndex) => {
        window.setTimeout(() => {
          playNoise(0.038 * ds, {
            pan,
            volume: (burstIndex === 0 ? 0.2 : 0.14) * v,
            envelope: {
              attack: 0.001,
              decay: 0.011 * ds,
              sustain: 0.02,
              release: 0.026 * ds,
            },
            filter: { type: "bandpass", frequency: 1200, Q: 0.6 },
            distortion: dist,
          })
        }, delayMs)
      })
      playFrequency(520, 0.055 * ds, {
        pan,
        waveform: "triangle",
        volume: 0.035 * v,
        envelope: { attack: 0.001, decay: 0.012 * ds, sustain: 0.01, release: 0.022 * ds },
        sweep: { from: 640, to: 480, duration: 0.03 },
      })
      return

    case "tom":
      // Cuerpo tonal: sine sweep grave (piso del tom configurable con kickTune * 1.4)
      playFrequency(kickTune * 1.4, 0.15 + 0.12 * ds, {
        pan,
        waveform: "sine",
        volume: 0.68 * v,
        envelope: { attack: 0.001, decay: 0.1 * ds, sustain: 0.04, release: 0.1 * ds },
        sweep: { from: kickTune * 3.2, to: kickTune * 1.4, duration: 0.1 },
        distortion: dist ? dist * 0.4 : undefined,
      })
      // Golpe de ataque: triangle corto
      playFrequency(kickTune * 2.4, 0.04, {
        pan,
        waveform: "triangle",
        volume: 0.22 * v,
        envelope: { attack: 0.001, decay: 0.022, sustain: 0.01, release: 0.018 },
      })
      // Ruido de impacto suave
      playNoise(0.04 + 0.03 * ds, {
        pan,
        volume: 0.09 * v,
        envelope: { attack: 0.001, decay: 0.018 * ds, sustain: 0.01, release: 0.022 * ds },
        filter: { type: "bandpass", frequency: 280, Q: 1.2 },
      })
      return

    case "cowbell":
      // Cencerro: dos frecuencias metálicas batiendo entre sí con square
      playFrequency(562, 0.2 + 0.22 * ds, {
        pan,
        waveform: "square",
        volume: 0.28 * v,
        envelope: { attack: 0.001, decay: 0.06 * ds, sustain: 0.08, release: 0.18 * ds },
        distortion: dist ? dist * 0.3 : undefined,
      })
      playFrequency(845, 0.18 + 0.2 * ds, {
        pan,
        waveform: "square",
        volume: 0.22 * v,
        envelope: { attack: 0.001, decay: 0.05 * ds, sustain: 0.06, release: 0.16 * ds },
      })
      // Ruido de golpe inicial
      playNoise(0.025, {
        pan,
        volume: 0.12 * v,
        envelope: { attack: 0.001, decay: 0.01, sustain: 0.01, release: 0.015 },
        filter: { type: "bandpass", frequency: 700, Q: 1.5 },
      })
      return

    case "rimshot":
      // Click tonal seco y agudo
      playFrequency(1800, 0.04 * ds, {
        pan,
        waveform: "triangle",
        volume: 0.38 * v,
        envelope: { attack: 0.001, decay: 0.014 * ds, sustain: 0.01, release: 0.026 * ds },
        sweep: { from: 2200, to: 1400, duration: 0.02 },
        distortion: dist,
      })
      // Golpe de ruido muy corto y brillante
      playNoise(0.03 * ds, {
        pan,
        volume: 0.28 * v,
        envelope: { attack: 0.001, decay: 0.01 * ds, sustain: 0.01, release: 0.02 * ds },
        filter: { type: "highpass", frequency: 3000, Q: 0.6 },
      })
      // Sub-click grave para el impacto del aro
      playFrequency(400, 0.025 * ds, {
        pan,
        waveform: "sine",
        volume: 0.18 * v,
        envelope: { attack: 0.001, decay: 0.01 * ds, sustain: 0.01, release: 0.015 * ds },
      })
      return

    case "shaker":
      // Dos ráfagas de ruido filtrado para simular las bolitas del shaker
      ;[0, 55].forEach((delayMs) => {
        window.setTimeout(() => {
          playNoise(0.045 * ds, {
            pan,
            volume: 0.16 * v,
            envelope: { attack: 0.004, decay: 0.02 * ds, sustain: 0.02, release: 0.025 * ds },
            filter: { type: "bandpass", frequency: 5500, Q: 1.4 },
            distortion: dist ? dist * 0.2 : undefined,
          })
          // Capa de ataque granular brillante
          playNoise(0.02 * ds, {
            pan,
            volume: 0.08 * v,
            envelope: { attack: 0.001, decay: 0.008 * ds, sustain: 0.01, release: 0.012 * ds },
            filter: { type: "highpass", frequency: 8000, Q: 0.8 },
          })
        }, delayMs)
      })
      return
  }
}
