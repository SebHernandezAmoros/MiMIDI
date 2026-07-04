import type { ExternalPluginRepository } from "../../application/ports/ExternalPluginRepository"

export const EXTERNAL_PLUGIN_DB_NAME = "mimidi-plugins"
export const EXTERNAL_PLUGIN_STORE_NAME = "mimod-blobs"
export const EXTERNAL_PLUGIN_DB_VERSION = 1

function openExternalPluginDb(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(
      EXTERNAL_PLUGIN_DB_NAME,
      EXTERNAL_PLUGIN_DB_VERSION,
    )

    request.onupgradeneeded = () => {
      request.result.createObjectStore(EXTERNAL_PLUGIN_STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIndexedDbExternalPluginRepository(
  indexedDb: IDBFactory,
): ExternalPluginRepository {
  return {
    async delete(id) {
      const db = await openExternalPluginDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          EXTERNAL_PLUGIN_STORE_NAME,
          "readwrite",
        )

        transaction.objectStore(EXTERNAL_PLUGIN_STORE_NAME).delete(id)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    },
    async listIds() {
      const db = await openExternalPluginDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          EXTERNAL_PLUGIN_STORE_NAME,
          "readonly",
        )
        const request = transaction
          .objectStore(EXTERNAL_PLUGIN_STORE_NAME)
          .getAllKeys()

        request.onsuccess = () => resolve(request.result as string[])
        request.onerror = () => reject(request.error)
      })
    },
    async load(id) {
      const db = await openExternalPluginDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          EXTERNAL_PLUGIN_STORE_NAME,
          "readonly",
        )
        const request = transaction.objectStore(EXTERNAL_PLUGIN_STORE_NAME).get(id)

        request.onsuccess = () =>
          resolve((request.result as ArrayBuffer | undefined) ?? null)
        request.onerror = () => reject(request.error)
      })
    },
    async save(id, data) {
      const db = await openExternalPluginDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(
          EXTERNAL_PLUGIN_STORE_NAME,
          "readwrite",
        )

        transaction.objectStore(EXTERNAL_PLUGIN_STORE_NAME).put(data, id)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    },
  }
}
