import { describe, expect, it, vi } from "vitest"
import type { ExternalPluginManifest } from "../../../domain/plugins/pluginManifest"
import {
  installExternalPluginFromDevelopmentFolderWithDependencies,
  installExternalPluginFromDataWithDependencies,
  restoreExternalPluginsWithDependencies,
} from "../externalPluginInstallation"

type TestPluginDefinition = {
  id: string
  name: string
}

function createManifest(id = "external-plugin"): ExternalPluginManifest {
  return {
    id,
    name: "External Plugin",
    version: "1.0.0",
    description: "A plugin loaded from a .mimod file",
    author: "MiMIDI",
    entryPoint: "dist/plugin.js",
  }
}

describe("externalPluginInstallation", () => {
  it("loads, stores and registers an external plugin from .mimod data", async () => {
    const data = new ArrayBuffer(4)
    const manifest = createManifest()
    const definition: TestPluginDefinition = {
      id: manifest.id,
      name: manifest.name,
    }
    const loadPlugin = vi.fn(async () => ({ manifest, definition }))
    const savePlugin = vi.fn(async () => undefined)
    const registerPlugin = vi.fn()

    const installed = await installExternalPluginFromDataWithDependencies(data, {
      loadPlugin,
      savePlugin,
      registerPlugin,
    })

    expect(installed).toEqual(manifest)
    expect(loadPlugin).toHaveBeenCalledWith(data)
    expect(savePlugin).toHaveBeenCalledWith(manifest.id, data)
    expect(registerPlugin).toHaveBeenCalledWith(definition)
  })

  it("does not store or register when loading the plugin fails", async () => {
    const data = new ArrayBuffer(4)
    const loadPlugin = vi.fn(async () => {
      throw new Error("invalid plugin")
    })
    const savePlugin = vi.fn(async () => undefined)
    const registerPlugin = vi.fn()

    await expect(
      installExternalPluginFromDataWithDependencies(data, {
        loadPlugin,
        savePlugin,
        registerPlugin,
      }),
    ).rejects.toThrow("invalid plugin")

    expect(savePlugin).not.toHaveBeenCalled()
    expect(registerPlugin).not.toHaveBeenCalled()
  })

  it("restores stored external plugins and skips entries that fail to load", async () => {
    const firstData = new ArrayBuffer(4)
    const brokenData = new ArrayBuffer(8)
    const firstManifest = createManifest("first-plugin")
    const firstDefinition: TestPluginDefinition = {
      id: firstManifest.id,
      name: firstManifest.name,
    }
    const listPluginIds = vi.fn(async () => [
      firstManifest.id,
      "missing-plugin",
      "broken-plugin",
    ])
    const loadStoredPlugin = vi.fn(async (id: string) => {
      if (id === firstManifest.id) return firstData
      if (id === "broken-plugin") return brokenData
      return null
    })
    const loadPlugin = vi.fn(async (data: ArrayBuffer) => {
      if (data === brokenData) throw new Error("invalid plugin")
      return { manifest: firstManifest, definition: firstDefinition }
    })
    const registerPlugin = vi.fn()
    const onRestoreError = vi.fn()

    const restored = await restoreExternalPluginsWithDependencies({
      listPluginIds,
      loadStoredPlugin,
      loadPlugin,
      registerPlugin,
      onRestoreError,
    })

    expect(restored).toEqual([{ id: firstManifest.id, manifest: firstManifest }])
    expect(listPluginIds).toHaveBeenCalled()
    expect(loadStoredPlugin).toHaveBeenCalledWith(firstManifest.id)
    expect(loadStoredPlugin).toHaveBeenCalledWith("missing-plugin")
    expect(loadStoredPlugin).toHaveBeenCalledWith("broken-plugin")
    expect(registerPlugin).toHaveBeenCalledWith(firstDefinition)
    expect(onRestoreError).toHaveBeenCalledWith(
      "broken-plugin",
      expect.any(Error),
    )
  })

  it("installs an external plugin from development folder file readers", async () => {
    const manifest = createManifest("folder-plugin")
    const definition: TestPluginDefinition = {
      id: manifest.id,
      name: manifest.name,
    }
    const readTextFile = vi.fn(async (fileName: string) => {
      if (fileName === "manifest.json") return JSON.stringify(manifest)
      if (fileName === manifest.entryPoint) return "export default plugin"
      throw new Error("missing file")
    })
    const prepareRuntime = vi.fn()
    const loadDefinition = vi.fn(async () => definition)
    const registerPlugin = vi.fn()

    const installed =
      await installExternalPluginFromDevelopmentFolderWithDependencies({
        readTextFile,
        prepareRuntime,
        loadDefinition,
        registerPlugin,
      })

    expect(installed).toEqual(manifest)
    expect(readTextFile).toHaveBeenCalledWith("manifest.json")
    expect(readTextFile).toHaveBeenCalledWith(manifest.entryPoint)
    expect(prepareRuntime).toHaveBeenCalled()
    expect(loadDefinition).toHaveBeenCalledWith("export default plugin")
    expect(registerPlugin).toHaveBeenCalledWith(definition)
  })

  it("reports a focused error when the development folder entry point is missing", async () => {
    const manifest = createManifest("folder-plugin")
    const readTextFile = vi.fn(async (fileName: string) => {
      if (fileName === "manifest.json") return JSON.stringify(manifest)
      throw new Error("missing file")
    })
    const prepareRuntime = vi.fn()
    const loadDefinition = vi.fn(async () => ({
      id: manifest.id,
      name: manifest.name,
    }))
    const registerPlugin = vi.fn()

    await expect(
      installExternalPluginFromDevelopmentFolderWithDependencies({
        readTextFile,
        prepareRuntime,
        loadDefinition,
        registerPlugin,
      }),
    ).rejects.toThrow(
      `No se encontro ${manifest.entryPoint}. Compila primero: node scripts/build-plugin.mjs ${manifest.id}`,
    )

    expect(prepareRuntime).not.toHaveBeenCalled()
    expect(loadDefinition).not.toHaveBeenCalled()
    expect(registerPlugin).not.toHaveBeenCalled()
  })
})
