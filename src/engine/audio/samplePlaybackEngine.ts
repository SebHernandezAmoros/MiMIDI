import type { AudioCalibration, SamplePlayback } from "./audioTypes"
import { resolveSampleCalibration } from "./sampleCalibration"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function playSimpleSample(
  context: BaseAudioContext,
  masterOutput: AudioNode,
  audioBuffer: AudioBuffer,
  volume = 1,
  pan = 0,
): () => void {
  const panNode = context.createStereoPanner()
  panNode.pan.value = clamp(pan, -1, 1)
  panNode.connect(masterOutput)

  const gainNode = context.createGain()
  gainNode.gain.value = clamp(volume, 0, 2)
  gainNode.connect(panNode)

  const source = context.createBufferSource()
  source.buffer = audioBuffer
  source.connect(gainNode)
  source.start()

  return () => {
    try { source.stop() } catch { /* already stopped */ }
  }
}

export function scheduleSimpleSample(
  context: BaseAudioContext,
  masterOutput: AudioNode,
  audioBuffer: AudioBuffer,
  when: number,
  offset = 0,
  volume = 1,
): () => void {
  const gainNode = context.createGain()
  gainNode.gain.value = clamp(volume, 0, 2)
  gainNode.connect(masterOutput)

  const source = context.createBufferSource()
  source.buffer = audioBuffer
  source.connect(gainNode)
  source.start(when, offset)

  return () => {
    try { source.stop() } catch { /* already stopped */ }
  }
}

function createCalibratedSampleChain(
  context: BaseAudioContext,
  masterOutput: AudioNode,
  audioBuffer: AudioBuffer,
  calibration: AudioCalibration,
  startTime: number,
  volume: number,
  pan: number,
) {
  const {
    fadeIn,
    fadeOut,
    offset,
    playbackRate,
    realDuration,
  } = resolveSampleCalibration(audioBuffer.duration, calibration)
  const endTime = startTime + realDuration

  const panNode = context.createStereoPanner()
  panNode.pan.value = clamp(pan, -1, 1)
  panNode.connect(masterOutput)

  const gainNode = context.createGain()
  const baseGain = clamp(volume * calibration.gain, 0, 4)

  if (fadeIn > 0) {
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.linearRampToValueAtTime(baseGain, startTime + fadeIn)
  } else {
    gainNode.gain.setValueAtTime(baseGain, startTime)
  }

  if (fadeOut > 0) {
    gainNode.gain.setValueAtTime(baseGain, endTime - fadeOut)
    gainNode.gain.linearRampToValueAtTime(0.0001, endTime)
  }

  gainNode.connect(panNode)

  const source = context.createBufferSource()
  source.buffer = audioBuffer
  source.playbackRate.value = playbackRate
  source.connect(gainNode)
  source.start(startTime, offset)
  source.stop(endTime)

  return {
    gainNode,
    panNode,
    realDuration,
    source,
  }
}

export function playCalibratedSample(
  context: BaseAudioContext,
  masterOutput: AudioNode,
  audioBuffer: AudioBuffer,
  calibration: AudioCalibration,
  volume = 1,
  pan = 0,
): SamplePlayback {
  const { gainNode, realDuration, source } = createCalibratedSampleChain(
    context,
    masterOutput,
    audioBuffer,
    calibration,
    context.currentTime,
    volume,
    pan,
  )

  return {
    realDurationMs: realDuration * 1000,
    stop: () => {
      try { source.stop() } catch { /* already stopped */ }
    },
    setGain: (linearGain: number) => {
      gainNode.gain.setTargetAtTime(
        clamp(volume * linearGain, 0, 4),
        context.currentTime,
        0.015,
      )
    },
    setTune: (semitones: number) => {
      source.playbackRate.setTargetAtTime(
        Math.pow(2, semitones / 12),
        context.currentTime,
        0.015,
      )
    },
  }
}

export function scheduleCalibratedSample(
  context: BaseAudioContext,
  masterOutput: AudioNode,
  audioBuffer: AudioBuffer,
  calibration: AudioCalibration,
  when: number,
  volume = 1,
  pan = 0,
): AudioBufferSourceNode {
  const { gainNode, panNode, source } = createCalibratedSampleChain(
    context,
    masterOutput,
    audioBuffer,
    calibration,
    when,
    volume,
    pan,
  )

  source.onended = () => {
    source.disconnect()
    gainNode.disconnect()
    panNode.disconnect()
  }

  return source
}

export function scheduleLoopingSample(
  context: BaseAudioContext,
  masterOutput: AudioNode,
  audioBuffer: AudioBuffer,
  calibration: AudioCalibration,
  when: number,
  volume = 1,
  pan = 0,
): AudioBufferSourceNode {
  const {
    bufferDuration,
    offset,
    playbackRate,
  } = resolveSampleCalibration(audioBuffer.duration, calibration)

  const panNode = context.createStereoPanner()
  panNode.pan.value = clamp(pan, -1, 1)
  panNode.connect(masterOutput)

  const gainNode = context.createGain()
  gainNode.gain.setValueAtTime(
    clamp(volume * calibration.gain, 0, 4),
    when,
  )
  gainNode.connect(panNode)

  const source = context.createBufferSource()
  source.buffer = audioBuffer
  source.playbackRate.value = playbackRate
  source.loop = true
  source.loopStart = offset
  source.loopEnd = offset + bufferDuration
  source.connect(gainNode)
  source.start(when, offset)

  source.onended = () => {
    source.disconnect()
    gainNode.disconnect()
    panNode.disconnect()
  }

  return source
}
