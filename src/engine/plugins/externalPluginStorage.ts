import { createIndexedDbExternalPluginRepository } from "../../infrastructure/storage/indexedDbExternalPluginRepository"

function createRepository() {
  return createIndexedDbExternalPluginRepository(indexedDB)
}

export async function saveExternalPlugin(
  id: string,
  data: ArrayBuffer,
): Promise<void> {
  return createRepository().save(id, data)
}

export async function loadExternalPlugin(
  id: string,
): Promise<ArrayBuffer | null> {
  return createRepository().load(id)
}

export async function deleteExternalPlugin(id: string): Promise<void> {
  return createRepository().delete(id)
}

export async function listExternalPluginIds(): Promise<string[]> {
  return createRepository().listIds()
}
