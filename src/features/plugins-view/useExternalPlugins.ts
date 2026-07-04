import { useEffect, useRef, useState } from "react"
import {
  installExternalPluginFromDevelopmentFolderWithDependencies,
  installExternalPluginFromDataWithDependencies,
  restoreExternalPluginsWithDependencies,
} from "../../application/use-cases/externalPluginInstallation"
import type { ExternalPluginManifest } from "../../domain/plugins/pluginManifest"
import {
  createLegacyExternalPluginManagerDependencies,
  type ExternalPluginManagerDependencies,
} from "./externalPluginManagerDependencies"

export type ExternalPluginEntry = {
  id: string
  manifest: ExternalPluginManifest
  isDev?: boolean
}

const legacyExternalPluginManagerDependencies =
  createLegacyExternalPluginManagerDependencies()

export function useExternalPluginsWithDependencies(
  dependencies: ExternalPluginManagerDependencies,
) {
  const [isRestoring, setIsRestoring] = useState(true)
  const [entries, setEntries] = useState<ExternalPluginEntry[]>([])
  const entriesRef = useRef<ExternalPluginEntry[]>([])
  const externalPlugins = dependencies.externalPlugins

  useEffect(() => {
    void (async () => {
      const restored = await restoreExternalPluginsWithDependencies({
        listPluginIds: externalPlugins.listIds,
        loadStoredPlugin: externalPlugins.load,
        loadPlugin: dependencies.loadPlugin,
        registerPlugin: dependencies.registerPlugin,
        onRestoreError: dependencies.onRestoreError,
      })
      entriesRef.current = restored
      setEntries(restored)
      setIsRestoring(false)
    })()
  }, [])

  async function installFromFile(
    file: File,
  ): Promise<ExternalPluginManifest> {
    const data = await file.arrayBuffer()
    const manifest = await installExternalPluginFromDataWithDependencies(data, {
      loadPlugin: dependencies.loadPlugin,
      savePlugin: externalPlugins.save,
      registerPlugin: dependencies.registerPlugin,
    })

    const entry: ExternalPluginEntry = { id: manifest.id, manifest }
    const next = [
      ...entriesRef.current.filter((item) => item.id !== manifest.id),
      entry,
    ]
    entriesRef.current = next
    setEntries(next)

    return manifest
  }

  async function installFromFolder(): Promise<ExternalPluginManifest> {
    const directory = await dependencies.pickDevelopmentDirectory()
    const manifest =
      await installExternalPluginFromDevelopmentFolderWithDependencies({
        readTextFile: directory.readTextFile,
        prepareRuntime: dependencies.prepareRuntime,
        loadDefinition: dependencies.loadDefinition,
        registerPlugin: dependencies.registerPlugin,
      })

    const entry: ExternalPluginEntry = { id: manifest.id, manifest, isDev: true }
    const next = [
      ...entriesRef.current.filter((item) => item.id !== manifest.id),
      entry,
    ]
    entriesRef.current = next
    setEntries(next)
    return manifest
  }

  async function uninstall(id: string): Promise<void> {
    const entry = entriesRef.current.find((item) => item.id === id)
    if (!entry?.isDev) {
      await externalPlugins.delete(id)
    }
    dependencies.unregisterPlugin(id)
    const next = entriesRef.current.filter((item) => item.id !== id)
    entriesRef.current = next
    setEntries(next)
  }

  return { isRestoring, entries, installFromFile, installFromFolder, uninstall }
}

export function useExternalPlugins() {
  return useExternalPluginsWithDependencies(
    legacyExternalPluginManagerDependencies,
  )
}

export type { ExternalPluginManagerDependencies }
