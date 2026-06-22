import { describe, expect, it, vi } from "vitest"
import type { SampleRepository } from "../../ports/SampleRepository"
import { deleteSampleSlotWithRepository } from "../deleteSampleSlot"
import { importSampleFileWithDependencies } from "../importSampleFile"
import { loadSampleAudioBufferWithDependencies } from "../loadSampleAudioBuffer"
import { playSamplerMixesWithDependencies } from "../playSamplerMixes"
import {
  loadPluginClipWithDependencies,
  processPluginAudioOutputWithDependencies,
  storePluginClipWithDependencies,
} from "../pluginAudioOutputs"
import { finalizeMicRecordingWithDependencies } from "../recordMicSample"
import { scheduleAudioClipTracksWithDependencies } from "../scheduleAudioClipTracks"
import { sendSamplerMixToTimelineWithRepository } from "../sendSamplerMixToTimeline"
import {
  clearSampleSlotsWithRepositories,
  loadSampleSlotsWithRepository,
  saveSampleSlotsWithRepository,
} from "../sampleSlots"
import { NUM_SAMPLE_SLOTS } from "../../ports/SampleSlotRepository"
import { createDefaultProject } from "../../../engine/project/projectModel"
import type { ProjectRepository } from "../../ports/ProjectRepository"

function createSampleRepository(
  overrides: Partial<SampleRepository> = {},
): SampleRepository {
  return {
    delete: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
    ...overrides,
  }
}

function createProjectRepository(
  overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
  return {
    load: vi.fn(),
    save: vi.fn(),
    ...overrides,
  }
}

describe("sample use-cases", () => {
  it("loads sample slots through a slot repository", () => {
    const slots = [null]
    const repository = {
      loadSlots: vi.fn().mockReturnValue(slots),
      saveSlots: vi.fn(),
    }

    const result = loadSampleSlotsWithRepository(repository)

    expect(repository.loadSlots).toHaveBeenCalledOnce()
    expect(result).toBe(slots)
  })

  it("saves sample slots through a slot repository", () => {
    const slots = [null]
    const repository = {
      loadSlots: vi.fn(),
      saveSlots: vi.fn(),
    }

    saveSampleSlotsWithRepository(repository, slots)

    expect(repository.saveSlots).toHaveBeenCalledWith(slots)
  })

  it("clears sample slots and deletes the stored buffers for occupied slots", async () => {
    const samples = createSampleRepository()
    const sampleSlots = {
      loadSlots: vi.fn().mockReturnValue([
        {
          calibration: {
            fadeIn: 0,
            fadeOut: 0,
            gain: 1,
            trimEnd: 1,
            trimStart: 0,
            tune: 0,
          },
          channels: 1,
          dbId: "slot-kick",
          duration: 1,
          index: 0,
          name: "Kick",
          sampleRate: 44100,
        },
        null,
        {
          calibration: {
            fadeIn: 0,
            fadeOut: 0,
            gain: 1,
            trimEnd: 1,
            trimStart: 0,
            tune: 0,
          },
          channels: 1,
          dbId: "slot-snare",
          duration: 1,
          index: 2,
          name: "Snare",
          sampleRate: 44100,
        },
      ]),
      saveSlots: vi.fn(),
    }

    await clearSampleSlotsWithRepositories({ sampleSlots, samples })

    expect(samples.delete).toHaveBeenCalledTimes(2)
    expect(samples.delete).toHaveBeenNthCalledWith(1, "slot-kick")
    expect(samples.delete).toHaveBeenNthCalledWith(2, "slot-snare")
    expect(sampleSlots.saveSlots).toHaveBeenCalledWith(
      Array<null>(NUM_SAMPLE_SLOTS).fill(null),
    )
  })

  it("stores plugin clips and returns the generated db id", async () => {
    const data = new TextEncoder().encode("plugin clip").buffer
    const blob = {
      arrayBuffer: vi.fn().mockResolvedValue(data),
    } as unknown as Blob
    const samples = createSampleRepository()

    const dbId = await storePluginClipWithDependencies(
      {
        createClipId: vi.fn().mockReturnValue("plugin-clip-fixed"),
        samples,
      },
      blob,
    )

    expect(dbId).toBe("plugin-clip-fixed")
    expect(samples.save).toHaveBeenCalledWith("plugin-clip-fixed", data)
  })

  it("loads plugin clips as WebM blobs", async () => {
    const data = new TextEncoder().encode("plugin clip").buffer
    const samples = createSampleRepository({
      load: vi.fn().mockResolvedValue(data),
    })

    const blob = await loadPluginClipWithDependencies({ samples }, "clip-1")

    expect(samples.load).toHaveBeenCalledWith("clip-1")
    expect(blob).toBeInstanceOf(Blob)
    expect(blob?.type).toBe("audio/webm")
    expect(await blob?.arrayBuffer()).toEqual(data)
  })

  it("returns null when a plugin clip is missing", async () => {
    const samples = createSampleRepository({
      load: vi.fn().mockResolvedValue(null),
    })

    await expect(
      loadPluginClipWithDependencies({ samples }, "missing"),
    ).resolves.toBeNull()
  })

  it("sends plugin audio outputs to the project without duplicating stored blobs", async () => {
    const blob = {
      arrayBuffer: vi.fn(),
    } as unknown as Blob
    const samples = createSampleRepository()

    const result = await processPluginAudioOutputWithDependencies(
      {
        createAudioId: vi.fn().mockReturnValue("unused"),
        decodeAudioData: vi.fn(),
        sampleSlots: { loadSlots: vi.fn(), saveSlots: vi.fn() },
        samples,
      },
      {
        blob,
        dbId: "existing-plugin-audio",
        destination: "project",
        duration: 2,
        name: "Plugin take",
        type: "audio",
      },
    )

    expect(blob.arrayBuffer).not.toHaveBeenCalled()
    expect(samples.save).not.toHaveBeenCalled()
    expect(result).toEqual({
      dbId: "existing-plugin-audio",
      duration: 2,
      name: "Plugin take",
      type: "project-track",
    })
  })

  it("saves plugin audio outputs before sending new audio to the project", async () => {
    const data = new TextEncoder().encode("project audio").buffer
    const blob = {
      arrayBuffer: vi.fn().mockResolvedValue(data),
    } as unknown as Blob
    const samples = createSampleRepository()

    const result = await processPluginAudioOutputWithDependencies(
      {
        createAudioId: vi.fn().mockReturnValue("new-plugin-audio"),
        decodeAudioData: vi.fn(),
        sampleSlots: { loadSlots: vi.fn(), saveSlots: vi.fn() },
        samples,
      },
      {
        blob,
        destination: "project",
        duration: 2,
        name: "Plugin take",
        type: "audio",
      },
    )

    expect(samples.save).toHaveBeenCalledWith("new-plugin-audio", data)
    expect(result).toMatchObject({
      dbId: "new-plugin-audio",
      type: "project-track",
    })
  })

  it("places plugin audio outputs in the first empty sampler slot", async () => {
    const data = new TextEncoder().encode("sampler audio").buffer
    const blob = {
      arrayBuffer: vi.fn().mockResolvedValue(data),
    } as unknown as Blob
    const audioBuffer = {
      duration: 1.5,
      numberOfChannels: 2,
      sampleRate: 48000,
    } as AudioBuffer
    const samples = createSampleRepository()
    const sampleSlots = {
      loadSlots: vi.fn().mockReturnValue([null, null]),
      saveSlots: vi.fn(),
    }

    const result = await processPluginAudioOutputWithDependencies(
      {
        createAudioId: vi.fn().mockReturnValue("sampler-plugin-audio"),
        decodeAudioData: vi.fn().mockResolvedValue(audioBuffer),
        sampleSlots,
        samples,
      },
      {
        blob,
        destination: "sampler",
        duration: 1.5,
        name: "Sampler take",
        type: "audio",
      },
    )

    expect(samples.save).toHaveBeenCalledWith("sampler-plugin-audio", data)
    expect(sampleSlots.saveSlots).toHaveBeenCalledWith([
      expect.objectContaining({
        channels: 2,
        dbId: "sampler-plugin-audio",
        duration: 1.5,
        index: 1,
        name: "Sampler take",
        sampleRate: 48000,
      }),
      null,
    ])
    expect(result).toEqual({ type: "sampler-slot" })
  })

  it("returns a download when plugin audio targets the sampler and no slot is empty", async () => {
    const data = new TextEncoder().encode("sampler audio").buffer
    const blob = {
      arrayBuffer: vi.fn().mockResolvedValue(data),
    } as unknown as Blob
    const samples = createSampleRepository()
    const sampleSlots = {
      loadSlots: vi.fn().mockReturnValue([
        {
          calibration: {
            fadeIn: 0,
            fadeOut: 0,
            gain: 1,
            trimEnd: 1,
            trimStart: 0,
            tune: 0,
          },
          channels: 1,
          dbId: "occupied",
          duration: 1,
          index: 1,
          name: "Occupied",
          sampleRate: 44100,
        },
      ]),
      saveSlots: vi.fn(),
    }

    const result = await processPluginAudioOutputWithDependencies(
      {
        createAudioId: vi.fn().mockReturnValue("sampler-plugin-audio"),
        decodeAudioData: vi.fn().mockResolvedValue({
          duration: 1,
          numberOfChannels: 1,
          sampleRate: 44100,
        } as AudioBuffer),
        sampleSlots,
        samples,
      },
      {
        blob,
        destination: "sampler",
        duration: 1,
        name: "Sampler take",
        type: "audio",
      },
    )

    expect(sampleSlots.saveSlots).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      fileName: "Sampler take.webm",
      type: "download",
    })
  })

  it("adds sampler mixes to the stored project through a project repository", () => {
    const project = createDefaultProject()
    const repository = createProjectRepository({
      load: vi.fn().mockReturnValue(project),
    })
    const pattern = {
      bpm: 90,
      lanes: [{ slotDbId: "slot-1", steps: [{ active: true }] }],
      stepsPerBar: 16,
    }

    const result = sendSamplerMixToTimelineWithRepository(
      repository,
      pattern,
      "  Beat intro  ",
    )

    expect(result).not.toBeNull()
    expect(repository.save).toHaveBeenCalledOnce()
    const savedProject = vi.mocked(repository.save).mock.calls[0]?.[0]
    expect(savedProject?.timeline.at(-1)).toMatchObject({
      kind: "sampler",
      name: "Beat intro",
      pattern,
    })
  })

  it("uses a default sampler mix name based on existing sampler tracks", () => {
    const project = createDefaultProject()
    const repository = createProjectRepository({
      load: vi.fn().mockReturnValue(project),
    })
    const pattern = { bpm: 120, lanes: [], stepsPerBar: 16 }
    const firstResult = sendSamplerMixToTimelineWithRepository(
      repository,
      pattern,
      "",
    )
    const secondRepository = createProjectRepository({
      load: vi.fn().mockReturnValue(firstResult),
    })

    sendSamplerMixToTimelineWithRepository(secondRepository, pattern, " ")

    expect(vi.mocked(repository.save).mock.calls[0]?.[0].timeline.at(-1)).toMatchObject({
      name: "Mix 1",
    })
    expect(vi.mocked(secondRepository.save).mock.calls[0]?.[0].timeline.at(-1)).toMatchObject({
      name: "Mix 2",
    })
  })

  it("does not send sampler mixes when no project is stored", () => {
    const repository = createProjectRepository({
      load: vi.fn().mockReturnValue(null),
    })

    const result = sendSamplerMixToTimelineWithRepository(
      repository,
      { bpm: 120, lanes: [], stepsPerBar: 16 },
      "Beat",
    )

    expect(result).toBeNull()
    expect(repository.save).not.toHaveBeenCalled()
  })

  it("deletes sample slots through a sample repository", async () => {
    const repository = createSampleRepository()

    await deleteSampleSlotWithRepository(repository, "sample-1")

    expect(repository.delete).toHaveBeenCalledWith("sample-1")
  })

  it("returns null when loading a missing sample audio buffer", async () => {
    const repository = createSampleRepository({
      load: vi.fn().mockResolvedValue(null),
    })
    const decodeAudioData = vi.fn()

    const result = await loadSampleAudioBufferWithDependencies(
      { decodeAudioData, samples: repository },
      "missing-sample",
    )

    expect(result).toBeNull()
    expect(decodeAudioData).not.toHaveBeenCalled()
  })

  it("loads and decodes an existing sample audio buffer", async () => {
    const arrayBuffer = new TextEncoder().encode("sample").buffer
    const audioBuffer = {} as AudioBuffer
    const repository = createSampleRepository({
      load: vi.fn().mockResolvedValue(arrayBuffer),
    })
    const decodeAudioData = vi.fn().mockResolvedValue(audioBuffer)

    const result = await loadSampleAudioBufferWithDependencies(
      { decodeAudioData, samples: repository },
      "sample-1",
    )

    expect(repository.load).toHaveBeenCalledWith("sample-1")
    expect(decodeAudioData).toHaveBeenCalledWith(arrayBuffer)
    expect(result).toBe(audioBuffer)
  })

  it("imports sample files through injected dependencies", async () => {
    const arrayBuffer = new TextEncoder().encode("audio-file").buffer
    const audioBuffer = {
      duration: 2.5,
      numberOfChannels: 2,
      sampleRate: 48000,
    } as AudioBuffer
    const file = {
      arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
      name: "Kick.wav",
    } as unknown as File
    const repository = createSampleRepository()
    const decodeAudioData = vi.fn().mockResolvedValue(audioBuffer)
    const createSampleId = vi.fn().mockReturnValue("sample-fixed-id")

    const result = await importSampleFileWithDependencies(
      { createSampleId, decodeAudioData, samples: repository },
      file,
    )

    expect(file.arrayBuffer).toHaveBeenCalled()
    expect(decodeAudioData).toHaveBeenCalledWith(arrayBuffer)
    expect(repository.save).toHaveBeenCalledWith("sample-fixed-id", arrayBuffer)
    expect(result).toEqual({
      audioBuffer,
      channels: 2,
      dbId: "sample-fixed-id",
      duration: 2.5,
      name: "Kick",
      sampleRate: 48000,
    })
  })

  it("finalizes mic recordings through injected dependencies", async () => {
    const arrayBuffer = new TextEncoder().encode("recorded-audio").buffer
    const audioBuffer = {
      duration: 3.25,
      numberOfChannels: 1,
      sampleRate: 44100,
    } as AudioBuffer
    const blob = {
      arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
    } as unknown as Blob
    const repository = createSampleRepository()
    const decodeAudioData = vi.fn().mockResolvedValue(audioBuffer)
    const createSampleId = vi.fn().mockReturnValue("sample-recording-id")
    const now = vi.fn().mockReturnValue(new Date("2026-06-19T07:08:09"))

    const result = await finalizeMicRecordingWithDependencies(
      { createSampleId, decodeAudioData, now, samples: repository },
      blob,
    )

    expect(blob.arrayBuffer).toHaveBeenCalled()
    expect(decodeAudioData).toHaveBeenCalledWith(arrayBuffer)
    expect(repository.save).toHaveBeenCalledWith(
      "sample-recording-id",
      arrayBuffer,
    )
    expect(result).toEqual({
      audioBuffer,
      channels: 1,
      dbId: "sample-recording-id",
      duration: 3.25,
      name: "rec-070809",
      sampleRate: 44100,
    })
  })

  it("schedules active sampler steps through injected dependencies", async () => {
    const calibration = {
      fadeIn: 0,
      fadeOut: 0,
      gain: 1,
      trimEnd: 1,
      trimStart: 0,
      tune: 0,
    }
    const audioBuffer = { duration: 1 } as AudioBuffer
    const source = { stop: vi.fn() } as unknown as AudioBufferSourceNode
    const playAudioBufferCalibratedAt = vi.fn().mockReturnValue(source)

    const controller = playSamplerMixesWithDependencies(
      {
        getAudioCurrentTime: () => 20,
        loadSampleAudioBuffer: vi.fn().mockResolvedValue(audioBuffer),
        nowSeconds: () => 20,
        playAudioBufferCalibratedAt,
        sampleSlots: {
          loadSlots: () => [
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
      },
      [
        {
          clips: [{ id: "clip-1", startTime: 1 }],
          id: "sampler-1",
          kind: "sampler",
          muted: false,
          name: "Beat",
          pattern: {
            bpm: 120,
            lanes: [
              {
                slotDbId: "slot-kick",
                steps: [
                  { active: true },
                  { active: false },
                  { active: true },
                ],
              },
            ],
            stepsPerBar: 16,
          },
          solo: false,
        },
      ],
      20_000,
    )

    await controller.done

    expect(playAudioBufferCalibratedAt).toHaveBeenCalledTimes(2)
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

    controller.cancel()

    expect(source.stop).toHaveBeenCalledWith(20)
  })

  it("skips muted sampler mixes and missing slots", async () => {
    const loadSampleAudioBuffer = vi.fn()
    const playAudioBufferCalibratedAt = vi.fn()

    const controller = playSamplerMixesWithDependencies(
      {
        getAudioCurrentTime: () => 10,
        loadSampleAudioBuffer,
        nowSeconds: () => 10,
        playAudioBufferCalibratedAt,
        sampleSlots: { loadSlots: () => [] },
      },
      [
        {
          clips: [{ id: "clip-1", startTime: 0 }],
          id: "sampler-muted",
          kind: "sampler",
          muted: true,
          name: "Muted",
          pattern: {
            bpm: 120,
            lanes: [{ slotDbId: "missing-slot", steps: [{ active: true }] }],
            stepsPerBar: 16,
          },
        },
        {
          clips: [{ id: "clip-2", startTime: 0 }],
          id: "sampler-missing-slot",
          kind: "sampler",
          muted: false,
          name: "Missing slot",
          pattern: {
            bpm: 120,
            lanes: [{ slotDbId: "missing-slot", steps: [{ active: true }] }],
            stepsPerBar: 16,
          },
        },
      ],
      10_000,
    )

    await controller.done

    expect(loadSampleAudioBuffer).not.toHaveBeenCalled()
    expect(playAudioBufferCalibratedAt).not.toHaveBeenCalled()
  })

  it("schedules active audio clips through injected dependencies", async () => {
    const audioBuffer = { duration: 4 } as AudioBuffer
    const stopFutureClip = vi.fn()
    const stopStartedClip = vi.fn()
    const loadSampleAudioBuffer = vi.fn().mockResolvedValue(audioBuffer)
    const scheduleAudioBuffer = vi
      .fn()
      .mockReturnValueOnce(stopFutureClip)
      .mockReturnValueOnce(stopStartedClip)
    const ensureAudioReady = vi.fn().mockResolvedValue(undefined)

    const stops = await scheduleAudioClipTracksWithDependencies(
      {
        ensureAudioReady,
        getAudioCurrentTime: () => 50,
        loadSampleAudioBuffer,
        nowMs: () => 11_000,
        scheduleAudioBuffer,
      },
      [
        {
          clips: [{ id: "future-clip", startTime: 2 }],
          dbId: "audio-sample-1",
          duration: 4,
          id: "audio-track-1",
          kind: "audio-clip",
          muted: false,
          name: "Vocal",
        },
        {
          clips: [{ id: "muted-clip", startTime: 0 }],
          dbId: "audio-muted",
          duration: 2,
          id: "audio-muted-track",
          kind: "audio-clip",
          muted: true,
          name: "Muted audio",
        },
        {
          clips: [{ id: "started-clip", startTime: 0.25 }],
          dbId: "audio-sample-1",
          duration: 4,
          id: "audio-track-2",
          kind: "audio-clip",
          muted: false,
          name: "Loop",
        },
      ],
      10_000,
    )

    expect(ensureAudioReady).toHaveBeenCalledOnce()
    expect(loadSampleAudioBuffer).toHaveBeenCalledTimes(2)
    expect(loadSampleAudioBuffer).toHaveBeenNthCalledWith(1, "audio-sample-1")
    expect(loadSampleAudioBuffer).toHaveBeenNthCalledWith(2, "audio-sample-1")
    expect(scheduleAudioBuffer).toHaveBeenNthCalledWith(1, audioBuffer, 51, 0)
    expect(scheduleAudioBuffer).toHaveBeenNthCalledWith(
      2,
      audioBuffer,
      50,
      0.75,
    )
    expect(stops).toEqual([stopFutureClip, stopStartedClip])
  })

  it("skips audio clips when their sample buffer is missing", async () => {
    const scheduleAudioBuffer = vi.fn()

    const stops = await scheduleAudioClipTracksWithDependencies(
      {
        ensureAudioReady: vi.fn().mockResolvedValue(undefined),
        getAudioCurrentTime: () => 0,
        loadSampleAudioBuffer: vi.fn().mockResolvedValue(null),
        nowMs: () => 1_000,
        scheduleAudioBuffer,
      },
      [
        {
          clips: [{ id: "missing-clip", startTime: 0 }],
          dbId: "missing-audio",
          duration: 1,
          id: "audio-track",
          kind: "audio-clip",
          muted: false,
          name: "Missing audio",
        },
      ],
      1_000,
    )

    expect(stops).toEqual([])
    expect(scheduleAudioBuffer).not.toHaveBeenCalled()
  })
})
