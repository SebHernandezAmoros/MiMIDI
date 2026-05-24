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
  const scheduledSources: AudioBufferSourceNode[] = []
  const slots = loadSlotMetas()

  void (async () => {
    for (const mix of mixes) {
      if (cancelled) return
      if (mix.muted) continue
      const secondsPerStep = 60 / mix.pattern.bpm / 4

      for (const clip of mix.clips) {
        for (const lane of mix.pattern.lanes) {
          if (cancelled) return
          const slot = slots.find(s => s?.dbId === lane.slotDbId)
          if (!slot) continue

          const buf = await loadSampleAudioBuffer(lane.slotDbId)
          if (!buf || cancelled) continue

          for (let i = 0; i < lane.steps.length; i++) {
            if (!lane.steps[i].active) continue
            const stepOffsetSec = i * secondsPerStep
            const absoluteWhen = (timelineStartedAt / 1000) + clip.startTime + stepOffsetSec
            const audioNow = getAudioCurrentTime()
            const performanceNow = performance.now() / 1000
            const when = audioNow + (absoluteWhen - performanceNow)
            // Si el momento ya pasó por más de 500ms (realmente perdido), ignorar.
            // Si pasó hace menos (race con el await de carga), tocar lo antes posible.
            if (when < audioNow - 0.5) continue
            const scheduledWhen = Math.max(when, audioNow + 0.01)
            const node = playAudioBufferCalibratedAt(buf, slot.calibration, scheduledWhen)
            scheduledSources.push(node)
          }
        }
      }
    }
  })()

  return {
    cancel: () => {
      cancelled = true
      const now = getAudioCurrentTime()
      for (const src of scheduledSources) {
        try { src.stop(now) } catch { /* ya terminó */ }
      }
      scheduledSources.length = 0
    },
  }
}
