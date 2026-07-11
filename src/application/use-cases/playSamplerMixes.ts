import { loadSampleAudioBuffer } from "./loadSampleAudioBuffer"
import type { SampleSlotRepository } from "../ports/SampleSlotRepository"
import {
  getAudioCurrentTime,
  playAudioBufferCalibratedAt,
} from "../../engine/audio/audioEngine"
import type { SamplerMixTrack } from "../../domain/project/projectTypes"
import { createLegacySampleUseCaseDependencies } from "./legacySampleUseCaseDependencies"
import { getTrackScheduler } from "./trackSchedulers"

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
      const scheduler = getTrackScheduler(mix)
      if (scheduler.kind !== "sampler") continue

      await scheduler.schedule(
        {
          getAudioCurrentTime: dependencies.getAudioCurrentTime,
          loadSampleAudioBuffer: dependencies.loadSampleAudioBuffer,
          nowSeconds: dependencies.nowSeconds,
          onSourceScheduled(source) {
            scheduledSources.push(source)
          },
          playAudioBufferCalibratedAt: dependencies.playAudioBufferCalibratedAt,
          shouldCancel: () => cancelled,
          slots,
        },
        mix,
        timelineStartedAt,
      )
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
