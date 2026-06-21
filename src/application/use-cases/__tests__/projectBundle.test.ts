import { unzipSync } from "fflate"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  exportProjectBundle,
  exportProjectBundleWithDependencies,
} from "../exportProjectBundle"
import {
  importProjectBundle,
  importProjectBundleWithDependencies,
} from "../importProjectBundle"
import {
  addAudioClipTrack,
  createDefaultProject,
  type MusicalProject,
} from "../../../engine/project/projectModel"
import type { SampleSlotMeta } from "../../ports/SampleSlotRepository"

const sampleStorageMock = vi.hoisted(() => ({
  deleteSampleBuffer: vi.fn(),
  loadSampleBuffer: vi.fn(),
  saveSampleBuffer: vi.fn(),
}))

const sampleModelMock = vi.hoisted(() => ({
  loadSlotMetas: vi.fn(),
  saveSlotMetas: vi.fn(),
}))

vi.mock("../../../engine/audio/sampleStorage", () => sampleStorageMock)
vi.mock("../../../engine/audio/sampleModel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../engine/audio/sampleModel")>()),
  loadSlotMetas: sampleModelMock.loadSlotMetas,
  saveSlotMetas: sampleModelMock.saveSlotMetas,
}))

function encodeBuffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer
}

async function unzipBlob(blob: Blob): Promise<Record<string, Uint8Array>> {
  return unzipSync(new Uint8Array(await blob.arrayBuffer()))
}

function decodeEntry(entries: Record<string, Uint8Array>, path: string): string {
  const entry = entries[path]

  if (!entry) {
    throw new Error(`Missing bundle entry: ${path}`)
  }

  return new TextDecoder().decode(entry)
}

function createSlot(index: number, dbId: string, name: string): SampleSlotMeta {
  return {
    calibration: {
      fadeIn: 0,
      fadeOut: 0,
      gain: 1,
      trimEnd: 1,
      trimStart: 0,
      tune: 0,
    },
    channels: 1,
    dbId,
    duration: 1,
    index,
    name,
    sampleRate: 44100,
  }
}

describe("project bundle use-cases", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sampleModelMock.loadSlotMetas.mockReturnValue([])
    sampleStorageMock.loadSampleBuffer.mockResolvedValue(null)
    sampleStorageMock.saveSampleBuffer.mockResolvedValue(undefined)
  })

  it("exports project.json and slots.json", async () => {
    const project = createDefaultProject()
    sampleModelMock.loadSlotMetas.mockReturnValue([
      createSlot(0, "slot-kick", "Kick"),
      null,
    ])

    const blob = await exportProjectBundle(project)
    const entries = await unzipBlob(blob)
    const exportedProject = JSON.parse(decodeEntry(entries, "project.json")) as MusicalProject
    const exportedSlots = JSON.parse(decodeEntry(entries, "slots.json")) as SampleSlotMeta[]

    expect(exportedProject.id).toBe(project.id)
    expect(exportedProject.timeline).toHaveLength(project.timeline.length)
    expect(exportedSlots).toHaveLength(1)
    expect(exportedSlots[0].dbId).toBe("slot-kick")
  })

  it("exports sampler slot buffers and AudioClipTrack buffers once", async () => {
    const project = addAudioClipTrack(createDefaultProject(), {
      dbId: "audio-render",
      duration: 2,
      name: "Rendered audio",
    })
    sampleModelMock.loadSlotMetas.mockReturnValue([
      createSlot(0, "slot-kick", "Kick"),
      createSlot(1, "audio-render", "Same audio already in slot"),
    ])
    sampleStorageMock.loadSampleBuffer.mockImplementation((dbId: string) => {
      if (dbId === "slot-kick") return Promise.resolve(encodeBuffer("kick-data"))
      if (dbId === "audio-render") return Promise.resolve(encodeBuffer("audio-data"))
      return Promise.resolve(null)
    })

    const blob = await exportProjectBundle(project)
    const entries = await unzipBlob(blob)

    expect(decodeEntry(entries, "samples/slot-kick")).toBe("kick-data")
    expect(decodeEntry(entries, "samples/audio-render")).toBe("audio-data")
    expect(Object.keys(entries).filter((path) => path === "samples/audio-render")).toHaveLength(1)
    expect(sampleStorageMock.loadSampleBuffer).toHaveBeenCalledWith("slot-kick")
    expect(sampleStorageMock.loadSampleBuffer).toHaveBeenCalledWith("audio-render")
    expect(sampleStorageMock.loadSampleBuffer).toHaveBeenCalledTimes(2)
  })

  it("exports project bundles through injected repositories", async () => {
    const project = addAudioClipTrack(createDefaultProject(), {
      dbId: "audio-render",
      duration: 2,
      name: "Rendered audio",
    })
    const samples = {
      delete: vi.fn(),
      load: vi.fn((dbId: string) => {
        if (dbId === "slot-kick") return Promise.resolve(encodeBuffer("kick-data"))
        if (dbId === "audio-render") return Promise.resolve(encodeBuffer("audio-data"))
        return Promise.resolve(null)
      }),
      save: vi.fn(),
    }

    const blob = await exportProjectBundleWithDependencies(
      {
        sampleSlots: {
          loadSlots: () => [
            createSlot(0, "slot-kick", "Kick"),
            createSlot(1, "audio-render", "Same audio already in slot"),
          ],
        },
        samples,
      },
      project,
    )
    const entries = await unzipBlob(blob)

    expect(decodeEntry(entries, "samples/slot-kick")).toBe("kick-data")
    expect(decodeEntry(entries, "samples/audio-render")).toBe("audio-data")
    expect(Object.keys(entries).filter((path) => path === "samples/audio-render")).toHaveLength(1)
    expect(samples.load).toHaveBeenCalledWith("slot-kick")
    expect(samples.load).toHaveBeenCalledWith("audio-render")
    expect(samples.load).toHaveBeenCalledTimes(2)
  })

  it("imports project, slots, and sample buffers from a bundle", async () => {
    const project = addAudioClipTrack(createDefaultProject(), {
      dbId: "audio-render",
      duration: 2,
      name: "Rendered audio",
    })
    sampleModelMock.loadSlotMetas.mockReturnValue([
      createSlot(0, "slot-kick", "Kick"),
    ])
    sampleStorageMock.loadSampleBuffer.mockImplementation((dbId: string) => {
      if (dbId === "slot-kick") return Promise.resolve(encodeBuffer("kick-data"))
      if (dbId === "audio-render") return Promise.resolve(encodeBuffer("audio-data"))
      return Promise.resolve(null)
    })

    const exported = await exportProjectBundle(project)
    const file = new File([exported], "project.mimidi", { type: "application/zip" })
    const imported = await importProjectBundle(file)

    expect(imported.id).toBe(project.id)
    expect(sampleModelMock.saveSlotMetas).toHaveBeenCalledWith([
      expect.objectContaining({ dbId: "slot-kick" }),
    ])
    expect(sampleStorageMock.saveSampleBuffer).toHaveBeenCalledTimes(2)
    expect(sampleStorageMock.saveSampleBuffer).toHaveBeenCalledWith(
      "slot-kick",
      expect.any(ArrayBuffer),
    )
    expect(sampleStorageMock.saveSampleBuffer).toHaveBeenCalledWith(
      "audio-render",
      expect.any(ArrayBuffer),
    )
  })

  it("imports project bundles through injected repositories", async () => {
    const project = addAudioClipTrack(createDefaultProject(), {
      dbId: "audio-render",
      duration: 2,
      name: "Rendered audio",
    })
    sampleModelMock.loadSlotMetas.mockReturnValue([
      createSlot(0, "slot-kick", "Kick"),
    ])
    sampleStorageMock.loadSampleBuffer.mockImplementation((dbId: string) => {
      if (dbId === "slot-kick") return Promise.resolve(encodeBuffer("kick-data"))
      if (dbId === "audio-render") return Promise.resolve(encodeBuffer("audio-data"))
      return Promise.resolve(null)
    })
    const exported = await exportProjectBundle(project)
    const file = new File([exported], "project.mimidi", { type: "application/zip" })
    const sampleSlots = { loadSlots: vi.fn(), saveSlots: vi.fn() }
    const samples = {
      delete: vi.fn(),
      load: vi.fn(),
      save: vi.fn(),
    }
    const parseProject = vi.fn((json: string) => JSON.parse(json) as MusicalProject)

    const imported = await importProjectBundleWithDependencies(
      { parseProject, sampleSlots, samples },
      file,
    )

    expect(imported.id).toBe(project.id)
    expect(parseProject).toHaveBeenCalled()
    expect(sampleSlots.saveSlots).toHaveBeenCalledWith([
      expect.objectContaining({ dbId: "slot-kick" }),
    ])
    expect(samples.save).toHaveBeenCalledTimes(2)
    expect(samples.save).toHaveBeenCalledWith("slot-kick", expect.any(ArrayBuffer))
    expect(samples.save).toHaveBeenCalledWith("audio-render", expect.any(ArrayBuffer))
  })

  it("rejects bundles without project.json", async () => {
    const brokenBundle = new File(
      [new Blob([new Uint8Array([80, 75, 5, 6, ...Array(18).fill(0)])])],
      "broken.mimidi",
      { type: "application/zip" },
    )

    await expect(importProjectBundle(brokenBundle)).rejects.toThrow(/project\.json/)
  })
})
