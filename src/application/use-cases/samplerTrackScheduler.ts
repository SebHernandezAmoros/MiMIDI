import type { SamplerTrack } from "../../domain/project/projectTypes"
import type { SampleSlotMeta } from "../ports/SampleSlotRepository"

export type SamplerTrackSchedulerDependencies = {
  getAudioCurrentTime(): number
  loadSampleAudioBuffer(dbId: string): Promise<AudioBuffer | null>
  nowSeconds(): number
  onSourceScheduled?(source: AudioBufferSourceNode): void
  playAudioBufferCalibratedAt(
    audioBuffer: AudioBuffer,
    calibration: SampleSlotMeta["calibration"],
    when: number,
  ): AudioBufferSourceNode
  shouldCancel?(): boolean
  slots: (SampleSlotMeta | null)[]
}

export const samplerTrackScheduler = {
  kind: "sampler" as const,
  schedule: scheduleSamplerTrackWithDependencies,
}

export async function scheduleSamplerTrackWithDependencies(
  dependencies: SamplerTrackSchedulerDependencies,
  track: SamplerTrack,
  timelineStartedAt: number,
): Promise<AudioBufferSourceNode[]> {
  if (track.muted) {
    return []
  }

  const scheduledSources: AudioBufferSourceNode[] = []
  const secondsPerStep = 60 / track.pattern.bpm / 4

  for (const clip of track.clips) {
    if (dependencies.shouldCancel?.()) return scheduledSources

    for (const lane of track.pattern.lanes) {
      if (dependencies.shouldCancel?.()) return scheduledSources

      const slot = dependencies.slots.find(
        (candidate) => candidate?.dbId === lane.slotDbId,
      )
      if (!slot) continue

      const buffer = await dependencies.loadSampleAudioBuffer(lane.slotDbId)
      if (!buffer || dependencies.shouldCancel?.()) continue

      for (let stepIndex = 0; stepIndex < lane.steps.length; stepIndex += 1) {
        if (!lane.steps[stepIndex].active) continue
        if (dependencies.shouldCancel?.()) return scheduledSources

        const stepOffsetSec = stepIndex * secondsPerStep
        const absoluteWhen = timelineStartedAt / 1000 + clip.startTime + stepOffsetSec
        const audioNow = dependencies.getAudioCurrentTime()
        const when = audioNow + (absoluteWhen - dependencies.nowSeconds())

        if (when < audioNow - 0.5) continue

        const scheduledWhen = Math.max(when, audioNow + 0.01)
        const source = dependencies.playAudioBufferCalibratedAt(
          buffer,
          slot.calibration,
          scheduledWhen,
        )
        scheduledSources.push(source)
        dependencies.onSourceScheduled?.(source)
      }
    }
  }

  return scheduledSources
}
