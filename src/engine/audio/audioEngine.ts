export type AudioWaveform = OscillatorType

export type ADSREnvelope = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type AudioLfo = {
  depth: number
  rate: number
  target?: "frequency" | "gain"
  waveform?: OscillatorType
}

export type FrequencySweep = {
  from: number
  to: number
  duration: number
}

export type AudioFilter = {
  type: BiquadFilterType
  frequency: number
  Q?: number
}

export type PlayFrequencyOptions = {
  duration?: number
  pan?: number
  volume?: number
  waveform?: AudioWaveform
  envelope?: Partial<ADSREnvelope>
  lfo?: AudioLfo
  sweep?: FrequencySweep
  filter?: AudioFilter
  distortion?: number
}

export type PlayNoiseOptions = Omit<PlayFrequencyOptions, "waveform">

export type VoiceId = string

type ActiveVoice = {
  source: OscillatorNode | AudioBufferSourceNode
  gainNode: GainNode
  envelope: ADSREnvelope
  lfoGainNode?: GainNode
  lfoSource?: OscillatorNode
  panNode: StereoPannerNode
  sustainVolume: number
}

const DEFAULT_ENVELOPE: ADSREnvelope = {
  attack: 0.01,
  decay: 0.12,
  sustain: 0.72,
  release: 0.18,
}

let audioContext: AudioContext | null = null
let masterGainNode: GainNode | null = null
let whiteNoiseBuffer: AudioBuffer | null = null
let voiceCounter = 0

const activeVoices = new Map<VoiceId, ActiveVoice>()

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function makeDistortionCurve(amount: number): Float32Array {
  const samples = 256
  const curve = new Float32Array(samples)
  const k = clamp(amount, 0, 1) * 120
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume()
  }

  return audioContext
}

function getMasterGainNode(ctx: AudioContext) {
  if (!masterGainNode) {
    masterGainNode = ctx.createGain()
    masterGainNode.gain.setValueAtTime(0.8, ctx.currentTime)
    masterGainNode.connect(ctx.destination)
  }

  return masterGainNode
}

function resolveEnvelope(envelope?: Partial<ADSREnvelope>) {
  return {
    ...DEFAULT_ENVELOPE,
    ...envelope,
  }
}

function getWhiteNoiseBuffer(ctx: AudioContext) {
  if (whiteNoiseBuffer) {
    return whiteNoiseBuffer
  }

  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const channelData = buffer.getChannelData(0)

  for (let sampleIndex = 0; sampleIndex < bufferSize; sampleIndex += 1) {
    channelData[sampleIndex] = Math.random() * 2 - 1
  }

  whiteNoiseBuffer = buffer

  return whiteNoiseBuffer
}

function scheduleVoiceStart(
  ctx: AudioContext,
  gainNode: GainNode,
  volume: number,
  envelope: ADSREnvelope,
) {
  const now = ctx.currentTime
  const attackEnd = now + envelope.attack
  const decayEnd = attackEnd + envelope.decay
  const sustainVolume = volume * envelope.sustain

  gainNode.gain.cancelScheduledValues(now)
  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.linearRampToValueAtTime(volume, attackEnd)
  gainNode.gain.linearRampToValueAtTime(sustainVolume, decayEnd)

  return sustainVolume
}

function scheduleVoiceStop(voiceId: VoiceId, releaseStartTime: number) {
  const voice = activeVoices.get(voiceId)

  if (!voice) {
    return
  }

  const releaseEndTime = releaseStartTime + voice.envelope.release

  voice.gainNode.gain.cancelScheduledValues(releaseStartTime)
  voice.gainNode.gain.setValueAtTime(voice.sustainVolume, releaseStartTime)
  voice.gainNode.gain.linearRampToValueAtTime(0.0001, releaseEndTime)
  voice.source.stop(releaseEndTime)
  voice.lfoSource?.stop(releaseEndTime)
}

function registerActiveVoice(
  voiceId: VoiceId,
  source: OscillatorNode | AudioBufferSourceNode,
  gainNode: GainNode,
  panNode: StereoPannerNode,
  envelope: ADSREnvelope,
  sustainVolume: number,
  lfoNodes?: {
    gainNode: GainNode
    source: OscillatorNode
  },
) {
  activeVoices.set(voiceId, {
    source,
    gainNode,
    envelope,
    lfoGainNode: lfoNodes?.gainNode,
    lfoSource: lfoNodes?.source,
    panNode,
    sustainVolume,
  })

  source.onended = () => {
    lfoNodes?.source.disconnect()
    lfoNodes?.gainNode.disconnect()
    source.disconnect()
    gainNode.disconnect()
    panNode.disconnect()
    activeVoices.delete(voiceId)
  }
}

function createFrequencyLfo(
  ctx: AudioContext,
  oscillator: OscillatorNode,
  lfo: AudioLfo,
) {
  const lfoSource = ctx.createOscillator()
  const lfoGainNode = ctx.createGain()

  lfoSource.type = lfo.waveform ?? "sine"
  lfoSource.frequency.setValueAtTime(Math.max(lfo.rate, 0.01), ctx.currentTime)
  lfoGainNode.gain.setValueAtTime(Math.max(lfo.depth, 0), ctx.currentTime)

  lfoSource.connect(lfoGainNode)
  lfoGainNode.connect(oscillator.frequency)
  lfoSource.start()

  return {
    gainNode: lfoGainNode,
    source: lfoSource,
  }
}

function createGainLfo(
  ctx: AudioContext,
  gainNode: GainNode,
  lfo: AudioLfo,
) {
  const lfoSource = ctx.createOscillator()
  const lfoGainNode = ctx.createGain()

  lfoSource.type = lfo.waveform ?? "sine"
  lfoSource.frequency.setValueAtTime(Math.max(lfo.rate, 0.01), ctx.currentTime)
  lfoGainNode.gain.setValueAtTime(Math.max(lfo.depth, 0), ctx.currentTime)

  lfoSource.connect(lfoGainNode)
  lfoGainNode.connect(gainNode.gain)
  lfoSource.start()

  return {
    gainNode: lfoGainNode,
    source: lfoSource,
  }
}

function startSourceVoice(
  source: OscillatorNode | AudioBufferSourceNode,
  options: Pick<PlayFrequencyOptions, "volume" | "envelope" | "lfo" | "pan" | "filter" | "distortion"> = {},
) {
  const ctx = getAudioContext()
  const gainNode = ctx.createGain()
  const panNode = ctx.createStereoPanner()
  const envelope = resolveEnvelope(options.envelope)
  const volume = clamp(options.volume ?? 0.2, 0, 1)
  const pan = clamp(options.pan ?? 0, -1, 1)
  const voiceId = `voice-${voiceCounter++}`
  const sustainVolume = scheduleVoiceStart(ctx, gainNode, volume, envelope)
  const lfoNodes =
    !options.lfo
      ? undefined
      : options.lfo.target === "gain"
        ? createGainLfo(ctx, gainNode, options.lfo)
        : source instanceof OscillatorNode
          ? createFrequencyLfo(ctx, source, options.lfo)
          : undefined

  // Signal chain: gain → [distortion] → [filter] → pan → master
  let chainTail: AudioNode = gainNode

  if (options.distortion && options.distortion > 0) {
    const shaper = ctx.createWaveShaper()
    shaper.curve = makeDistortionCurve(options.distortion)
    shaper.oversample = "2x"
    chainTail.connect(shaper)
    chainTail = shaper
  }

  if (options.filter) {
    const biquad = ctx.createBiquadFilter()
    biquad.type = options.filter.type
    biquad.frequency.setValueAtTime(options.filter.frequency, ctx.currentTime)
    if (options.filter.Q !== undefined) {
      biquad.Q.setValueAtTime(options.filter.Q, ctx.currentTime)
    }
    chainTail.connect(biquad)
    chainTail = biquad
  }

  panNode.pan.setValueAtTime(pan, ctx.currentTime)
  source.connect(gainNode)
  chainTail.connect(panNode)
  panNode.connect(getMasterGainNode(ctx))

  registerActiveVoice(
    voiceId,
    source,
    gainNode,
    panNode,
    envelope,
    sustainVolume,
    lfoNodes,
  )
  source.start()

  return voiceId
}

export function setMasterVolume(volume: number) {
  const ctx = getAudioContext()
  const masterGain = getMasterGainNode(ctx)
  const nextVolume = clamp(volume, 0, 1)

  masterGain.gain.setTargetAtTime(nextVolume, ctx.currentTime, 0.01)
}

export function startFrequency(
  frequency: number,
  options: PlayFrequencyOptions = {},
) {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()

  oscillator.type = options.waveform ?? "sine"

  if (options.sweep) {
    oscillator.frequency.setValueAtTime(options.sweep.from, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(options.sweep.to, 1),
      ctx.currentTime + options.sweep.duration,
    )
  } else {
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  }

  return startSourceVoice(oscillator, options)
}

export function startNoise(options: PlayNoiseOptions = {}) {
  const ctx = getAudioContext()
  const noiseSource = ctx.createBufferSource()

  noiseSource.buffer = getWhiteNoiseBuffer(ctx)
  noiseSource.loop = true

  return startSourceVoice(noiseSource, options)
}

export function stopVoice(voiceId: VoiceId) {
  const ctx = getAudioContext()

  scheduleVoiceStop(voiceId, ctx.currentTime)
}

export function stopAllVoices() {
  const ctx = getAudioContext()

  for (const voiceId of activeVoices.keys()) {
    scheduleVoiceStop(voiceId, ctx.currentTime)
  }
}

export function playFrequency(
  frequency: number,
  duration = 1,
  options: PlayFrequencyOptions = {},
) {
  const ctx = getAudioContext()
  const voiceId = startFrequency(frequency, options)

  scheduleVoiceStop(voiceId, ctx.currentTime + duration)

  return voiceId
}

export function playNoise(duration = 1, options: PlayNoiseOptions = {}) {
  const ctx = getAudioContext()
  const voiceId = startNoise(options)

  scheduleVoiceStop(voiceId, ctx.currentTime + duration)

  return voiceId
}
