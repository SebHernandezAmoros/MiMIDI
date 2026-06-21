import type { SampleRepository } from "../ports/SampleRepository"
import { createLegacySampleUseCaseDependencies } from "./legacySampleUseCaseDependencies"
export { createSampleDbId } from "./sampleIds"

export type ImportedSampleData = {
  audioBuffer: AudioBuffer
  dbId: string
  name: string
  duration: number
  sampleRate: number
  channels: number
}

export type ImportSampleFileDependencies = {
  samples: Pick<SampleRepository, "save">
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
  createSampleId(): string
}

export async function importSampleFileWithDependencies(
  dependencies: ImportSampleFileDependencies,
  file: File,
): Promise<ImportedSampleData> {
  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await dependencies.decodeAudioData(arrayBuffer)
  const dbId = dependencies.createSampleId()

  await dependencies.samples.save(dbId, arrayBuffer)

  return {
    audioBuffer,
    dbId,
    name: file.name.replace(/\.[^.]+$/, ""),
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  }
}

export async function importSampleFile(file: File): Promise<ImportedSampleData> {
  return importSampleFileWithDependencies(
    createLegacySampleUseCaseDependencies(),
    file,
  )
}
