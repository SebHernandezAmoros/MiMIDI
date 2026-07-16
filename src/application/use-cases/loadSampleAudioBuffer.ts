import type { SampleRepository } from "../ports/SampleRepository"
import { createLegacySampleDecodeUseCaseDependencies } from "./legacySampleDecodeUseCaseDependencies"

export type LoadSampleAudioBufferDependencies = {
  samples: Pick<SampleRepository, "load">
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
}

export async function loadSampleAudioBufferWithDependencies(
  dependencies: LoadSampleAudioBufferDependencies,
  dbId: string,
): Promise<AudioBuffer | null> {
  const arrayBuffer = await dependencies.samples.load(dbId)

  if (!arrayBuffer) {
    return null
  }

  return dependencies.decodeAudioData(arrayBuffer)
}

export async function loadSampleAudioBuffer(dbId: string): Promise<AudioBuffer | null> {
  return loadSampleAudioBufferWithDependencies(
    createLegacySampleDecodeUseCaseDependencies(),
    dbId,
  )
}
