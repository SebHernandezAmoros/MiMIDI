import { describe, expect, it, vi } from "vitest"

import {
  audioClipTrackScheduler,
  scheduleAudioClipTrackWithDependencies,
} from "../audioClipTrackScheduler"
import type { AudioClipTrack } from "../../../domain/project/projectTypes"

function createAudioClipTrack(overrides: Partial<AudioClipTrack> = {}): AudioClipTrack {
  return {
    clips: [{ id: "clip-a", startTime: 2 }],
    dbId: "audio-db",
    duration: 4,
    id: "audio-track",
    kind: "audio-clip",
    muted: false,
    name: "Audio",
    ...overrides,
  }
}

describe("audioClipTrackScheduler", () => {
  it("describes the audio clip scheduler kind", () => {
    expect(audioClipTrackScheduler.kind).toBe("audio-clip")
  })

  it("schedules audio clip tracks through injected dependencies", async () => {
    const audioBuffer = { duration: 4 } as AudioBuffer
    const stop = vi.fn()
    const scheduleAudioBuffer = vi.fn().mockReturnValue(stop)

    const stops = await scheduleAudioClipTrackWithDependencies(
      {
        getAudioCurrentTime: () => 50,
        loadSampleAudioBuffer: vi.fn().mockResolvedValue(audioBuffer),
        nowMs: () => 11_000,
        scheduleAudioBuffer,
      },
      createAudioClipTrack(),
      10_000,
    )

    expect(scheduleAudioBuffer).toHaveBeenCalledWith(audioBuffer, 51, 0)
    expect(stops).toEqual([stop])
  })

  it("skips muted audio clip tracks", async () => {
    const scheduleAudioBuffer = vi.fn()

    const stops = await scheduleAudioClipTrackWithDependencies(
      {
        getAudioCurrentTime: () => 0,
        loadSampleAudioBuffer: vi.fn(),
        nowMs: () => 0,
        scheduleAudioBuffer,
      },
      createAudioClipTrack({ muted: true }),
      0,
    )

    expect(stops).toEqual([])
    expect(scheduleAudioBuffer).not.toHaveBeenCalled()
  })
})
