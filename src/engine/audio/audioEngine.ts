export type AudioWaveform = OscillatorType

export type ADSREnvelope = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type PlayFrequencyOptions = {
  duration?: number
  volume?: number
  waveform?: AudioWaveform
  envelope?: Partial<ADSREnvelope>
}

export type PlayNoiseOptions = Omit<PlayFrequencyOptions, "waveform">

export type VoiceId = string

type ActiveVoice = {
  source: OscillatorNode | AudioBufferSourceNode
  gainNode: GainNode
  envelope: ADSREnvelope
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
}

function registerActiveVoice(
  voiceId: VoiceId,
  source: OscillatorNode | AudioBufferSourceNode,
  gainNode: GainNode,
  envelope: ADSREnvelope,
  sustainVolume: number,
) {
  activeVoices.set(voiceId, {
    source,
    gainNode,
    envelope,
    sustainVolume,
  })

  source.onended = () => {
    source.disconnect()
    gainNode.disconnect()
    activeVoices.delete(voiceId)
  }
}

function startSourceVoice(
  source: OscillatorNode | AudioBufferSourceNode,
  options: Pick<PlayFrequencyOptions, "volume" | "envelope"> = {},
) {
  const ctx = getAudioContext()
  const gainNode = ctx.createGain()
  const envelope = resolveEnvelope(options.envelope)
  const volume = clamp(options.volume ?? 0.2, 0, 1)
  const voiceId = `voice-${voiceCounter++}`
  const sustainVolume = scheduleVoiceStart(ctx, gainNode, volume, envelope)

  source.connect(gainNode)
  gainNode.connect(getMasterGainNode(ctx))

  registerActiveVoice(voiceId, source, gainNode, envelope, sustainVolume)
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
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

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
