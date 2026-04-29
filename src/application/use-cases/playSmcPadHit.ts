import { playFrequency, playNoise } from "../../engine/audio/audioEngine"
import type { MusicalNote } from "../../engine/midi/notes"

export type SmcPadSoundId = "kick" | "snare" | "hat" | "clap"

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
]

export function getSmcPadSoundDescriptor(soundId: SmcPadSoundId) {
  return smcPadSounds.find((sound) => sound.id === soundId) ?? smcPadSounds[0]
}

export function playSmcPadHit(soundId: SmcPadSoundId) {
  switch (soundId) {
    case "kick":
      playFrequency(64, 0.14, {
        waveform: "sine",
        volume: 0.64,
        envelope: {
          attack: 0.001,
          decay: 0.045,
          sustain: 0.04,
          release: 0.05,
        },
      })
      playFrequency(49, 0.24, {
        waveform: "triangle",
        volume: 0.24,
        envelope: {
          attack: 0.001,
          decay: 0.07,
          sustain: 0.04,
          release: 0.1,
        },
      })
      return

    case "snare":
      playNoise(0.11, {
        volume: 0.28,
        envelope: {
          attack: 0.001,
          decay: 0.032,
          sustain: 0.07,
          release: 0.06,
        },
      })
      playFrequency(178, 0.09, {
        waveform: "sawtooth",
        volume: 0.08,
        envelope: {
          attack: 0.001,
          decay: 0.02,
          sustain: 0.03,
          release: 0.05,
        },
      })
      return

    case "hat":
      playNoise(0.04, {
        volume: 0.13,
        envelope: {
          attack: 0.001,
          decay: 0.009,
          sustain: 0.015,
          release: 0.02,
        },
      })
      playFrequency(8400, 0.025, {
        waveform: "square",
        volume: 0.015,
        envelope: {
          attack: 0.001,
          decay: 0.005,
          sustain: 0.01,
          release: 0.01,
        },
      })
      return

    case "clap":
      ;[0, 18, 38].forEach((delayMs, burstIndex) => {
        window.setTimeout(() => {
          playNoise(0.038, {
            volume: burstIndex === 0 ? 0.2 : 0.14,
            envelope: {
              attack: 0.001,
              decay: 0.011,
              sustain: 0.02,
              release: 0.026,
            },
          })
        }, delayMs)
      })
      playFrequency(520, 0.05, {
        waveform: "triangle",
        volume: 0.03,
        envelope: {
          attack: 0.001,
          decay: 0.01,
          sustain: 0.01,
          release: 0.02,
        },
      })
  }
}
