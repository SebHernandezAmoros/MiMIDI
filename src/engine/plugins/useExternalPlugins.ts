import { useEffect, useRef, useState } from "react"
import {
  saveExternalPlugin,
  loadExternalPlugin,
  deleteExternalPlugin,
  listExternalPluginIds,
} from "./externalPluginStorage"
import { exposeRuntime, loadPluginFromMimod, type ExternalPluginManifest } from "./pluginLoader"
import {
  registerExternalPlugin,
  unregisterExternalPlugin,
} from "./pluginRegistry"
import type { MiMIDIPluginDefinition } from "./pluginModel"

export type ExternalPluginEntry = {
  id: string
  manifest: ExternalPluginManifest
  isDev?: boolean
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

  async function installFromFolder(): Promise<ExternalPluginManifest> {
    type DirHandle = { getFileHandle(name: string): Promise<{ getFile(): Promise<File> }> }
    const picker = (window as unknown as Record<string, unknown>).showDirectoryPicker as (() => Promise<DirHandle>) | undefined
    if (!picker) throw new Error("showDirectoryPicker no disponible en este navegador")

    const dir = await picker()

    const manifestFile = await dir.getFileHandle("manifest.json").then(h => h.getFile()).catch(() => {
      throw new Error("No se encontró manifest.json en el directorio")
    })
    const manifest = JSON.parse(await manifestFile.text()) as ExternalPluginManifest
    if (!manifest.id || !manifest.name || !manifest.entryPoint) {
      throw new Error("manifest.json inválido — faltan id, name o entryPoint")
    }

    const entryFile = await dir.getFileHandle(manifest.entryPoint).then(h => h.getFile()).catch(() => {
      throw new Error(`No se encontró ${manifest.entryPoint}. Compila primero: node scripts/build-plugin.mjs ${manifest.id}`)
    })
    const jsText = await entryFile.text()

    exposeRuntime()
    const blobUrl = URL.createObjectURL(new Blob([jsText], { type: "application/javascript" }))
    let definition: MiMIDIPluginDefinition
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mod = await import(/* @vite-ignore */ blobUrl)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      definition = (mod.default ?? mod) as MiMIDIPluginDefinition
    } finally {
      URL.revokeObjectURL(blobUrl)
    }

    if (!definition.id || definition.id !== manifest.id) {
      throw new Error(`El módulo exporta id "${definition.id}" pero manifest dice "${manifest.id}"`)
    }

    registerExternalPlugin(definition)

    const entry: ExternalPluginEntry = { id: manifest.id, manifest, isDev: true }
    const next = [...entriesRef.current.filter((e) => e.id !== manifest.id), entry]
    entriesRef.current = next
    setEntries(next)
    return manifest
  }

  async function uninstall(id: string): Promise<void> {
    const entry = entriesRef.current.find((e) => e.id === id)
    if (!entry?.isDev) await deleteExternalPlugin(id)
    unregisterExternalPlugin(id)
    const next = entriesRef.current.filter((e) => e.id !== id)
    entriesRef.current = next
    setEntries(next)
  }

  return { isRestoring, entries, installFromFile, installFromFolder, uninstall }
}
