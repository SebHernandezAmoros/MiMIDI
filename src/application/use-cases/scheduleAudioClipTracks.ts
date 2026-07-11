import {
  ensureAudioReady,
  getAudioContextCurrentTime,
  scheduleAudioBuffer,
} from "../../engine/audio/audioEngine"
import type { AudioClipTrack } from "../../domain/project/projectTypes"
import { getTrackScheduler } from "./trackSchedulers"
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
    const scheduler = getTrackScheduler(track)

    if (scheduler.kind !== "audio-clip") {
      continue
    }

    stops.push(
      ...(await scheduler.schedule(
        dependencies,
        track,
        startedAtMs,
      )),
    )
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
