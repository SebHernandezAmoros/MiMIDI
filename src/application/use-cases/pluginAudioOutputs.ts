import type { SampleRepository } from "../ports/SampleRepository"
import {
  DEFAULT_SAMPLE_CALIBRATION,
  type SampleSlotRepository,
} from "../ports/SampleSlotRepository"
import { createLegacyPluginAudioOutputUseCaseDependencies } from "./legacyPluginAudioOutputUseCaseDependencies"
import { createLegacyPluginClipLoadUseCaseDependencies } from "./legacyPluginClipLoadUseCaseDependencies"
import { createLegacyPluginClipStoreUseCaseDependencies } from "./legacyPluginClipStoreUseCaseDependencies"

type SaveFileType = {
  description: string
  accept: Record<string, string[]>
}

export type PluginAudioOutputInput = {
  type: "audio"
  name: string
  blob: Blob
  duration: number
  destination: "sampler" | "project"
  dbId?: string
}

export type PluginAudioOutputResult =
  | {
      type: "project-track"
      dbId: string
      duration: number
      name: string
    }
  | {
      type: "sampler-slot"
    }
  | {
      type: "download"
      blob: Blob
      fileName: string
      types: SaveFileType[]
    }

export type PluginAudioOutputDependencies = {
  createAudioId(): string
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
  sampleSlots: SampleSlotRepository
  samples: Pick<SampleRepository, "save">
}

export function createPluginAudioDbId(): string {
  return `plugin-audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createPluginClipDbId(): string {
  return `plugin-clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export async function storePluginClipWithDependencies(
  dependencies: {
    createClipId(): string
    samples: Pick<SampleRepository, "save">
  },
  blob: Blob,
): Promise<string> {
  const dbId = dependencies.createClipId()
  const data = await blob.arrayBuffer()
  await dependencies.samples.save(dbId, data)
  return dbId
}

export async function loadPluginClipWithDependencies(
  dependencies: {
    samples: Pick<SampleRepository, "load">
  },
  dbId: string,
): Promise<Blob | null> {
  const data = await dependencies.samples.load(dbId)
  return data ? new Blob([data], { type: "audio/webm" }) : null
}

export async function processPluginAudioOutputWithDependencies(
  dependencies: PluginAudioOutputDependencies,
  output: PluginAudioOutputInput,
): Promise<PluginAudioOutputResult | null> {
  const dbId = output.dbId ?? dependencies.createAudioId()

  if (output.destination === "project") {
    if (!output.dbId) {
      await dependencies.samples.save(dbId, await output.blob.arrayBuffer())
    }
    return {
      dbId,
      duration: output.duration,
      name: output.name,
      type: "project-track",
    }
  }

  const data = await output.blob.arrayBuffer()
  if (!output.dbId) await dependencies.samples.save(dbId, data)

  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await dependencies.decodeAudioData(data)
  } catch {
    return null
  }

  const slots = dependencies.sampleSlots.loadSlots()
  const emptyIndex = slots.findIndex((slot) => slot === null)
  if (emptyIndex === -1) {
    return {
      blob: new Blob([data], { type: "audio/webm" }),
      fileName: `${output.name}.webm`,
      type: "download",
      types: [
        { description: "Audio WebM", accept: { "audio/webm": [".webm"] } },
      ],
    }
  }

  const nextSlots = [...slots]
  nextSlots[emptyIndex] = {
    calibration: { ...DEFAULT_SAMPLE_CALIBRATION },
    channels: audioBuffer.numberOfChannels,
    dbId,
    duration: audioBuffer.duration,
    index: emptyIndex + 1,
    name: output.name,
    sampleRate: audioBuffer.sampleRate,
  }
  dependencies.sampleSlots.saveSlots(nextSlots)
  return { type: "sampler-slot" }
}

export async function storePluginClip(blob: Blob): Promise<string> {
  const dependencies = createLegacyPluginClipStoreUseCaseDependencies()
  return storePluginClipWithDependencies(
    {
      createClipId: createPluginClipDbId,
      samples: dependencies.samples,
    },
    blob,
  )
}

export async function loadPluginClip(dbId: string): Promise<Blob | null> {
  const dependencies = createLegacyPluginClipLoadUseCaseDependencies()
  return loadPluginClipWithDependencies(
    {
      samples: dependencies.samples,
    },
    dbId,
  )
}

export async function processPluginAudioOutput(
  output: PluginAudioOutputInput,
): Promise<PluginAudioOutputResult | null> {
  const dependencies = createLegacyPluginAudioOutputUseCaseDependencies()
  return processPluginAudioOutputWithDependencies(
    {
      createAudioId: createPluginAudioDbId,
      decodeAudioData: dependencies.decodeAudioData,
      sampleSlots: dependencies.sampleSlots,
      samples: dependencies.samples,
    },
    output,
  )
}
