type InstalledPlugin = {
  id: string
}

export type PluginCatalogActionDependencies = {
  installFromFile: (file: File) => Promise<InstalledPlugin>
  installFromFolder: () => Promise<InstalledPlugin>
  logError: (context: string, error: unknown) => void
  setPluginEnabled: (pluginId: string, enabled: boolean | undefined) => void
  showError: (message: string) => void
  uninstall: (pluginId: string) => Promise<void>
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function installPluginCatalogFile(
  file: File,
  dependencies: PluginCatalogActionDependencies,
): Promise<void> {
  try {
    const manifest = await dependencies.installFromFile(file)
    dependencies.setPluginEnabled(manifest.id, true)
  } catch (error) {
    dependencies.logError("[IMPORT .mimod]", error)
    dependencies.showError(
      `No se pudo instalar el plugin:\n${getErrorMessage(error)}`,
    )
  }
}

export async function installPluginCatalogFolder(
  dependencies: PluginCatalogActionDependencies,
): Promise<void> {
  try {
    const manifest = await dependencies.installFromFolder()
    dependencies.setPluginEnabled(manifest.id, true)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return
    dependencies.logError("[PLUGIN FOLDER]", error)
    dependencies.showError(
      `No se pudo cargar el plugin:\n${getErrorMessage(error)}`,
    )
  }
}

export async function uninstallPluginCatalogEntry(
  pluginId: string,
  dependencies: PluginCatalogActionDependencies,
): Promise<void> {
  await dependencies.uninstall(pluginId)
  dependencies.setPluginEnabled(pluginId, undefined)
}
