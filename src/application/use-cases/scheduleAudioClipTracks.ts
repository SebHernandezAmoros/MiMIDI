import {
  ensureAudioReady,
  getAudioContextCurrentTime,
  scheduleAudioBuffer,
} from "../../engine/audio/audioEngine"
import type { AudioClipTrack } from "../../engine/project/projectModel"
import { loadSampleAudioBuffer } from "./loadSampleAudioBuffer"

export type ScheduleAudioClipTracksDependencies = {
  ensureAudioReady(): Promise<void>
  getAudioCurrentTime(): number
  loadSampleAudioBuffer(dbId: string): Promise<AudioBuffer | null>
  nowMs(): number
  scheduleAudioBuffer(
    audioBuffer: AudioBuffer,
    when: number,
    offset?: number,
  ): () => void
}

export async function scheduleAudioClipTracksWithDependencies(
  dependencies: ScheduleAudioClipTracksDependencies,
  tracks: AudioClipTrack[],
  startedAtMs: number,
): Promise<Array<() => void>> {
  const activeTracks = tracks.filter((track) => !track.muted)

  if (activeTracks.length === 0) {
    return []
  }

  await dependencies.ensureAudioReady()

  const stops: Array<() => void> = []

  for (const track of activeTracks) {
    const audioBuffer = await dependencies.loadSampleAudioBuffer(track.dbId)

    if (!audioBuffer) {
      continue
    }

    for (const clip of track.clips) {
      const elapsedSec = (dependencies.nowMs() - startedAtMs) / 1000
      const offset = Math.max(0, elapsedSec - clip.startTime)
      const when =
        dependencies.getAudioCurrentTime() +
        Math.max(0, clip.startTime - elapsedSec)

      stops.push(dependencies.scheduleAudioBuffer(audioBuffer, when, offset))
    }
  }

  return stops
}

export async function scheduleAudioClipTracks(
  tracks: AudioClipTrack[],
  startedAtMs: number,
): Promise<Array<() => void>> {
  return scheduleAudioClipTracksWithDependencies(
    {
      ensureAudioReady,
      getAudioCurrentTime: getAudioContextCurrentTime,
      loadSampleAudioBuffer,
      nowMs: () => performance.now(),
      scheduleAudioBuffer,
    },
    tracks,
    startedAtMs,
  )
}
