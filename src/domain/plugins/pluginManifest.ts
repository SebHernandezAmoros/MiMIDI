import type { PluginDefinitionCore } from "./pluginContracts"

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

type PluginDefinitionIdentity = Pick<PluginDefinitionCore, "id" | "name">

export function parseExternalPluginManifest(
  manifestJson: string,
  sourceLabel = ".mimod",
): ExternalPluginManifest {
  const manifest = JSON.parse(manifestJson) as ExternalPluginManifest
  if (!manifest.id || !manifest.name || !manifest.entryPoint) {
    throw new Error(
      `${sourceLabel}: manifest.json invalido (falta id, name o entryPoint)`,
    )
  }
  return manifest
}

export function assertExternalPluginEntryPoint(
  manifest: ExternalPluginManifest,
  files: Record<string, unknown>,
  sourceLabel = ".mimod",
): void {
  if (!files[manifest.entryPoint]) {
    throw new Error(
      `${sourceLabel}: entryPoint "${manifest.entryPoint}" no encontrado`,
    )
  }
}

export function assertPluginDefinitionMatchesManifest(
  definition: Partial<PluginDefinitionIdentity>,
  manifest: ExternalPluginManifest,
  sourceLabel = ".mimod",
): void {
  if (!definition.id || !definition.name) {
    throw new Error(
      `${sourceLabel}: el modulo no exporta un MiMIDIPluginDefinition valido`,
    )
  }

  if (definition.id !== manifest.id) {
    throw new Error(
      `${sourceLabel}: id del manifest ("${manifest.id}") no coincide con el del modulo ("${definition.id}")`,
    )
  }
}
