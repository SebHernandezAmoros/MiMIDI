import type { MiMIDIPluginDefinition } from "../../plugin-host/pluginHostModel"

export type ExternalPluginRuntimeLoaderDependencies = {
  createObjectUrl(blob: Blob): string
  importModule(url: string): Promise<unknown>
  revokeObjectUrl(url: string): void
}

export const browserExternalPluginRuntimeLoaderDependencies: ExternalPluginRuntimeLoaderDependencies = {
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  importModule: (url) => import(/* @vite-ignore */ url),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
}

export async function loadExternalPluginDefinitionFromJavaScript(
  javascript: BlobPart,
  dependencies: ExternalPluginRuntimeLoaderDependencies =
    browserExternalPluginRuntimeLoaderDependencies,
): Promise<MiMIDIPluginDefinition> {
  const blob = new Blob([javascript], { type: "application/javascript" })
  const url = dependencies.createObjectUrl(blob)
  try {
    const mod = await dependencies.importModule(url)
    return resolvePluginDefinitionModule(mod)
  } finally {
    dependencies.revokeObjectUrl(url)
  }
}

function resolvePluginDefinitionModule(mod: unknown): MiMIDIPluginDefinition {
  if (isModuleWithDefault(mod)) return mod.default as MiMIDIPluginDefinition
  return mod as MiMIDIPluginDefinition
}

function isModuleWithDefault(mod: unknown): mod is { default: unknown } {
  return typeof mod === "object" && mod !== null && "default" in mod
}
