import { encodeAudioBufferToWav } from "../../engine/audio/wavEncoder"
import type { SequencerPattern } from "../../engine/audio/sequencerModel"
import type { SampleSlotMeta } from "../ports/SampleSlotRepository"

export async function exportSeqMix(
  pattern: SequencerPattern,
  slots: (SampleSlotMeta | null)[],
  bufferCache: Map<string, AudioBuffer>,
  filename: string,
): Promise<void> {
  const secondsPerStep = 60 / pattern.bpm / 4
  const totalDuration = pattern.stepsPerBar * secondsPerStep
  const sampleRate = 44100
  const length = Math.ceil(totalDuration * sampleRate)

  const offlineCtx = new OfflineAudioContext(2, length, sampleRate)

  for (const lane of pattern.lanes) {
    const slot = slots.find(s => s?.dbId === lane.slotDbId)
    if (!slot) continue
    const buf = bufferCache.get(lane.slotDbId)
    if (!buf) continue

    const cal = slot.calibration
    const trimOffset = Math.max(0, Math.min(1, cal.trimStart)) * buf.duration
    const trimEnd = Math.max(0, Math.min(1, cal.trimEnd)) * buf.duration
    const trimDur = Math.max(0.001, trimEnd - trimOffset)
    const playbackRate = Math.pow(2, cal.tune / 12)
    const realDuration = trimDur / playbackRate
    const baseGain = Math.min(Math.max(cal.gain, 0), 4)

    for (let i = 0; i < lane.steps.length; i++) {
      if (!lane.steps[i].active) continue
      const when = i * secondsPerStep

      const gainNode = offlineCtx.createGain()
      const fadeIn = Math.min(Math.max(cal.fadeIn, 0), realDuration * 0.9)
      const fadeOut = Math.min(Math.max(cal.fadeOut, 0), realDuration * 0.9 - fadeIn)

      if (fadeIn > 0) {
        gainNode.gain.setValueAtTime(0.0001, when)
        gainNode.gain.linearRampToValueAtTime(baseGain, when + fadeIn)
      } else {
        gainNode.gain.setValueAtTime(baseGain, when)
      }
      if (fadeOut > 0) {
        gainNode.gain.setValueAtTime(baseGain, when + realDuration - fadeOut)
        gainNode.gain.linearRampToValueAtTime(0.0001, when + realDuration)
      }

      gainNode.connect(offlineCtx.destination)

      const source = offlineCtx.createBufferSource()
      source.buffer = buf
      source.playbackRate.value = playbackRate
      source.connect(gainNode)
      source.start(when, trimOffset, trimDur)
    }
  }

  const rendered = await offlineCtx.startRendering()
  const wav = encodeAudioBufferToWav(rendered, { bitDepth: 24 })
  const blob = new Blob([wav], { type: "audio/wav" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const safeName = filename.trim() || `mimidi-mix-${pattern.bpm}bpm`
  a.download = `${safeName}.wav`
  a.click()
  URL.revokeObjectURL(url)
}
