import type { AudioClipTrack } from "../../domain/project/projectTypes"

export type AudioClipTrackSchedulerDependencies = {
  getAudioCurrentTime(): number
  loadSampleAudioBuffer(dbId: string): Promise<AudioBuffer | null>
  nowMs(): number
  scheduleAudioBuffer(
    audioBuffer: AudioBuffer,
    when: number,
    offset?: number,
  ): () => void
}

export type AudioClipTrackScheduleContext = {
  startedAtMs: number
}

export const audioClipTrackScheduler = {
  kind: "audio-clip" as const,
  schedule: scheduleAudioClipTrackWithDependencies,
}

export async function scheduleAudioClipTrackWithDependencies(
  dependencies: AudioClipTrackSchedulerDependencies,
  track: AudioClipTrack,
  startedAtMs: number,
): Promise<Array<() => void>> {
  if (track.muted) {
    return []
  }

  const audioBuffer = await dependencies.loadSampleAudioBuffer(track.dbId)

  if (!audioBuffer) {
    return []
  }

  const stops: Array<() => void> = []

  for (const clip of track.clips) {
    const elapsedSec = (dependencies.nowMs() - startedAtMs) / 1000
    const offset = Math.max(0, elapsedSec - clip.startTime)
    const when =
      dependencies.getAudioCurrentTime() +
      Math.max(0, clip.startTime - elapsedSec)

    stops.push(dependencies.scheduleAudioBuffer(audioBuffer, when, offset))
  }

  return stops
}
