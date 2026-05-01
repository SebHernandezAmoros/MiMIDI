import type { MathematicalInstrument } from "../audio/mathematicalInstruments"
import { internalPlugins } from "./internalPlugins"
import type { MiMIDIPluginDefinition } from "./pluginModel"

function dedupeInstruments(instruments: MathematicalInstrument[]) {
  const catalog = new Map<string, MathematicalInstrument>()

  for (const instrument of instruments) {
    catalog.set(instrument.id, instrument)
  }

  return [...catalog.values()]
}

export function getRegisteredPlugins() {
  return [...internalPlugins]
}

export function getEnabledPlugins(
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  return plugins.filter((plugin) => plugin.enabledByDefault)
}

export function getPluginInstruments(
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  return dedupeInstruments(
    getEnabledPlugins(plugins).flatMap((plugin) => plugin.instruments?.instruments ?? []),
  )
}
