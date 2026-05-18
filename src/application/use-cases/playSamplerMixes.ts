import { loadSampleAudioBuffer } from "./loadSampleAudioBuffer"
import { loadSlotMetas } from "../../engine/audio/sampleModel"
import { playAudioBufferCalibratedAt, getAudioCurrentTime } from "../../engine/audio/audioEngine"
import type { SamplerMixTrack } from "../../engine/project/projectModel"

export function playSamplerMixes(
  mixes: SamplerMixTrack[],
  timelineStartedAt: number,
): { cancel: () => void } {
  if (mixes.length === 0) return { cancel: () => {} }

  let cancelled = false
  const sources: AudioBufferSourceNode[] = []

  const slots = loadSlotMetas()

  void (async () => {
    for (const mix of mixes) {
      if (cancelled) return
      const secondsPerStep = 60 / mix.pattern.bpm / 4

      for (const lane of mix.pattern.lanes) {
        if (cancelled) return
        const slot = slots.find(s => s?.dbId === lane.slotDbId)
        if (!slot) continue

        const buf = await loadSampleAudioBuffer(lane.slotDbId)
        if (!buf || cancelled) continue

        for (let i = 0; i < lane.steps.length; i++) {
          if (!lane.steps[i].active) continue
          const stepOffsetSec = i * secondsPerStep
          const absoluteWhen = (timelineStartedAt / 1000) + mix.startTime + stepOffsetSec
          const audioNow = getAudioCurrentTime()
          const performanceNow = performance.now() / 1000
          const when = audioNow + (absoluteWhen - performanceNow)
          if (when < audioNow) continue
          playAudioBufferCalibratedAt(buf, slot.calibration, when)
        }
      }
    }
  })()

  return {
    cancel: () => { cancelled = true },
  }
}
