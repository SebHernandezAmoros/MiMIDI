import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ExternalPluginManifest } from "../../domain/plugins/pluginManifest"
import type { MiMIDIPluginDefinition } from "../../plugin-host/pluginHostModel"
import {
  useExternalPluginsWithDependencies,
  type ExternalPluginManagerDependencies,
} from "./useExternalPlugins"

const manifest: ExternalPluginManifest = {
  id: "test-plugin",
  name: "Test Plugin",
  version: "1.0.0",
  description: "Test plugin",
  author: "MiMIDI",
  entryPoint: "index.js",
}

const definition: MiMIDIPluginDefinition = {
  id: manifest.id,
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  enabledByDefault: true,
}

function createDependencies(): ExternalPluginManagerDependencies {
  return {
    externalPlugins: {
      delete: vi.fn().mockResolvedValue(undefined),
      listIds: vi.fn().mockResolvedValue([]),
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    },
    loadPlugin: vi.fn().mockResolvedValue({ manifest, definition }),
    loadDefinition: vi.fn().mockResolvedValue(definition),
    registerPlugin: vi.fn(),
    unregisterPlugin: vi.fn(),
    prepareRuntime: vi.fn(),
    pickDevelopmentDirectory: vi.fn().mockResolvedValue({
      readTextFile: vi.fn(async (fileName: string) =>
        fileName === "manifest.json"
          ? JSON.stringify(manifest)
          : "export default {}",
      ),
    }),
    onRestoreError: vi.fn(),
  }
}

describe("useExternalPluginsWithDependencies", () => {
  it("restores persisted plugins on mount", async () => {
    const dependencies = createDependencies()
    vi.mocked(dependencies.externalPlugins.listIds).mockResolvedValue([
      manifest.id,
    ])
    vi.mocked(dependencies.externalPlugins.load).mockResolvedValue(
      new ArrayBuffer(4),
    )

    const { result } = renderHook(() =>
      useExternalPluginsWithDependencies(dependencies),
    )

    await waitFor(() => expect(result.current.isRestoring).toBe(false))

    expect(result.current.entries).toEqual([{ id: manifest.id, manifest }])
    expect(dependencies.loadPlugin).toHaveBeenCalledOnce()
    expect(dependencies.registerPlugin).toHaveBeenCalledWith(definition)
  })

  it("installs and uninstalls a persisted plugin", async () => {
    const dependencies = createDependencies()
    const data = new ArrayBuffer(8)
    const file = {
      arrayBuffer: vi.fn().mockResolvedValue(data),
    } as unknown as File
    const { result } = renderHook(() =>
      useExternalPluginsWithDependencies(dependencies),
    )
    await waitFor(() => expect(result.current.isRestoring).toBe(false))

    await act(async () => {
      await result.current.installFromFile(file)
    })

    expect(dependencies.externalPlugins.save).toHaveBeenCalledWith(
      manifest.id,
      data,
    )
    expect(result.current.entries).toEqual([{ id: manifest.id, manifest }])

    await act(async () => {
      await result.current.uninstall(manifest.id)
    })

    expect(dependencies.externalPlugins.delete).toHaveBeenCalledWith(manifest.id)
    expect(dependencies.unregisterPlugin).toHaveBeenCalledWith(manifest.id)
    expect(result.current.entries).toEqual([])
  })

  it("installs a development plugin without deleting persisted storage", async () => {
    const dependencies = createDependencies()
    const { result } = renderHook(() =>
      useExternalPluginsWithDependencies(dependencies),
    )
    await waitFor(() => expect(result.current.isRestoring).toBe(false))

    await act(async () => {
      await result.current.installFromFolder()
    })

    expect(dependencies.pickDevelopmentDirectory).toHaveBeenCalledOnce()
    expect(dependencies.prepareRuntime).toHaveBeenCalledOnce()
    expect(result.current.entries).toEqual([
      { id: manifest.id, manifest, isDev: true },
    ])

    await act(async () => {
      await result.current.uninstall(manifest.id)
    })

    expect(dependencies.externalPlugins.delete).not.toHaveBeenCalled()
    expect(dependencies.unregisterPlugin).toHaveBeenCalledWith(manifest.id)
    expect(result.current.entries).toEqual([])
  })
})
