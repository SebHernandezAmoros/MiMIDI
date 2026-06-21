import type { SampleRepository } from "../../application/ports/SampleRepository"

export const SAMPLE_DB_NAME = "mimidi-samples"
export const SAMPLE_STORE_NAME = "buffers"
export const SAMPLE_DB_VERSION = 1

function openSampleDb(indexedDb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(SAMPLE_DB_NAME, SAMPLE_DB_VERSION)

    request.onupgradeneeded = () => {
      request.result.createObjectStore(SAMPLE_STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIndexedDbSampleRepository(
  indexedDb: IDBFactory,
): SampleRepository {
  return {
    async delete(dbId) {
      const db = await openSampleDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(SAMPLE_STORE_NAME, "readwrite")

        transaction.objectStore(SAMPLE_STORE_NAME).delete(dbId)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    },
    async load(dbId) {
      const db = await openSampleDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(SAMPLE_STORE_NAME, "readonly")
        const request = transaction.objectStore(SAMPLE_STORE_NAME).get(dbId)

        request.onsuccess = () =>
          resolve((request.result as ArrayBuffer | undefined) ?? null)
        request.onerror = () => reject(request.error)
      })
    },
    async save(dbId, data) {
      const db = await openSampleDb(indexedDb)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(SAMPLE_STORE_NAME, "readwrite")

        transaction.objectStore(SAMPLE_STORE_NAME).put(data, dbId)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    },
  }
}
