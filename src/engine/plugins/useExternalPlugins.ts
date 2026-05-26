import { useEffect, useRef, useState } from "react"
import {
  saveExternalPlugin,
  loadExternalPlugin,
  deleteExternalPlugin,
  listExternalPluginIds,
} from "./externalPluginStorage"
import { loadPluginFromMimod, type ExternalPluginManifest } from "./pluginLoader"
import {
  registerExternalPlugin,
  unregisterExternalPlugin,
} from "./pluginRegistry"

export type ExternalPluginEntry = {
  id: string
  manifest: ExternalPluginManifest
}

export function useExternalPlugins() {
  const [isRestoring, setIsRestoring] = useState(true)
  const [entries, setEntries] = useState<ExternalPluginEntry[]>([])
  const entriesRef = useRef<ExternalPluginEntry[]>([])

  // Restaura todos los plugins guardados al montar (sobrevive F5)
  useEffect(() => {
    void (async () => {
      const ids = await listExternalPluginIds()
      const restored: ExternalPluginEntry[] = []
      for (const id of ids) {
        const data = await loadExternalPlugin(id)
        if (!data) continue
        try {
          const { manifest, definition } = await loadPluginFromMimod(data)
          registerExternalPlugin(definition)
          restored.push({ id, manifest })
        } catch (err) {
          console.warn(`[useExternalPlugins] No se pudo restaurar plugin "${id}":`, err)
        }
      }
      entriesRef.current = restored
      setEntries(restored)
      setIsRestoring(false)
    })()
  }, [])

  async function installFromFile(
    file: File,
  ): Promise<ExternalPluginManifest> {
    const data = await file.arrayBuffer()
    const { manifest, definition } = await loadPluginFromMimod(data)

    // Reemplaza si ya existía con el mismo id
    await saveExternalPlugin(manifest.id, data)
    registerExternalPlugin(definition)

    const entry: ExternalPluginEntry = { id: manifest.id, manifest }
    const next = [
      ...entriesRef.current.filter((e) => e.id !== manifest.id),
      entry,
    ]
    entriesRef.current = next
    setEntries(next)

    return manifest
  }

  async function uninstall(id: string): Promise<void> {
    await deleteExternalPlugin(id)
    unregisterExternalPlugin(id)
    const next = entriesRef.current.filter((e) => e.id !== id)
    entriesRef.current = next
    setEntries(next)
  }

  return { isRestoring, entries, installFromFile, uninstall }
}
