import type { ExternalPluginRepository } from "../../application/ports/ExternalPluginRepository"
import { createLegacyExternalPluginUseCaseDependencies } from "../../application/use-cases/legacyExternalPluginUseCaseDependencies"
import type { ExternalPluginManifest } from "../../domain/plugins/pluginManifest"
import { loadExternalPluginDefinitionFromJavaScript } from "../../engine/plugins/externalPluginRuntimeLoader"
import { loadPluginFromMimod } from "../../engine/plugins/pluginLoader"
import {
  registerExternalPlugin,
  unregisterExternalPlugin,
} from "../../engine/plugins/pluginRegistry"
import { exposeRuntime } from "../../plugin-host/externalPluginRuntimeGlobals"
import type { MiMIDIPluginDefinition } from "../../plugin-host/pluginHostModel"

export type ExternalPluginDevelopmentDirectory = {
  readTextFile(fileName: string): Promise<string>
}

export type ExternalPluginManagerDependencies = {
  externalPlugins: ExternalPluginRepository
  loadPlugin(data: ArrayBuffer): Promise<{
    manifest: ExternalPluginManifest
    definition: MiMIDIPluginDefinition
  }>
  loadDefinition(javaScript: string): Promise<MiMIDIPluginDefinition>
  registerPlugin(definition: MiMIDIPluginDefinition): void
  unregisterPlugin(id: string): void
  prepareRuntime(): void
  pickDevelopmentDirectory(): Promise<ExternalPluginDevelopmentDirectory>
  onRestoreError?(id: string, error: unknown): void
}

type BrowserDirectoryHandle = {
  getFileHandle(name: string): Promise<{ getFile(): Promise<File> }>
}

async function pickBrowserDevelopmentDirectory(): Promise<ExternalPluginDevelopmentDirectory> {
  const picker = (window as unknown as Record<string, unknown>)
    .showDirectoryPicker as (() => Promise<BrowserDirectoryHandle>) | undefined
  if (!picker) {
    throw new Error("showDirectoryPicker no disponible en este navegador")
  }

  const directory = await picker()
  return {
    readTextFile: (fileName) =>
      directory
        .getFileHandle(fileName)
        .then((handle) => handle.getFile())
        .then((file) => file.text()),
  }
}

export function createLegacyExternalPluginManagerDependencies(): ExternalPluginManagerDependencies {
  const { externalPlugins } =
    createLegacyExternalPluginUseCaseDependencies()

  return {
    externalPlugins,
    loadPlugin: loadPluginFromMimod,
    loadDefinition: loadExternalPluginDefinitionFromJavaScript,
    registerPlugin: registerExternalPlugin,
    unregisterPlugin: unregisterExternalPlugin,
    prepareRuntime: exposeRuntime,
    pickDevelopmentDirectory: pickBrowserDevelopmentDirectory,
    onRestoreError: (id, error) => {
      console.warn(
        `[useExternalPlugins] No se pudo restaurar plugin "${id}":`,
        error,
      )
    },
  }
}
