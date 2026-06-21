import { createIndexedDbSampleRepository } from "../../infrastructure/storage/indexedDbSampleRepository"

export async function saveSampleBuffer(id: string, buffer: ArrayBuffer): Promise<void> {
  return createIndexedDbSampleRepository(indexedDB).save(id, buffer)
}

export async function loadSampleBuffer(id: string): Promise<ArrayBuffer | null> {
  return createIndexedDbSampleRepository(indexedDB).load(id)
}

export async function deleteSampleBuffer(id: string): Promise<void> {
  return createIndexedDbSampleRepository(indexedDB).delete(id)
}
