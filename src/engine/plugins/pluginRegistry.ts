import type { MathematicalInstrument } from "../audio/mathematicalInstruments"
import { internalPlugins } from "./internalPlugins"
import type {
  MiMIDIPluginDefinition,
  MiMIDIPluginId,
  MiMIDIPluginStateMap,
} from "./pluginModel"

export type RegisteredPluginSummary = MiMIDIPluginDefinition & {
  enabled: boolean
  instrumentCount: number
}

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

export function createDefaultPluginStates(
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
): MiMIDIPluginStateMap {
  return Object.fromEntries(
    plugins.map((plugin) => [plugin.id, plugin.enabledByDefault]),
  )
}

export function resolvePluginStates(
  pluginStates: Partial<MiMIDIPluginStateMap> | undefined,
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
): MiMIDIPluginStateMap {
  const defaultStates = createDefaultPluginStates(plugins)

  if (!pluginStates) {
    return defaultStates
  }

  for (const plugin of plugins) {
    const nextState = pluginStates[plugin.id]

    if (typeof nextState === "boolean") {
      defaultStates[plugin.id] = nextState
    }
  }

  return defaultStates
}

export function isKnownPluginId(
  pluginId: MiMIDIPluginId,
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  return plugins.some((plugin) => plugin.id === pluginId)
}

export function getEnabledPlugins(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  const resolvedPluginStates = resolvePluginStates(pluginStates, plugins)

  return plugins.filter((plugin) => resolvedPluginStates[plugin.id])
}

export function getPluginInstruments(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  return dedupeInstruments(
    getEnabledPlugins(pluginStates, plugins).flatMap(
      (plugin) => plugin.instruments?.instruments ?? [],
    ),
  )
}

export function getRegisteredPluginSummaries(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  const resolvedPluginStates = resolvePluginStates(pluginStates, plugins)

  return plugins.map((plugin) => ({
    ...plugin,
    enabled: resolvedPluginStates[plugin.id],
    instrumentCount: plugin.instruments?.instruments.length ?? 0,
  })) satisfies RegisteredPluginSummary[]
}

export function findRegisteredPluginByInstrumentId(
  instrumentId: string,
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins: MiMIDIPluginDefinition[] = internalPlugins,
) {
  return getEnabledPlugins(pluginStates, plugins).find((plugin) =>
    (plugin.instruments?.instruments ?? []).some(
      (instrument) => instrument.id === instrumentId,
    ),
  )
}
