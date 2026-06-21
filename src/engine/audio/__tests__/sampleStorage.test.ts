import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  deleteSampleBuffer,
  loadSampleBuffer,
  saveSampleBuffer,
} from "../sampleStorage"

type IDBStore = Map<string, ArrayBuffer>

function makeRequest<T>(getValue: () => T) {
  const request: Record<string, unknown> = {}

  setTimeout(() => {
    request.result = getValue()

    if (typeof request.onsuccess === "function") {
      ;(request.onsuccess as () => void)()
    }
  }, 0)

  return request
}

function makeIdbMock(store: IDBStore) {
  function makeTransaction(mode: string) {
    const transaction: Record<string, unknown> = {
      objectStore: vi.fn(() => ({
        delete: (key: string) => {
          if (mode === "readwrite") {
            store.delete(key)
          }

          return makeRequest(() => undefined)
        },
        get: (key: string) => makeRequest(() => store.get(key) ?? undefined),
        put: (value: ArrayBuffer, key: string) => {
          if (mode === "readwrite") {
            store.set(key, value)
          }

          return makeRequest(() => undefined)
        },
      })),
    }

    setTimeout(() => {
      if (typeof transaction.oncomplete === "function") {
        ;(transaction.oncomplete as () => void)()
      }
    }, 0)

    return transaction
  }

  const db = {
    createObjectStore: vi.fn(),
    transaction: vi.fn((_store: string, mode: string) => makeTransaction(mode)),
  }

  return {
    open: vi.fn(() => {
      const request: Record<string, unknown> = {}

      setTimeout(() => {
        request.result = db

        if (typeof request.onupgradeneeded === "function") {
          ;(request.onupgradeneeded as () => void)()
        }

        if (typeof request.onsuccess === "function") {
          ;(request.onsuccess as () => void)()
        }
      }, 0)

      return request
    }),
  }
}

function decodeBuffer(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

describe("sampleStorage", () => {
  let store: IDBStore

  beforeEach(() => {
    store = new Map()
    vi.stubGlobal("indexedDB", makeIdbMock(store))
  })

  it("saves and loads a sample buffer", async () => {
    const buffer = new TextEncoder().encode("sample-data").buffer

    await saveSampleBuffer("sample-1", buffer)

    const loaded = await loadSampleBuffer("sample-1")

    expect(loaded).not.toBeNull()
    expect(decodeBuffer(loaded!)).toBe("sample-data")
  })

  it("returns null when a sample buffer does not exist", async () => {
    await expect(loadSampleBuffer("missing-sample")).resolves.toBeNull()
  })

  it("deletes a saved sample buffer", async () => {
    const buffer = new TextEncoder().encode("delete-me").buffer

    await saveSampleBuffer("sample-to-delete", buffer)
    await deleteSampleBuffer("sample-to-delete")

    await expect(loadSampleBuffer("sample-to-delete")).resolves.toBeNull()
  })
})
