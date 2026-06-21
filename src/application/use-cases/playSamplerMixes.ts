import { loadSampleAudioBuffer } from "./loadSampleAudioBuffer"
import type { SampleSlotRepository } from "../ports/SampleSlotRepository"
import {
  getAudioCurrentTime,
  playAudioBufferCalibratedAt,
} from "../../engine/audio/audioEngine"
import type { SamplerMixTrack } from "../../engine/project/projectModel"
import { createLegacySampleUseCaseDependencies } from "./legacySampleUseCaseDependencies"

export type PlaySamplerMixesDependencies = {
  sampleSlots: Pick<SampleSlotRepository, "loadSlots">
  loadSampleAudioBuffer(dbId: string): Promise<AudioBuffer | null>
  getAudioCurrentTime(): number
  nowSeconds(): number
  playAudioBufferCalibratedAt(
    audioBuffer: AudioBuffer,
    calibration: Parameters<typeof playAudioBufferCalibratedAt>[1],
    when: number,
  ): AudioBufferSourceNode
}

export type SamplerMixPlaybackController = {
  cancel: () => void
  done: Promise<void>
}

export function playSamplerMixesWithDependencies(
  dependencies: PlaySamplerMixesDependencies,
  mixes: SamplerMixTrack[],
  timelineStartedAt: number,
): SamplerMixPlaybackController {
  if (mixes.length === 0) {
    return { cancel: () => {}, done: Promise.resolve() }
  }

  let cancelled = false
  const scheduledSources: AudioBufferSourceNode[] = []
  const slots = dependencies.sampleSlots.loadSlots()

  const done = (async () => {
    for (const mix of mixes) {
      if (cancelled) return
      if (mix.muted) continue

      const secondsPerStep = 60 / mix.pattern.bpm / 4

      for (const clip of mix.clips) {
        for (const lane of mix.pattern.lanes) {
          if (cancelled) return

          const slot = slots.find((candidate) => candidate?.dbId === lane.slotDbId)
          if (!slot) continue

          const buffer = await dependencies.loadSampleAudioBuffer(lane.slotDbId)
          if (!buffer || cancelled) continue

          for (let stepIndex = 0; stepIndex < lane.steps.length; stepIndex += 1) {
            if (!lane.steps[stepIndex].active) continue

            const stepOffsetSec = stepIndex * secondsPerStep
            const absoluteWhen =
              timelineStartedAt / 1000 + clip.startTime + stepOffsetSec
            const audioNow = dependencies.getAudioCurrentTime()
            const when = audioNow + (absoluteWhen - dependencies.nowSeconds())

            // Loading can race the clock; skip only events that are truly lost.
            if (when < audioNow - 0.5) continue

            const scheduledWhen = Math.max(when, audioNow + 0.01)
            const source = dependencies.playAudioBufferCalibratedAt(
              buffer,
              slot.calibration,
              scheduledWhen,
            )
            scheduledSources.push(source)
          }
        }
      }
    }
  })()

  return {
    cancel: () => {
      cancelled = true
      const now = dependencies.getAudioCurrentTime()

      for (const source of scheduledSources) {
        try {
          source.stop(now)
        } catch {
          // Already ended.
        }
      }

      scheduledSources.length = 0
    },
    done,
  }
}

export function playSamplerMixes(
  mixes: SamplerMixTrack[],
  timelineStartedAt: number,
): { cancel: () => void } {
  const legacyDependencies = createLegacySampleUseCaseDependencies()
  const controller = playSamplerMixesWithDependencies(
    {
      getAudioCurrentTime,
      loadSampleAudioBuffer,
      nowSeconds: () => performance.now() / 1000,
      playAudioBufferCalibratedAt,
      sampleSlots: legacyDependencies.sampleSlots,
    },
    mixes,
    timelineStartedAt,
  )

  return { cancel: controller.cancel }
}
