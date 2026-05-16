import { type AudioCalibration } from "../../engine/audio/audioEngine"
import { encodeAudioBufferToWav } from "../../engine/audio/wavEncoder"

export async function exportSampleSlot(
  audioBuffer: AudioBuffer,
  calibration: AudioCalibration,
  filename: string,
): Promise<void> {
  const totalDur = audioBuffer.duration
  const offset = Math.max(0, Math.min(1, calibration.trimStart)) * totalDur
  const bufferDuration = Math.max(0.001, Math.min(1, calibration.trimEnd) * totalDur - offset)
  const playbackRate = Math.pow(2, calibration.tune / 12)
  const realDuration = bufferDuration / playbackRate
  const sampleRate = audioBuffer.sampleRate
  const length = Math.ceil(realDuration * sampleRate)

  const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, length, sampleRate)

  const gainNode = offlineCtx.createGain()
  const baseGain = Math.min(Math.max(calibration.gain, 0), 4)
  const fadeIn = Math.min(Math.max(calibration.fadeIn, 0), realDuration * 0.9)
  const fadeOut = Math.min(Math.max(calibration.fadeOut, 0), realDuration * 0.9 - fadeIn)

  if (fadeIn > 0) {
    gainNode.gain.setValueAtTime(0.0001, 0)
    gainNode.gain.linearRampToValueAtTime(baseGain, fadeIn)
  } else {
    gainNode.gain.setValueAtTime(baseGain, 0)
  }

  if (fadeOut > 0) {
    gainNode.gain.setValueAtTime(baseGain, realDuration - fadeOut)
    gainNode.gain.linearRampToValueAtTime(0.0001, realDuration)
  }

  gainNode.connect(offlineCtx.destination)

  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.playbackRate.value = playbackRate
  source.connect(gainNode)
  source.start(0, offset)

  const rendered = await offlineCtx.startRendering()
  const wav = encodeAudioBufferToWav(rendered, { bitDepth: 24 })

  const blob = new Blob([wav], { type: "audio/wav" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.wav`
  a.click()
  URL.revokeObjectURL(url)
}
