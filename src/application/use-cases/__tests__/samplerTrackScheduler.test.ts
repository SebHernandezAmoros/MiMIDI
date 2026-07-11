import { describe, expect, it, vi } from "vitest"

import {
  samplerTrackScheduler,
  scheduleSamplerTrackWithDependencies,
} from "../samplerTrackScheduler"
import type { SamplerTrack } from "../../../domain/project/projectTypes"
import type { SampleCalibration } from "../../ports/SampleSlotRepository"

const calibration: SampleCalibration = {
  fadeIn: 0,
  fadeOut: 0,
  gain: 1,
  trimEnd: 1,
  trimStart: 0,
  tune: 0,
}

function createSamplerTrack(overrides: Partial<SamplerTrack> = {}): SamplerTrack {
  return {
    clips: [{ id: "clip-1", startTime: 1 }],
    id: "sampler-track",
    kind: "sampler",
    muted: false,
    name: "Beat",
    pattern: {
      bpm: 120,
      lanes: [
        {
          slotDbId: "slot-kick",
          steps: [{ active: true }, { active: false }, { active: true }],
        },
      ],
      stepsPerBar: 16,
    },
    ...overrides,
  }
}

describe("samplerTrackScheduler", () => {
  it("describes the sampler scheduler kind", () => {
    expect(samplerTrackScheduler.kind).toBe("sampler")
  })

  it("schedules active sampler steps through injected dependencies", async () => {
    const audioBuffer = { duration: 1 } as AudioBuffer
    const source = { stop: vi.fn() } as unknown as AudioBufferSourceNode
    const playAudioBufferCalibratedAt = vi.fn().mockReturnValue(source)

    const sources = await scheduleSamplerTrackWithDependencies(
      {
        getAudioCurrentTime: () => 20,
        loadSampleAudioBuffer: vi.fn().mockResolvedValue(audioBuffer),
        nowSeconds: () => 20,
        playAudioBufferCalibratedAt,
        slots: [
          {
            calibration,
            channels: 1,
            dbId: "slot-kick",
            duration: 1,
            index: 0,
            name: "Kick",
            sampleRate: 44100,
          },
        ],
      },
      createSamplerTrack(),
      20_000,
    )

    expect(playAudioBufferCalibratedAt).toHaveBeenNthCalledWith(
      1,
      audioBuffer,
      calibration,
      21,
    )
    expect(playAudioBufferCalibratedAt).toHaveBeenNthCalledWith(
      2,
      audioBuffer,
      calibration,
      21.25,
    )
    expect(sources).toEqual([source, source])
  })

  it("skips muted sampler tracks", async () => {
    const playAudioBufferCalibratedAt = vi.fn()

    const sources = await scheduleSamplerTrackWithDependencies(
      {
        getAudioCurrentTime: () => 0,
        loadSampleAudioBuffer: vi.fn(),
        nowSeconds: () => 0,
        playAudioBufferCalibratedAt,
        slots: [],
      },
      createSamplerTrack({ muted: true }),
      0,
    )

    expect(sources).toEqual([])
    expect(playAudioBufferCalibratedAt).not.toHaveBeenCalled()
  })
})
