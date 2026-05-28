import React from "react"
import { unzipSync, strFromU8 } from "fflate"
import type { MiMIDIPluginDefinition } from "./pluginModel"

export type ExternalPluginManifest = {
  id: string
  name: string
  version: string
  description: string
  author: string
  sourceUrl?: string
  license?: string
  entryPoint: string
  mimidiVersion?: string
  permissions?: string[]
}

// Expone React al scope global para que plugins con workspace puedan usarlo
// como external en su bundle (window.__MIMIDI_RUNTIME__.React).
export function exposeRuntime() {
  ;(window as unknown as Record<string, unknown>).__MIMIDI_RUNTIME__ = { React }
}

export async function loadPluginFromMimod(
  data: ArrayBuffer,
): Promise<{ manifest: ExternalPluginManifest; definition: MiMIDIPluginDefinition }> {
  const files = unzipSync(new Uint8Array(data))

  const manifestFile = files["manifest.json"]
  if (!manifestFile) throw new Error(".mimod: manifest.json no encontrado")

  const manifest = JSON.parse(strFromU8(manifestFile)) as ExternalPluginManifest
  if (!manifest.id || !manifest.name || !manifest.entryPoint) {
    throw new Error(".mimod: manifest.json inválido (falta id, name o entryPoint)")
  }

  const entryFile = files[manifest.entryPoint]
  if (!entryFile) throw new Error(`.mimod: entryPoint "${manifest.entryPoint}" no encontrado`)

  exposeRuntime()

  const blob = new Blob([entryFile], { type: "application/javascript" })
  const url = URL.createObjectURL(blob)
  let definition: MiMIDIPluginDefinition
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mod = await import(/* @vite-ignore */ url)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    definition = (mod.default ?? mod) as MiMIDIPluginDefinition
  } finally {
    URL.revokeObjectURL(url)
  }

  if (!definition.id || !definition.name) {
    throw new Error(".mimod: el módulo no exporta un MiMIDIPluginDefinition válido")
  }

  // El id del manifest manda — evita que un plugin se registre con id distinto
  if (definition.id !== manifest.id) {
    throw new Error(
      `.mimod: id del manifest ("${manifest.id}") no coincide con el del módulo ("${definition.id}")`,
    )
  }

  return { manifest, definition }
}
