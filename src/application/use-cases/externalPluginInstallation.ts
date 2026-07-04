import {
  assertPluginDefinitionMatchesManifest,
  parseExternalPluginManifest,
  type ExternalPluginManifest,
} from "../../domain/plugins/pluginManifest"

export type ExternalPluginLoadResult<TDefinition> = {
  manifest: ExternalPluginManifest
  definition: TDefinition
}

export type ExternalPluginInstallationDependencies<TDefinition> = {
  loadPlugin(data: ArrayBuffer): Promise<ExternalPluginLoadResult<TDefinition>>
  savePlugin(id: string, data: ArrayBuffer): Promise<void>
  registerPlugin(definition: TDefinition): void
}

export type RestoredExternalPluginEntry = {
  id: string
  manifest: ExternalPluginManifest
}

export type ExternalPluginRestorationDependencies<TDefinition> = {
  listPluginIds(): Promise<string[]>
  loadStoredPlugin(id: string): Promise<ArrayBuffer | null>
  loadPlugin(data: ArrayBuffer): Promise<ExternalPluginLoadResult<TDefinition>>
  registerPlugin(definition: TDefinition): void
  onRestoreError?(id: string, error: unknown): void
}

export type ExternalPluginDevelopmentFolderDependencies<
  TDefinition extends { id?: string; name?: string },
> = {
  readTextFile(fileName: string): Promise<string>
  prepareRuntime(): void
  loadDefinition(javaScript: string): Promise<TDefinition>
  registerPlugin(definition: TDefinition): void
}

export async function installExternalPluginFromDataWithDependencies<TDefinition>(
  data: ArrayBuffer,
  dependencies: ExternalPluginInstallationDependencies<TDefinition>,
): Promise<ExternalPluginManifest> {
  const { manifest, definition } = await dependencies.loadPlugin(data)
  await dependencies.savePlugin(manifest.id, data)
  dependencies.registerPlugin(definition)
  return manifest
}

export async function restoreExternalPluginsWithDependencies<TDefinition>(
  dependencies: ExternalPluginRestorationDependencies<TDefinition>,
): Promise<RestoredExternalPluginEntry[]> {
  const ids = await dependencies.listPluginIds()
  const restored: RestoredExternalPluginEntry[] = []

  for (const id of ids) {
    const data = await dependencies.loadStoredPlugin(id)
    if (!data) continue

    try {
      const { manifest, definition } = await dependencies.loadPlugin(data)
      dependencies.registerPlugin(definition)
      restored.push({ id, manifest })
    } catch (error) {
      dependencies.onRestoreError?.(id, error)
    }
  }

  return restored
}

export async function installExternalPluginFromDevelopmentFolderWithDependencies<
  TDefinition extends { id?: string; name?: string },
>(
  dependencies: ExternalPluginDevelopmentFolderDependencies<TDefinition>,
): Promise<ExternalPluginManifest> {
  const manifestJson = await dependencies
    .readTextFile("manifest.json")
    .catch(() => {
      throw new Error("No se encontro manifest.json en el directorio")
    })
  const manifest = parseExternalPluginManifest(manifestJson, "manifest.json")

  const javaScript = await dependencies
    .readTextFile(manifest.entryPoint)
    .catch(() => {
      throw new Error(
        `No se encontro ${manifest.entryPoint}. Compila primero: node scripts/build-plugin.mjs ${manifest.id}`,
      )
    })

  dependencies.prepareRuntime()
  const definition = await dependencies.loadDefinition(javaScript)
  assertPluginDefinitionMatchesManifest(definition, manifest, "manifest.json")
  dependencies.registerPlugin(definition)

  return manifest
}
