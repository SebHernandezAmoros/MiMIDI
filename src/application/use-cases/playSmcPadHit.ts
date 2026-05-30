import { playFrequency, playNoise } from "../../engine/audio/audioEngine"
import type { PadSoundParams, SmcPadSoundId } from "../../engine/midi/events"
import type { MusicalNote } from "../../engine/midi/notes"

export type { PadSoundParams, SmcPadSoundId }

type SmcPadSoundDescriptor = {
  accent: string
  description: string
  duration: number
  id: SmcPadSoundId
  label: string
  note: MusicalNote
}

export const smcPadSounds: SmcPadSoundDescriptor[] = [
  // ── Página 1: Kit básico completo ──────────────────────────────────────
  // Fila 1 — Fundamentos (las 4 piezas que aparecen en todo beat)
  { id: "kick",      label: "Kick",      accent: "smc-pad-accent-kick",    description: "Golpe grave",         note: "C2",  duration: 0.2   },
  { id: "snare",     label: "Snare",     accent: "smc-pad-accent-snare",   description: "Crack medio",         note: "D2",  duration: 0.11  },
  { id: "hat",       label: "Hihat",     accent: "smc-pad-accent-hat",     description: "Chispa brillante",    note: "F#2", duration: 0.045 },
  { id: "open-hat",  label: "Open Hat",  accent: "smc-pad-accent-hat",     description: "Hat abierto",         note: "G2",  duration: 0.35  },
  // Fila 2 — Variantes y cuerpo del kit
  { id: "clap",      label: "Clap",      accent: "smc-pad-accent-clap",    description: "Tres ráfagas",        note: "A#2", duration: 0.085 },
  { id: "rimshot",   label: "Rim",       accent: "smc-pad-accent-rimshot", description: "Golpe de aro",        note: "C#2", duration: 0.07  },
  { id: "tom",       label: "Tom",       accent: "smc-pad-accent-tom",     description: "Golpe tonal medio",   note: "E2",  duration: 0.22  },
  { id: "crash",     label: "Crash",     accent: "smc-pad-accent-perc",    description: "Platillo largo",      note: "A2",  duration: 1.2   },
  // ── Página 2: Kit extendido ────────────────────────────────────────────
  // Fila 3 — Toms graves y platillo alternativo
  { id: "floor-tom", label: "Floor Tom", accent: "smc-pad-accent-perc",    description: "Tom grave",           note: "C3",  duration: 0.28  },
  { id: "hi-tom",    label: "Hi Tom",    accent: "smc-pad-accent-perc",    description: "Tom agudo",           note: "D3",  duration: 0.15  },
  { id: "ride",      label: "Ride",      accent: "smc-pad-accent-perc",    description: "Campana de platillo", note: "B2",  duration: 0.45  },
  { id: "sub",       label: "Sub 808",   accent: "smc-pad-accent-kick",    description: "Sub bajo profundo",   note: "G3",  duration: 0.55  },
  // Fila 4 — Percusión latina y acentos
  { id: "conga",     label: "Conga",     accent: "smc-pad-accent-perc",    description: "Membrana tonal",      note: "E3",  duration: 0.18  },
  { id: "cowbell",   label: "Cencerro",  accent: "smc-pad-accent-cowbell", description: "Metal resonante",     note: "G#2", duration: 0.35  },
  { id: "shaker",    label: "Shaker",    accent: "smc-pad-accent-shaker",  description: "Sacudida granular",   note: "D#2", duration: 0.12  },
  { id: "woodblock", label: "Woodblock", accent: "smc-pad-accent-perc",    description: "Click de madera",     note: "F3",  duration: 0.08  },
]

export const PAD_SOUND_DEFAULTS: Record<SmcPadSoundId, PadSoundParams> = {
  kick:        { volume: 1, decay: 1, distortion: 0.15, tune: 42 },
  snare:       { volume: 1, decay: 1, distortion: 0.15 },
  hat:         { volume: 1, decay: 1, distortion: 0.15, length: 0.045, flicker: false },
  clap:        { volume: 1, decay: 1, distortion: 0.15 },
  tom:         { volume: 1, decay: 1, distortion: 0.15 },
  cowbell:     { volume: 1, decay: 1, distortion: 0.15 },
  rimshot:     { volume: 1, decay: 1, distortion: 0.15 },
  shaker:      { volume: 1, decay: 1, distortion: 0.15 },
  "open-hat":  { volume: 1, decay: 1, distortion: 0.15, length: 0.3,   flicker: false },
  crash:       { volume: 1, decay: 1, distortion: 0.15 },
  ride:        { volume: 1, decay: 1, distortion: 0.15 },
  "floor-tom": { volume: 1, decay: 1, distortion: 0.15, tune: 65 },
  "hi-tom":    { volume: 1, decay: 1, distortion: 0.15, tune: 180 },
  conga:       { volume: 1, decay: 1, distortion: 0.15, tune: 320 },
  woodblock:   { volume: 1, decay: 1, distortion: 0.15 },
  sub:         { volume: 1, decay: 1, distortion: 0.15, tune: 35 },
}

export function getSmcPadSoundDescriptor(soundId: SmcPadSoundId) {
  return smcPadSounds.find((s) => s.id === soundId) ?? smcPadSounds[0]
}

export function playSmcPadHit(
  soundId: SmcPadSoundId,
  volumeScale = 1,
  pan = 0,
  params: Partial<PadSoundParams> = {},
) {
  const resolved: PadSoundParams = { ...PAD_SOUND_DEFAULTS[soundId], ...params }
  const { volume, decay: ds, distortion, tune = 42, length = 0.045, flicker = false } = resolved
  const v = Math.max(volumeScale, 0) * volume
  const dist = distortion > 0 ? distortion : undefined

  switch (soundId) {
    case "kick":
      playNoise(0.007, {
        pan, volume: 0.55 * v,
        envelope: { attack: 0.0001, decay: 0.004, sustain: 0, release: 0.003 },
        filter: { type: "bandpass", frequency: 1400, Q: 0.6 },
      })
      playFrequency(tune, 0.14 + 0.14 * ds, {
        pan, waveform: "sine", volume: 0.88 * v,
        envelope: { attack: 0.0001, decay: 0.11 * ds, sustain: 0.01, release: 0.08 * ds },
        sweep: { from: 200, to: tune, duration: 0.055 },
        distortion: dist ? dist * 0.45 : undefined,
      })
      playFrequency(tune * 1.5, 0.06 * ds, {
        pan, waveform: "triangle", volume: 0.32 * v,
        envelope: { attack: 0.0001, decay: 0.04 * ds, sustain: 0, release: 0.03 * ds },
      })
      return

    case "snare":
      // Crack agudo — highpass más bajo para dejar pasar el cuerpo medio
      playNoise(0.065 * ds, {
        pan, volume: 0.52 * v,
        envelope: { attack: 0.0001, decay: 0.03 * ds, sustain: 0, release: 0.04 * ds },
        filter: { type: "highpass", frequency: 2800, Q: 0.5 },
        distortion: dist,
      })
      // Cuerpo del snare — más volumen y frecuencia más baja para dar presencia
      playNoise(0.1 + 0.06 * ds, {
        pan, volume: 0.58 * v,
        envelope: { attack: 0.0001, decay: 0.055 * ds, sustain: 0, release: 0.08 * ds },
        filter: { type: "bandpass", frequency: 220, Q: 0.8 },
      })
      // Tono del parche — más volumen para dar cuerpo tonal
      playFrequency(185, 0.07 * ds, {
        pan, waveform: "triangle", volume: 0.32 * v,
        envelope: { attack: 0.0001, decay: 0.03 * ds, sustain: 0, release: 0.045 * ds },
        sweep: { from: 220, to: 140, duration: 0.04 },
      })
      return

    case "hat":
      // Ruido base: volumen alto porque los sonidos cortos suenan más silenciosos perceptualmente
      playNoise(length * 1.8, {
        pan, volume: 0.52 * v,
        envelope: { attack: 0.0001, decay: length * 0.45, sustain: 0.01, release: length * 0.7 },
        filter: { type: "highpass", frequency: 7000, Q: 0.7 },
        distortion: dist,
      })
      // Shimmer metálico: frecuencias inarmónicas TR-808 (8372, 10548, 12544 Hz)
      playFrequency(8372, length * 1.4, {
        pan, waveform: "square", volume: 0.14 * v,
        envelope: { attack: 0.0001, decay: length * 0.3, sustain: 0.012, release: length * 0.55 },
        sweep: { from: 9600, to: 7400, duration: length },
        lfo: flicker ? { depth: 200, rate: 80, target: "frequency" } : undefined,
      })
      playFrequency(10548, length * 1.1, {
        pan, waveform: "square", volume: 0.09 * v,
        envelope: { attack: 0.0001, decay: length * 0.22, sustain: 0.008, release: length * 0.42 },
      })
      playFrequency(12544, length * 0.85, {
        pan, waveform: "square", volume: 0.062 * v,
        envelope: { attack: 0.0001, decay: length * 0.16, sustain: 0.005, release: length * 0.32 },
      })
      return

    case "clap":
      // 2 ráfagas muy cercanas (0ms y 8ms) — se perciben como un solo golpe
      ;[0, 8].forEach((delayMs, burstIndex) => {
        window.setTimeout(() => {
          // Cuerpo: bandpass limpio sin distorsión
          playNoise(0.05 * ds, {
            pan, volume: (burstIndex === 0 ? 0.75 : 0.48) * v,
            envelope: { attack: 0.0001, decay: 0.018 * ds, sustain: 0, release: 0.03 * ds },
            filter: { type: "bandpass", frequency: 1700, Q: 0.6 },
          })
          // Snap agudo
          playNoise(0.026 * ds, {
            pan, volume: (burstIndex === 0 ? 0.68 : 0.38) * v,
            envelope: { attack: 0.0001, decay: 0.011 * ds, sustain: 0, release: 0.018 * ds },
            filter: { type: "highpass", frequency: 4200, Q: 0.5 },
          })
        }, delayMs)
      })
      // Cola: cuerpo y ambiance — más presente al haber menos ráfagas
      playNoise(0.26 * ds, {
        pan, volume: 0.34 * v,
        envelope: { attack: 0.005, decay: 0.1 * ds, sustain: 0, release: 0.18 * ds },
        filter: { type: "bandpass", frequency: 2200, Q: 0.5 },
      })
      return

    case "tom":
      playNoise(0.009, {
        pan, volume: 0.45 * v,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.004 },
        filter: { type: "bandpass", frequency: 900, Q: 0.7 },
      })
      playFrequency(100, 0.16 + 0.12 * ds, {
        pan, waveform: "sine", volume: 0.78 * v,
        envelope: { attack: 0.0001, decay: 0.1 * ds, sustain: 0.03, release: 0.1 * ds },
        sweep: { from: 360, to: 100, duration: 0.09 },
        distortion: dist ? dist * 0.35 : undefined,
      })
      playFrequency(220, 0.045, {
        pan, waveform: "triangle", volume: 0.28 * v,
        envelope: { attack: 0.0001, decay: 0.024, sustain: 0.01, release: 0.02 },
      })
      playNoise(0.045 + 0.03 * ds, {
        pan, volume: 0.12 * v,
        envelope: { attack: 0.001, decay: 0.02 * ds, sustain: 0.01, release: 0.025 * ds },
        filter: { type: "bandpass", frequency: 320, Q: 1.1 },
      })
      return

    case "cowbell":
      playNoise(0.012, {
        pan, volume: 0.35 * v,
        envelope: { attack: 0.0001, decay: 0.006, sustain: 0.01, release: 0.006 },
        filter: { type: "bandpass", frequency: 800, Q: 1.2 },
      })
      playFrequency(562, 0.22 + 0.22 * ds, {
        pan, waveform: "square", volume: 0.34 * v,
        envelope: { attack: 0.0001, decay: 0.07 * ds, sustain: 0.07, release: 0.2 * ds },
        distortion: dist ? dist * 0.35 : undefined,
      })
      playFrequency(845, 0.2 + 0.2 * ds, {
        pan, waveform: "square", volume: 0.26 * v,
        envelope: { attack: 0.0001, decay: 0.06 * ds, sustain: 0.05, release: 0.17 * ds },
      })
      return

    case "rimshot":
      // Crack principal: bandpass 2200Hz es donde vive el "crack" de un aro de tambor real
      playNoise(0.038, {
        pan, volume: 0.82 * v,
        envelope: { attack: 0.0001, decay: 0.022, sustain: 0.008, release: 0.018 },
        filter: { type: "bandpass", frequency: 2200, Q: 0.75 },
        distortion: dist,
      })
      // Tono del aro: frecuencia más baja y natural (900Hz, no 1700Hz)
      playFrequency(920, 0.055 * ds, {
        pan, waveform: "triangle", volume: 0.55 * v,
        envelope: { attack: 0.0001, decay: 0.022 * ds, sustain: 0.01, release: 0.035 * ds },
        sweep: { from: 1200, to: 750, duration: 0.03 },
      })
      // Golpe del parche: sub breve que da presencia
      playFrequency(240, 0.028 * ds, {
        pan, waveform: "sine", volume: 0.32 * v,
        envelope: { attack: 0.0001, decay: 0.014 * ds, sustain: 0, release: 0.014 * ds },
      })
      return

    case "shaker":
      // Golpe principal: bandpass 5500Hz, decay limpio sin sustain
      playNoise(0.075 * ds, {
        pan, volume: 0.82 * v,
        envelope: { attack: 0.001, decay: 0.03 * ds, sustain: 0, release: 0.045 * ds },
        filter: { type: "bandpass", frequency: 5500, Q: 0.75 },
        distortion: dist ? dist * 0.08 : undefined,
      })
      // Shimmer agudo
      playNoise(0.04 * ds, {
        pan, volume: 0.52 * v,
        envelope: { attack: 0.0001, decay: 0.016 * ds, sustain: 0, release: 0.022 * ds },
        filter: { type: "highpass", frequency: 8000, Q: 0.55 },
      })
      // Ligero retorno de las bolitas (más suave, más corto)
      window.setTimeout(() => {
        playNoise(0.045 * ds, {
          pan, volume: 0.28 * v,
          envelope: { attack: 0.001, decay: 0.018 * ds, sustain: 0, release: 0.024 * ds },
          filter: { type: "bandpass", frequency: 5500, Q: 0.75 },
        })
      }, 22)
      return

    case "open-hat":
      playNoise(length * 3, {
        pan, volume: 0.48 * v,
        envelope: { attack: 0.0001, decay: length * 0.7, sustain: 0.02, release: length * 1.5 },
        filter: { type: "highpass", frequency: 7000, Q: 0.7 },
        distortion: dist,
      })
      playFrequency(8372, length * 2.5, {
        pan, waveform: "square", volume: 0.13 * v,
        envelope: { attack: 0.0001, decay: length * 0.5, sustain: 0.015, release: length * 1.2 },
        sweep: { from: 9600, to: 7200, duration: length * 1.8 },
        lfo: flicker ? { depth: 200, rate: 80, target: "frequency" } : undefined,
      })
      playFrequency(10548, length * 2, {
        pan, waveform: "square", volume: 0.085 * v,
        envelope: { attack: 0.0001, decay: length * 0.38, sustain: 0.01, release: length * 0.95 },
      })
      playFrequency(12544, length * 1.6, {
        pan, waveform: "square", volume: 0.058 * v,
        envelope: { attack: 0.0001, decay: length * 0.28, sustain: 0.007, release: length * 0.75 },
      })
      return

    case "crash":
      playNoise(0.012, {
        pan, volume: 0.52 * v,
        envelope: { attack: 0.0001, decay: 0.006, sustain: 0, release: 0.006 },
        filter: { type: "highpass", frequency: 3500, Q: 0.6 },
      })
      // sustain: 0 para que el ruido decaiga limpio sin cola residual
      playNoise(1.4 * ds, {
        pan, volume: 0.22 * v,
        envelope: { attack: 0.001, decay: 0.55 * ds, sustain: 0, release: 0.85 * ds },
        filter: { type: "highpass", frequency: 4500, Q: 0.4 },
        distortion: dist,
      })
      ;[6000, 8500, 11200, 14800].forEach((freq, i) => {
        playFrequency(freq, 0.9 * ds, {
          pan, waveform: "square", volume: (0.044 - i * 0.007) * v,
          envelope: { attack: 0.001, decay: 0.35 * ds, sustain: 0.015, release: 0.7 * ds },
        })
      })
      return

    case "ride":
      playNoise(0.01, {
        pan, volume: 0.42 * v,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.005 },
        filter: { type: "bandpass", frequency: 2800, Q: 0.8 },
      })
      playFrequency(2500, 0.45 * ds, {
        pan, waveform: "sine", volume: 0.48 * v,
        envelope: { attack: 0.0001, decay: 0.2 * ds, sustain: 0.07, release: 0.35 * ds },
        sweep: { from: 2700, to: 2400, duration: 0.05 },
        distortion: dist ? dist * 0.22 : undefined,
      })
      playNoise(0.3 * ds, {
        pan, volume: 0.14 * v,
        envelope: { attack: 0.001, decay: 0.12 * ds, sustain: 0.02, release: 0.22 * ds },
        filter: { type: "highpass", frequency: 7500, Q: 0.5 },
      })
      playFrequency(9800, 0.35 * ds, {
        pan, waveform: "square", volume: 0.038 * v,
        envelope: { attack: 0.001, decay: 0.14 * ds, sustain: 0.01, release: 0.25 * ds },
      })
      return

    case "floor-tom":
      playNoise(0.009, {
        pan, volume: 0.45 * v,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.004 },
        filter: { type: "bandpass", frequency: 700, Q: 0.8 },
      })
      playFrequency(tune, 0.22 + 0.16 * ds, {
        pan, waveform: "sine", volume: 0.82 * v,
        envelope: { attack: 0.0001, decay: 0.14 * ds, sustain: 0.03, release: 0.14 * ds },
        sweep: { from: tune * 4.5, to: tune, duration: 0.11 },
        distortion: dist ? dist * 0.35 : undefined,
      })
      playFrequency(tune * 1.8, 0.055, {
        pan, waveform: "triangle", volume: 0.28 * v,
        envelope: { attack: 0.0001, decay: 0.03, sustain: 0.01, release: 0.025 },
      })
      playNoise(0.055 + 0.04 * ds, {
        pan, volume: 0.11 * v,
        envelope: { attack: 0.001, decay: 0.024 * ds, sustain: 0.01, release: 0.03 * ds },
        filter: { type: "bandpass", frequency: 280, Q: 1.1 },
      })
      return

    case "hi-tom":
      playNoise(0.007, {
        pan, volume: 0.4 * v,
        envelope: { attack: 0.0001, decay: 0.004, sustain: 0, release: 0.003 },
        filter: { type: "bandpass", frequency: 1200, Q: 0.7 },
      })
      playFrequency(tune, 0.1 + 0.09 * ds, {
        pan, waveform: "sine", volume: 0.72 * v,
        envelope: { attack: 0.0001, decay: 0.075 * ds, sustain: 0.02, release: 0.07 * ds },
        sweep: { from: tune * 3.2, to: tune, duration: 0.07 },
        distortion: dist ? dist * 0.3 : undefined,
      })
      playFrequency(tune * 1.6, 0.035, {
        pan, waveform: "triangle", volume: 0.26 * v,
        envelope: { attack: 0.0001, decay: 0.02, sustain: 0.01, release: 0.016 },
      })
      playNoise(0.03 + 0.025 * ds, {
        pan, volume: 0.1 * v,
        envelope: { attack: 0.001, decay: 0.014 * ds, sustain: 0.01, release: 0.018 * ds },
        filter: { type: "bandpass", frequency: 450, Q: 1.0 },
      })
      return

    case "conga":
      playNoise(0.012, {
        pan, volume: 0.38 * v,
        envelope: { attack: 0.0001, decay: 0.007, sustain: 0, release: 0.005 },
        filter: { type: "bandpass", frequency: 1000, Q: 0.8 },
      })
      playFrequency(tune, 0.12 + 0.1 * ds, {
        pan, waveform: "sine", volume: 0.75 * v,
        envelope: { attack: 0.0001, decay: 0.08 * ds, sustain: 0.02, release: 0.08 * ds },
        sweep: { from: tune * 1.8, to: tune * 0.85, duration: 0.06 },
        distortion: dist ? dist * 0.25 : undefined,
      })
      playFrequency(tune * 2.1, 0.04, {
        pan, waveform: "sine", volume: 0.18 * v,
        envelope: { attack: 0.0001, decay: 0.022, sustain: 0.005, release: 0.018 },
      })
      playNoise(0.025 * ds, {
        pan, volume: 0.12 * v,
        envelope: { attack: 0.001, decay: 0.012 * ds, sustain: 0.005, release: 0.015 * ds },
        filter: { type: "bandpass", frequency: 600, Q: 1.2 },
      })
      return

    case "woodblock":
      playNoise(0.008, {
        pan, volume: 0.3 * v,
        envelope: { attack: 0.0001, decay: 0.004, sustain: 0, release: 0.004 },
        filter: { type: "bandpass", frequency: 1500, Q: 1.5 },
      })
      playFrequency(800, 0.06 * ds, {
        pan, waveform: "triangle", volume: 0.52 * v,
        envelope: { attack: 0.0001, decay: 0.024 * ds, sustain: 0.02, release: 0.04 * ds },
        distortion: dist ? dist * 0.4 : undefined,
      })
      playFrequency(1180, 0.045 * ds, {
        pan, waveform: "triangle", volume: 0.38 * v,
        envelope: { attack: 0.0001, decay: 0.018 * ds, sustain: 0.015, release: 0.032 * ds },
      })
      return

    case "sub":
      playNoise(0.01, {
        pan, volume: 0.38 * v,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.005 },
        filter: { type: "bandpass", frequency: 1200, Q: 0.8 },
      })
      playFrequency(tune, 0.32 + 0.4 * ds, {
        pan, waveform: "sine", volume: 0.92 * v,
        envelope: { attack: 0.0001, decay: 0.26 * ds, sustain: 0.02, release: 0.22 * ds },
        sweep: { from: tune * 3, to: tune, duration: 0.08 },
        distortion: dist ? dist * 0.28 : undefined,
      })
      return
  }
}
