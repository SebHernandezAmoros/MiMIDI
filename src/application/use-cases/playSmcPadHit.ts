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
    description: "Seno corto con cuerpo grave.",
    note: "C2",
    duration: 0.22,
  },
  {
    id: "snare",
    label: "Snare",
    accent: "smc-pad-accent-snare",
    description: "Ruido blanco con cuerpo medio.",
    note: "D2",
    duration: 0.12,
  },
  {
    id: "hat",
    label: "Hat",
    accent: "smc-pad-accent-hat",
    description: "Ruido corto y brillante.",
    note: "F#2",
    duration: 0.05,
  },
  {
    id: "clap",
    label: "Clap",
    accent: "smc-pad-accent-clap",
    description: "Rafagas de ruido encadenadas.",
    note: "A#2",
    duration: 0.09,
  },
]

export function getSmcPadSoundDescriptor(soundId: SmcPadSoundId) {
  return smcPadSounds.find((sound) => sound.id === soundId) ?? smcPadSounds[0]
}

export function playSmcPadHit(soundId: SmcPadSoundId) {
  switch (soundId) {
    case "kick":
      playFrequency(58, 0.22, {
        waveform: "sine",
        volume: 0.58,
        envelope: {
          attack: 0.001,
          decay: 0.06,
          sustain: 0.08,
          release: 0.08,
        },
      })
      playFrequency(44, 0.28, {
        waveform: "triangle",
        volume: 0.18,
        envelope: {
          attack: 0.001,
          decay: 0.08,
          sustain: 0.06,
          release: 0.12,
        },
      })
      return

    case "snare":
      playNoise(0.12, {
        volume: 0.34,
        envelope: {
          attack: 0.001,
          decay: 0.045,
          sustain: 0.1,
          release: 0.08,
        },
      })
      playFrequency(196, 0.1, {
        waveform: "triangle",
        volume: 0.1,
        envelope: {
          attack: 0.001,
          decay: 0.03,
          sustain: 0.04,
          release: 0.05,
        },
      })
      return

    case "hat":
      playNoise(0.05, {
        volume: 0.16,
        envelope: {
          attack: 0.001,
          decay: 0.012,
          sustain: 0.02,
          release: 0.03,
        },
      })
      return

    case "clap":
      ;[0, 22, 44].forEach((delayMs, burstIndex) => {
        window.setTimeout(() => {
          playNoise(0.045, {
            volume: burstIndex === 0 ? 0.22 : 0.16,
            envelope: {
              attack: 0.001,
              decay: 0.014,
              sustain: 0.03,
              release: 0.03,
            },
          })
        }, delayMs)
      })
  }
}
