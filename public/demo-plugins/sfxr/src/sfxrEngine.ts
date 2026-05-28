// sfxrEngine.ts — Generador procedural de efectos de sonido estilo 8-bit

export type SfxWave = "square" | "sawtooth" | "triangle" | "sine" | "noise"
export type SfxPresetId =
  | "pickup" | "laser" | "explosion" | "powerup" | "hit" | "jump" | "blip"
  | "coin" | "zap" | "boom" | "hurt" | "synth" | "1up" | "click"
  | "random"

export type SfxParams = {
  wave: SfxWave
  baseFreq: number       // Hz (20–2000)
  freqSlide: number      // oct/s inicial (-4 a 4)
  freqSlide2: number     // oct/s² — aceleración del slide
  freqMin: number        // Hz límite inferior (0 = sin límite)
  squareDuty: number     // 0.05–0.5 — ciclo de trabajo (solo onda cuadrada)
  attackTime: number     // s (0–0.5)
  sustainTime: number    // s (0.01–1)
  sustainPunch: number   // 0–1
  decayTime: number      // s (0.01–1)
  arpeggioFactor: number // 1=ninguno, >1=arriba, <1=abajo
  arpeggioDelay: number  // s (0–0.5)
  vibratoDepth: number   // 0–0.5
  vibratoSpeed: number   // Hz (0–20)
  lpfFreq: number        // Hz — filtro pasa-bajos (>=22000 = apagado)
  lpfResonance: number   // 0–1 (0=sin resonancia, 1=máxima)
  hpfFreq: number        // Hz — filtro pasa-altos (0 = apagado)
  bitCrush: number       // 1–16 bits (16 = apagado, 1 = máximo crush)
  // ── Módulos FX ──────────────────────────────────────
  tremoloOn: boolean; tremoloRate: number; tremoloDepth: number
  fmOn: boolean;      fmStrength: number;  fmSpeed: number
  ringModOn: boolean; ringModFreq: number; ringModDepth: number
  wahOn: boolean;     wahRate: number;     wahDepth: number; wahBase: number
  harmonyOn: boolean; harmonyInterval: number; harmonyVolume: number
  delayOn: boolean;   delayTime: number;   delayDecay: number
}

export const OFF_LPF = 22050

export const FX_DEFAULTS = {
  tremoloOn: false as boolean, tremoloRate: 5,   tremoloDepth: 0.5,
  fmOn:      false as boolean, fmStrength:  2,   fmSpeed:     10,
  ringModOn: false as boolean, ringModFreq: 100, ringModDepth: 0.7,
  wahOn:     false as boolean, wahRate:     2,   wahDepth:    0.8, wahBase: 800,
  harmonyOn: false as boolean, harmonyInterval: 7, harmonyVolume: 0.5,
  delayOn:   false as boolean, delayTime:  150,  delayDecay:  0.5,
}

export const PRESETS: Record<Exclude<SfxPresetId, "random">, SfxParams> = {
  pickup: {
    wave: "square", baseFreq: 520, freqSlide: 1.5, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.08, sustainPunch: 0.3, decayTime: 0.12,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  laser: {
    wave: "sawtooth", baseFreq: 900, freqSlide: -3, freqSlide2: -0.4, freqMin: 100,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.15, sustainPunch: 0.5, decayTime: 0.05,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: 5000, lpfResonance: 0.08, hpfFreq: 80, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  explosion: {
    wave: "noise", baseFreq: 200, freqSlide: -0.4, freqSlide2: 0, freqMin: 40,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.3, sustainPunch: 0.8, decayTime: 0.5,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: 700, lpfResonance: 0.4, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  powerup: {
    wave: "sine", baseFreq: 300, freqSlide: 1.2, freqSlide2: 0.1, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0.04, sustainTime: 0.2, sustainPunch: 0.15, decayTime: 0.2,
    arpeggioFactor: 1.5, arpeggioDelay: 0.12, vibratoDepth: 0.1, vibratoSpeed: 8,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  hit: {
    wave: "noise", baseFreq: 130, freqSlide: -1, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.04, sustainPunch: 0.9, decayTime: 0.08,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: 2500, lpfResonance: 0.2, hpfFreq: 40, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  jump: {
    wave: "square", baseFreq: 280, freqSlide: 0.8, freqSlide2: 0.15, freqMin: 0,
    squareDuty: 0.45,
    attackTime: 0, sustainTime: 0.1, sustainPunch: 0.25, decayTime: 0.15,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  blip: {
    wave: "square", baseFreq: 440, freqSlide: 0, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.04, sustainPunch: 0, decayTime: 0.04,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  coin: {
    wave: "square", baseFreq: 1050, freqSlide: 1.8, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.05, sustainPunch: 0.4, decayTime: 0.08,
    arpeggioFactor: 1.5, arpeggioDelay: 0.04, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  zap: {
    wave: "sawtooth", baseFreq: 1400, freqSlide: -4.5, freqSlide2: -0.8, freqMin: 180,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.06, sustainPunch: 0.8, decayTime: 0.1,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: 4000, lpfResonance: 0.2, hpfFreq: 120, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  boom: {
    wave: "noise", baseFreq: 80, freqSlide: -0.2, freqSlide2: 0, freqMin: 20,
    squareDuty: 0.5,
    attackTime: 0.01, sustainTime: 0.4, sustainPunch: 0.6, decayTime: 0.8,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: 380, lpfResonance: 0.5, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  hurt: {
    wave: "noise", baseFreq: 360, freqSlide: -2.5, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.06, sustainPunch: 0.5, decayTime: 0.14,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: 3500, lpfResonance: 0.15, hpfFreq: 60, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  synth: {
    wave: "sawtooth", baseFreq: 220, freqSlide: 0, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0.06, sustainTime: 0.35, sustainPunch: 0.05, decayTime: 0.25,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0.06, vibratoSpeed: 6,
    lpfFreq: 1800, lpfResonance: 0.35, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  "1up": {
    wave: "square", baseFreq: 330, freqSlide: 0.5, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.07, sustainPunch: 0.15, decayTime: 0.08,
    arpeggioFactor: 1.498, arpeggioDelay: 0.07, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 0, bitCrush: 16,
    ...FX_DEFAULTS,
  },
  click: {
    wave: "noise", baseFreq: 2200, freqSlide: -3, freqSlide2: 0, freqMin: 0,
    squareDuty: 0.5,
    attackTime: 0, sustainTime: 0.005, sustainPunch: 1, decayTime: 0.018,
    arpeggioFactor: 1, arpeggioDelay: 0, vibratoDepth: 0, vibratoSpeed: 0,
    lpfFreq: OFF_LPF, lpfResonance: 0, hpfFreq: 400, bitCrush: 16,
    ...FX_DEFAULTS,
  },
}

function rn(v: number, pct: number) {
  return v * (1 - pct + Math.random() * pct * 2)
}

function randomVariant(base: SfxParams): SfxParams {
  return {
    ...base,
    baseFreq:       Math.max(20, rn(base.baseFreq, 0.28)),
    freqSlide:      base.freqSlide + (Math.random() - 0.5) * Math.max(0.5, Math.abs(base.freqSlide)) * 0.5,
    freqSlide2:     base.freqSlide2 + (Math.random() - 0.5) * 0.3,
    freqMin:        base.freqMin > 0 ? Math.max(20, rn(base.freqMin, 0.2)) : 0,
    squareDuty:     Math.max(0.05, Math.min(0.5, base.squareDuty + (Math.random() - 0.5) * 0.15)),
    sustainTime:    Math.max(0.01, rn(base.sustainTime, 0.35)),
    sustainPunch:   Math.max(0, Math.min(1, base.sustainPunch + (Math.random() - 0.5) * 0.3)),
    decayTime:      Math.max(0.01, rn(base.decayTime, 0.35)),
    attackTime:     Math.max(0, rn(base.attackTime || 0.001, 0.2)),
    arpeggioFactor: base.arpeggioFactor === 1 ? 1 : Math.max(0.25, rn(base.arpeggioFactor, 0.15)),
    arpeggioDelay:  base.arpeggioDelay > 0 ? Math.max(0, rn(base.arpeggioDelay, 0.2)) : 0,
    vibratoDepth:   Math.max(0, rn(base.vibratoDepth || 0.001, 0.3)),
    vibratoSpeed:   Math.max(0, rn(base.vibratoSpeed || 1, 0.25)),
    lpfFreq:        base.lpfFreq < OFF_LPF ? Math.max(100, rn(base.lpfFreq, 0.3)) : OFF_LPF,
    lpfResonance:   Math.max(0, Math.min(0.95, base.lpfResonance + (Math.random() - 0.5) * 0.2)),
    hpfFreq:        base.hpfFreq > 0 ? Math.max(0, rn(base.hpfFreq, 0.35)) : 0,
    bitCrush:       base.bitCrush < 16 ? Math.max(1, Math.min(15, Math.round(rn(base.bitCrush, 0.2)))) : 16,
  }
}

// Mutación suave — variación pequeña del sonido actual (no desde preset)
export function mutateParams(p: SfxParams): SfxParams {
  const sm = (v: number, pct: number) => v * (1 - pct + Math.random() * pct * 2)
  return {
    ...p,
    baseFreq:     Math.max(20, sm(p.baseFreq, 0.12)),
    freqSlide:    p.freqSlide + (Math.random() - 0.5) * 0.3,
    freqSlide2:   p.freqSlide2 + (Math.random() - 0.5) * 0.1,
    squareDuty:   Math.max(0.05, Math.min(0.5, p.squareDuty + (Math.random() - 0.5) * 0.08)),
    sustainTime:  Math.max(0.01, sm(p.sustainTime, 0.15)),
    sustainPunch: Math.max(0, Math.min(1, p.sustainPunch + (Math.random() - 0.5) * 0.15)),
    decayTime:    Math.max(0.01, sm(p.decayTime, 0.15)),
    vibratoDepth: Math.max(0, sm(p.vibratoDepth || 0.001, 0.2)),
    vibratoSpeed: Math.max(0, sm(p.vibratoSpeed || 1, 0.15)),
    lpfFreq:      p.lpfFreq < OFF_LPF ? Math.max(100, sm(p.lpfFreq, 0.15)) : OFF_LPF,
    lpfResonance: Math.max(0, Math.min(0.95, p.lpfResonance + (Math.random() - 0.5) * 0.1)),
    hpfFreq:      p.hpfFreq > 0 ? Math.max(0, sm(p.hpfFreq, 0.2)) : 0,
  }
}

export function getPreset(id: SfxPresetId): SfxParams {
  if (id === "random") return randomParams()
  return randomVariant(PRESETS[id])
}

export function randomParams(): SfxParams {
  const ids = Object.keys(PRESETS) as Exclude<SfxPresetId, "random">[]
  const base = PRESETS[ids[Math.floor(Math.random() * ids.length)]]
  return randomVariant({
    ...base,
    baseFreq:    base.baseFreq * (0.5 + Math.random()),
    freqSlide:   (Math.random() - 0.5) * 6,
    freqSlide2:  (Math.random() - 0.5) * 0.5,
    sustainTime: 0.04 + Math.random() * 0.4,
    decayTime:   0.04 + Math.random() * 0.5,
    squareDuty:  0.1 + Math.random() * 0.4,
    lpfFreq:     Math.random() < 0.4 ? 500 + Math.random() * 8000 : OFF_LPF,
    lpfResonance: Math.random() * 0.5,
    hpfFreq:     Math.random() < 0.3 ? Math.random() * 400 : 0,
    bitCrush:    Math.random() < 0.25 ? Math.ceil(Math.random() * 10) : 16,
  })
}

// Genera la voz principal con todos los FX por muestra (sin harmony ni delay)
function generateCoreSamples(params: SfxParams, sampleRate: number): Float32Array {
  const totalSecs = Math.max(0.01, params.attackTime + params.sustainTime + params.decayTime)
  const numSamples = Math.ceil(totalSecs * sampleRate)
  const data = new Float32Array(numSamples)

  let phase = 0
  let noiseVal = 0
  let noiseCounter = 0
  const invSR = 1 / sampleRate

  // LP filter (Chamberlin SVF 2nd order resonante)
  const LP_ON = params.lpfFreq < sampleRate * 0.49
  const svF   = LP_ON
    ? Math.min(0.95, 2 * Math.sin(Math.PI * Math.min(params.lpfFreq, sampleRate * 0.45) / sampleRate))
    : 0
  const svQ   = Math.max(0.05, 2.0 - Math.min(0.98, params.lpfResonance) * 1.9)
  let svLow = 0, svBand = 0

  // HP filter (IIR 1-pole)
  const HP_ON = params.hpfFreq > 1
  const hpA   = HP_ON ? Math.exp(-2 * Math.PI * params.hpfFreq / sampleRate) : 0
  let hpPrevX = 0, hpPrevY = 0

  // Bit crush
  const BC_ON = params.bitCrush < 16
  const bcLevels = BC_ON ? Math.pow(2, params.bitCrush - 1) : 0

  // Wah-Wah (LP 1-pole dinámico)
  let wahPrev = 0

  for (let i = 0; i < numSamples; i++) {
    const t = i * invSR

    // Frecuencia con slide cuadrático
    let freq = params.baseFreq * Math.pow(2, params.freqSlide * t + 0.5 * params.freqSlide2 * t * t)
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

    // FM Synth — modula la frecuencia del oscilador
    if (params.fmOn) {
      freq *= 1 + params.fmStrength * Math.sin(2 * Math.PI * params.fmSpeed * t)
      freq = Math.max(1, Math.min(freq, sampleRate * 0.49))
    }

    // Envolvente ADSR
    let env: number
    const atk = params.attackTime
    const sus = Math.max(0.001, params.sustainTime)
    const dec = Math.max(0.001, params.decayTime)
    if (t < atk) {
      env = atk > 0 ? t / atk : 1
    } else if (t < atk + sus) {
      const st = (t - atk) / sus
      env = 1 + params.sustainPunch * (1 - st)
    } else {
      const dt = (t - atk - sus) / dec
      env = Math.max(0, 1 - dt)
    }

    // Tremolo — LFO de amplitud (modula la envolvente)
    if (params.tremoloOn) {
      env *= 1 - params.tremoloDepth * (1 - Math.cos(2 * Math.PI * params.tremoloRate * t)) * 0.5
    }

    // Oscilador
    phase += freq * invSR
    if (phase >= 1) phase -= Math.floor(phase)

    let sample: number
    switch (params.wave) {
      case "square":
        sample = phase < params.squareDuty ? 1 : -1
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
        noiseCounter += freq * invSR
        if (noiseCounter >= 1) {
          noiseCounter -= 1
          noiseVal = Math.random() * 2 - 1
        }
        sample = noiseVal
        break
      default:
        sample = 0
    }

    // Wah-Wah — LP 1-pole con cutoff oscilante
    if (params.wahOn) {
      const lfo = params.wahBase * (1 + params.wahDepth * Math.sin(2 * Math.PI * params.wahRate * t))
      const wCut = Math.max(10, Math.min(sampleRate * 0.45, lfo))
      const wA = 1 - Math.exp(-2 * Math.PI * wCut / sampleRate)
      wahPrev = wA * sample + (1 - wA) * wahPrev
      sample = wahPrev
    }

    // LP filter (Chamberlin SVF)
    if (LP_ON) {
      const svHigh = sample - svLow - svQ * svBand
      svBand += svF * svHigh
      svLow  += svF * svBand
      sample  = svLow
    }

    // HP filter (IIR 1-pole)
    if (HP_ON) {
      const y = hpA * (hpPrevY + sample - hpPrevX)
      hpPrevX = sample
      hpPrevY = y
      sample  = y
    }

    // Ring Mod — multiplica por portadora senoidal
    if (params.ringModOn) {
      const carrier = Math.sin(2 * Math.PI * params.ringModFreq * t)
      sample *= (1 - params.ringModDepth) + params.ringModDepth * carrier
    }

    // Envolvente + ganancia
    sample *= env * 0.5

    // Bit crush (post-envolvente para efecto "escalera" en el decay)
    if (BC_ON && bcLevels > 0) {
      sample = Math.round(sample * bcLevels) / bcLevels
    }

    data[i] = sample
  }

  return data
}

export function generateSamples(params: SfxParams, sampleRate = 44100): Float32Array {
  let data = generateCoreSamples(params, sampleRate)

  // Harmony — segunda voz a intervalo de semitonos, mezclada post-loop
  if (params.harmonyOn && params.harmonyVolume > 0) {
    const shift = Math.pow(2, params.harmonyInterval / 12)
    const hParams: SfxParams = { ...params, baseFreq: params.baseFreq * shift, harmonyOn: false }
    const hData = generateCoreSamples(hParams, sampleRate)
    const len = Math.min(data.length, hData.length)
    for (let i = 0; i < len; i++) data[i] += hData[i] * params.harmonyVolume
  }

  // Delay — eco decreciente post-loop
  if (params.delayOn && params.delayTime > 0) {
    const delayOff = Math.floor(params.delayTime / 1000 * sampleRate)
    if (delayOff > 0) {
      let numEchoes = 0
      let dc = params.delayDecay
      while (numEchoes < 7 && dc > 0.02) { numEchoes++; dc *= params.delayDecay }
      if (numEchoes > 0) {
        const extended = new Float32Array(Math.min(data.length + delayOff * numEchoes, sampleRate * 6))
        extended.set(data.subarray(0, Math.min(data.length, extended.length)))
        let decayLevel = params.delayDecay
        for (let echo = 1; echo <= numEchoes; echo++) {
          const start = delayOff * echo
          for (let i = 0; i < data.length && start + i < extended.length; i++) {
            extended[start + i] += data[i] * decayLevel
          }
          decayLevel *= params.delayDecay
        }
        data = extended
      }
    }
  }

  return data
}

export function samplesToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numSamples = samples.length
  const bps = 2
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
