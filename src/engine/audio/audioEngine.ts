import type {
  AudioCalibration,
  PlayFrequencyOptions,
  PlayNoiseOptions,
  SamplePlayback,
  VoiceId,
} from "./audioTypes"
import { getAudioContext } from "./audioContextManager"
import { getMasterGainNode } from "./masterOutput"
import { createVoiceFxChain } from "./fxChain"
import { createVoiceLfo } from "./lfoEngine"
import { createLoopingNoiseSource } from "./noiseEngine"
import { createVoiceOscillator } from "./oscillatorEngine"
import {
  playCalibratedSample,
  playSimpleSample,
  scheduleCalibratedSample,
  scheduleLoopingSample,
  scheduleSimpleSample,
} from "./samplePlaybackEngine"
import {
  createVoiceId,
  registerActiveVoice,
  scheduleAllVoicesStop,
  scheduleVoiceStart,
  scheduleVoiceStop,
} from "./synthVoiceEngine"

export type {
  ADSREnvelope,
  AudioCalibration,
  AudioFilter,
  AudioLfo,
  AudioWaveform,
  FrequencySweep,
  PlayFrequencyOptions,
  PlayNoiseOptions,
  SamplePlayback,
  VoiceId,
} from "./audioTypes"
export {
  decodeAudioData,
  ensureAudioReady,
  getAudioContextCurrentTime,
  getAudioContextCurrentTime as getAudioCurrentTime,
} from "./audioContextManager"
export { setMasterVolume } from "./masterOutput"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function startSourceVoice(
  source: OscillatorNode | AudioBufferSourceNode,
  options: Pick<PlayFrequencyOptions, "volume" | "envelope" | "lfo" | "pan" | "filter" | "distortion"> = {},
) {
  const ctx = getAudioContext()
  const gainNode = ctx.createGain()
  const panNode = ctx.createStereoPanner()
  const volume = clamp(options.volume ?? 0.2, 0, 1)
  const pan = clamp(options.pan ?? 0, -1, 1)
  const voiceId = createVoiceId()
  const { envelope, sustainVolume } = scheduleVoiceStart(
    gainNode,
    volume,
    options.envelope,
    ctx.currentTime,
  )
  const lfoNodes =
    !options.lfo
      ? undefined
      : options.lfo.target === "gain"
        ? createVoiceLfo(ctx, gainNode.gain, options.lfo)
        : source instanceof OscillatorNode
          ? createVoiceLfo(ctx, source.frequency, options.lfo)
          : undefined

  const chainTail = createVoiceFxChain(ctx, gainNode, options)

  panNode.pan.setValueAtTime(pan, ctx.currentTime)
  source.connect(gainNode)
  chainTail.connect(panNode)
  panNode.connect(getMasterGainNode(ctx))

  registerActiveVoice({
    envelope,
    gainNode,
    lfoNodes,
    panNode,
    source,
    sustainVolume,
    voiceId,
  })
  source.start()

  return voiceId
}

export function playAudioBuffer(
  audioBuffer: AudioBuffer,
  volume = 1,
  pan = 0,
): () => void {
  const ctx = getAudioContext()

  return playSimpleSample(
    ctx,
    getMasterGainNode(ctx),
    audioBuffer,
    volume,
    pan,
  )
}

export function scheduleAudioBuffer(
  audioBuffer: AudioBuffer,
  when: number,
  offset = 0,
  volume = 1,
): () => void {
  const ctx = getAudioContext()

  return scheduleSimpleSample(
    ctx,
    getMasterGainNode(ctx),
    audioBuffer,
    when,
    offset,
    volume,
  )
}

export function playAudioBufferCalibrated(
  audioBuffer: AudioBuffer,
  cal: AudioCalibration,
  volume = 1,
  pan = 0,
): SamplePlayback {
  const ctx = getAudioContext()

  return playCalibratedSample(
    ctx,
    getMasterGainNode(ctx),
    audioBuffer,
    cal,
    volume,
    pan,
  )
}

export function startFrequency(
  frequency: number,
  options: PlayFrequencyOptions = {},
) {
  const ctx = getAudioContext()
  const oscillator = createVoiceOscillator(ctx, frequency, options)

  return startSourceVoice(oscillator, options)
}

export function startNoise(options: PlayNoiseOptions = {}) {
  const ctx = getAudioContext()
  const noiseSource = createLoopingNoiseSource(ctx)

  return startSourceVoice(noiseSource, options)
}

export function stopVoice(voiceId: VoiceId) {
  const ctx = getAudioContext()

  scheduleVoiceStop(voiceId, ctx.currentTime)
}

export function stopAllVoices() {
  const ctx = getAudioContext()

  scheduleAllVoicesStop(ctx.currentTime)
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

export function playAudioBufferLooping(
  audioBuffer: AudioBuffer,
  cal: AudioCalibration,
  when: number,
  volume = 1,
  pan = 0,
): AudioBufferSourceNode {
  const ctx = getAudioContext()

  return scheduleLoopingSample(
    ctx,
    getMasterGainNode(ctx),
    audioBuffer,
    cal,
    when,
    volume,
    pan,
  )
}

export function playAudioBufferCalibratedAt(
  audioBuffer: AudioBuffer,
  cal: AudioCalibration,
  when: number,
  volume = 1,
  pan = 0,
): AudioBufferSourceNode {
  const ctx = getAudioContext()

  return scheduleCalibratedSample(
    ctx,
    getMasterGainNode(ctx),
    audioBuffer,
    cal,
    when,
    volume,
    pan,
  )
}
