import { unzipSync, strFromU8 } from "fflate"
import {
  assertExternalPluginEntryPoint,
  assertPluginDefinitionMatchesManifest,
  parseExternalPluginManifest,
  type ExternalPluginManifest,
} from "../../domain/plugins/pluginManifest"
import { exposeRuntime } from "../../plugin-host/externalPluginRuntimeGlobals"
import { loadExternalPluginDefinitionFromJavaScript } from "./externalPluginRuntimeLoader"
import type { MiMIDIPluginDefinition } from "../../plugin-host/pluginHostModel"

export type { ExternalPluginManifest } from "../../domain/plugins/pluginManifest"

export async function loadPluginFromMimod(
  data: ArrayBuffer,
): Promise<{ manifest: ExternalPluginManifest; definition: MiMIDIPluginDefinition }> {
  const files = unzipSync(new Uint8Array(data))

  const manifestFile = files["manifest.json"]
  if (!manifestFile) throw new Error(".mimod: manifest.json no encontrado")

  const manifest = parseExternalPluginManifest(strFromU8(manifestFile), ".mimod")
  assertExternalPluginEntryPoint(manifest, files, ".mimod")

  const entryFile = files[manifest.entryPoint]!

  exposeRuntime()

  const definition: MiMIDIPluginDefinition =
    await loadExternalPluginDefinitionFromJavaScript(entryFile)
  assertPluginDefinitionMatchesManifest(definition, manifest, ".mimod")

  return { manifest, definition }
}
