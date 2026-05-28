// sfxrEngine.ts — Generador procedural de efectos de sonido estilo 8-bit

export type SfxWave = "square" | "sawtooth" | "triangle" | "sine" | "noise"
export type SfxPresetId = "pickup" | "laser" | "explosion" | "powerup" | "hit" | "jump" | "blip" | "random"

export type SfxParams = {
  wave: SfxWave
  baseFreq: number      // Hz (20–2000)
  freqSlide: number     // octavas/s, firmado (-4 a 4)
  freqMin: number       // Hz límite inferior (0 = sin límite)
  attackTime: number    // s (0–0.5)
  sustainTime: number   // s (0.01–1)
  sustainPunch: number  // 0–1 volumen extra al inicio del sustain
  decayTime: number     // s (0.01–1)
  arpeggioFactor: number  // 1=ninguno, 2=octava arriba, 0.5=octava abajo
  arpeggioDelay: number   // s antes de que el arpegio entre (0–0.5)
  vibratoDepth: number    // 0–0.5
  vibratoSpeed: number    // Hz (0–20)
}

export const PRESETS: Record<Exclude<SfxPresetId, "random">, SfxParams> = {
  pickup: {
    wave: "square", baseFreq: 520, freqSlide: 1.5, freqMin: 0,
    attackTime: 0, sustainTime: 0.08, sustainPunch: 0.3, decayTime: 0.12,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
  },
  laser: {
    wave: "sawtooth", baseFreq: 900, freqSlide: -3, freqMin: 100,
    attackTime: 0, sustainTime: 0.15, sustainPunch: 0.5, decayTime: 0.05,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
  },
  explosion: {
    wave: "noise", baseFreq: 180, freqSlide: -0.5, freqMin: 40,
    attackTime: 0, sustainTime: 0.25, sustainPunch: 0.7, decayTime: 0.4,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
  },
  powerup: {
    wave: "sine", baseFreq: 300, freqSlide: 1.2, freqMin: 0,
    attackTime: 0.04, sustainTime: 0.2, sustainPunch: 0.15, decayTime: 0.2,
    arpeggioFactor: 1.5, arpeggioDelay: 0.12, vibratoDepth: 0.1, vibratoSpeed: 8,
  },
  hit: {
    wave: "noise", baseFreq: 130, freqSlide: -1, freqMin: 0,
    attackTime: 0, sustainTime: 0.04, sustainPunch: 0.9, decayTime: 0.08,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
  },
  jump: {
    wave: "square", baseFreq: 280, freqSlide: 0.8, freqMin: 0,
    attackTime: 0, sustainTime: 0.1, sustainPunch: 0.25, decayTime: 0.15,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
  },
  blip: {
    wave: "square", baseFreq: 440, freqSlide: 0, freqMin: 0,
    attackTime: 0, sustainTime: 0.04, sustainPunch: 0, decayTime: 0.04,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
  },
}

export function getPreset(id: SfxPresetId): SfxParams {
  if (id === "random") return randomParams()
  return { ...PRESETS[id] }
}

export function randomParams(): SfxParams {
  const ids = Object.keys(PRESETS) as Exclude<SfxPresetId, "random">[]
  const base = { ...PRESETS[ids[Math.floor(Math.random() * ids.length)]] }
  base.baseFreq = Math.max(50, base.baseFreq * (0.6 + Math.random() * 0.8))
  base.freqSlide = (Math.random() - 0.5) * 5
  base.sustainPunch = Math.random() * 0.8
  base.sustainTime = 0.05 + Math.random() * 0.3
  base.decayTime = 0.05 + Math.random() * 0.4
  return base
}

export function generateSamples(params: SfxParams, sampleRate = 44100): Float32Array {
  const totalSecs = Math.max(0.01, params.attackTime + params.sustainTime + params.decayTime)
  const numSamples = Math.ceil(totalSecs * sampleRate)
  const data = new Float32Array(numSamples)

  let phase = 0
  let noiseVal = 0
  let noiseCounter = 0

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate

    // Frecuencia con slide exponencial
    let freq = params.baseFreq * Math.pow(2, params.freqSlide * t)
    if (params.freqMin > 0 && freq < params.freqMin) freq = params.freqMin
    freq = Math.max(1, Math.min(freq, sampleRate * 0.49))

    // Arpegio
    if (params.arpeggioFactor !== 1 && t >= params.arpeggioDelay) {
      freq *= params.arpeggioFactor
      freq = Math.max(1, Math.min(freq, sampleRate * 0.49))
    }

    // Vibrato
    if (params.vibratoDepth > 0) {
      freq *= 1 + params.vibratoDepth * Math.sin(2 * Math.PI * params.vibratoSpeed * t)
    }

    // Envolvente ADSR simplificada (sin release separado del decay)
    let env: number
    const a = params.attackTime
    const s = Math.max(0.001, params.sustainTime)
    const d = Math.max(0.001, params.decayTime)
    if (t < a) {
      env = a > 0 ? t / a : 1
    } else if (t < a + s) {
      const st = (t - a) / s
      env = 1 + params.sustainPunch * (1 - st)
    } else {
      const dt = (t - a - s) / d
      env = Math.max(0, 1 - dt)
    }

    // Oscilador
    phase += freq / sampleRate
    if (phase >= 1) phase -= Math.floor(phase)

    let sample: number
    switch (params.wave) {
      case "square":
        sample = phase < 0.5 ? 1 : -1
        break
      case "sawtooth":
        sample = 2 * phase - 1
        break
      case "triangle":
        sample = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
        break
      case "sine":
        sample = Math.sin(2 * Math.PI * phase)
        break
      case "noise":
        noiseCounter += freq / sampleRate
        if (noiseCounter >= 1) {
          noiseCounter -= 1
          noiseVal = Math.random() * 2 - 1
        }
        sample = noiseVal
        break
      default:
        sample = 0
    }

    data[i] = sample * env * 0.5
  }

  return data
}

export function samplesToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numSamples = samples.length
  const bps = 2 // bytes per sample (16-bit)
  const dataSize = numSamples * bps
  const ab = new ArrayBuffer(44 + dataSize)
  const v = new DataView(ab)
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }

  w(0, "RIFF"); v.setUint32(4, 36 + dataSize, true); w(8, "WAVE")
  w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * bps, true); v.setUint16(32, bps, true)
  v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(offset, clamped < 0 ? clamped * 32768 : clamped * 32767, true)
    offset += 2
  }

  return ab
}
