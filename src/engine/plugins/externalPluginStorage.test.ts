import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  saveExternalPlugin,
  loadExternalPlugin,
  deleteExternalPlugin,
  listExternalPluginIds,
} from "./externalPluginStorage"

// ─── Mock de IndexedDB ────────────────────────────────────────────────────────
// jsdom no implementa IDB — usamos un store en memoria para simular la API.

type IDBStore = Map<string, ArrayBuffer>

function makeIdbMock(store: IDBStore) {
  function makeRequest<T>(getValue: () => T) {
    const req: Record<string, unknown> = {}
    setTimeout(() => {
      req.result = getValue()
      if (typeof req.onsuccess === "function") (req.onsuccess as () => void)()
    }, 0)
    return req
  }

  function makeTx(mode: string) {
    const tx: Record<string, unknown> = {
      objectStore: vi.fn(() => ({
        put: (value: ArrayBuffer, key: string) => {
          if (mode === "readwrite") store.set(key, value)
          return makeRequest(() => undefined)
        },
        get: (key: string) => makeRequest(() => store.get(key) ?? undefined),
        delete: (key: string) => {
          if (mode === "readwrite") store.delete(key)
          return makeRequest(() => undefined)
        },
        getAllKeys: () => makeRequest(() => [...store.keys()]),
      })),
    }
    setTimeout(() => {
      if (typeof tx.oncomplete === "function") (tx.oncomplete as () => void)()
    }, 0)
    return tx
  }

  const db = { transaction: vi.fn((_store: string, mode: string) => makeTx(mode)) }

  return {
    open: vi.fn(() => {
      const req: Record<string, unknown> = {}
      setTimeout(() => {
        req.result = db
        if (typeof req.onsuccess === "function") (req.onsuccess as () => void)()
      }, 0)
      req.onupgradeneeded = null
      return req
    }),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("externalPluginStorage", () => {
  let store: IDBStore

  beforeEach(() => {
    store = new Map()
    vi.stubGlobal("indexedDB", makeIdbMock(store))
  })

  it("saves and loads a plugin buffer", async () => {
    const data = new TextEncoder().encode("fake plugin data").buffer
    await saveExternalPlugin("my-plugin", data)
    const loaded = await loadExternalPlugin("my-plugin")
    expect(loaded).not.toBeNull()
    expect(new TextDecoder().decode(loaded!)).toBe("fake plugin data")
  })

  it("returns null when loading a non-existent plugin", async () => {
    const result = await loadExternalPlugin("does-not-exist")
    expect(result).toBeNull()
  })

  it("lists saved plugin ids", async () => {
    const buf = new ArrayBuffer(4)
    await saveExternalPlugin("plugin-a", buf)
    await saveExternalPlugin("plugin-b", buf)
    const ids = await listExternalPluginIds()
    expect(ids).toContain("plugin-a")
    expect(ids).toContain("plugin-b")
    expect(ids).toHaveLength(2)
  })

  it("deletes a plugin and it no longer appears in list", async () => {
    const buf = new ArrayBuffer(4)
    await saveExternalPlugin("plugin-to-delete", buf)
    await deleteExternalPlugin("plugin-to-delete")
    const ids = await listExternalPluginIds()
    expect(ids).not.toContain("plugin-to-delete")
  })

  it("returns empty list when no plugins are saved", async () => {
    const ids = await listExternalPluginIds()
    expect(ids).toHaveLength(0)
  })
})
