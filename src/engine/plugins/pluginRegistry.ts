import type { MathematicalInstrument } from "../audio/mathematicalInstruments"
import { internalPlugins } from "./internalPlugins"
import type {
  MiMIDIPluginId,
  MiMIDIPluginStateMap,
  PluginDefinitionCore,
} from "../../domain/plugins/pluginContracts"
import type { MiMIDIPluginDefinition } from "../../plugin-host/pluginHostModel"

export type RegisteredPluginSummary = PluginDefinitionCore & {
  enabled: boolean
  hasWorkspace: boolean
  instrumentCount: number
  isExternal: boolean
}

// ─── Runtime registry (internal + external cargados en sesión) ────────────────

const runtimePlugins = new Map<string, MiMIDIPluginDefinition>(
  internalPlugins.map((p) => [p.id, p]),
)
const externalPluginIds = new Set<string>()

type RegistryListener = () => void
const listeners = new Set<RegistryListener>()

function notifyListeners() {
  listeners.forEach((cb) => cb())
}

export function subscribeToPluginRegistry(cb: RegistryListener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function registerExternalPlugin(def: MiMIDIPluginDefinition): void {
  runtimePlugins.set(def.id, def)
  externalPluginIds.add(def.id)
  notifyListeners()
}

export function unregisterExternalPlugin(id: string): void {
  if (externalPluginIds.has(id)) {
    runtimePlugins.delete(id)
    externalPluginIds.delete(id)
    notifyListeners()
  }
}

export function isExternalPlugin(id: string): boolean {
  return externalPluginIds.has(id)
}

// ─── Helpers públicos ─────────────────────────────────────────────────────────

function dedupeInstruments(instruments: MathematicalInstrument[]) {
  const catalog = new Map<string, MathematicalInstrument>()
  for (const instrument of instruments) catalog.set(instrument.id, instrument)
  return [...catalog.values()]
}

export function getRegisteredPlugins(): MiMIDIPluginDefinition[] {
  return [...runtimePlugins.values()]
}

export function createDefaultPluginStates(
  plugins: PluginDefinitionCore[] = internalPlugins,
): MiMIDIPluginStateMap {
  return Object.fromEntries(plugins.map((p) => [p.id, p.enabledByDefault]))
}

export function resolvePluginStates(
  pluginStates: Partial<MiMIDIPluginStateMap> | undefined,
  plugins?: PluginDefinitionCore[],
): MiMIDIPluginStateMap {
  const all = plugins ?? getRegisteredPlugins()
  const defaults = Object.fromEntries(all.map((p) => [p.id, p.enabledByDefault]))
  if (!pluginStates) return defaults
  for (const p of all) {
    if (typeof pluginStates[p.id] === "boolean") defaults[p.id] = pluginStates[p.id]!
  }
  return defaults
}

export function isKnownPluginId(
  pluginId: MiMIDIPluginId,
  plugins?: PluginDefinitionCore[],
) {
  return (plugins ?? getRegisteredPlugins()).some((p) => p.id === pluginId)
}

export function getEnabledPlugins(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins?: PluginDefinitionCore[],
) {
  const all = plugins ?? getRegisteredPlugins()
  const resolved = resolvePluginStates(pluginStates, all)
  return all.filter((p) => resolved[p.id])
}

export function getPluginInstruments(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins?: PluginDefinitionCore[],
) {
  return dedupeInstruments(
    getEnabledPlugins(pluginStates, plugins).flatMap(
      (p) => p.instruments?.instruments ?? [],
    ),
  )
}

export function getRegisteredPluginSummaries(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins?: MiMIDIPluginDefinition[],
): RegisteredPluginSummary[] {
  const all = plugins ?? getRegisteredPlugins()
  const resolved = resolvePluginStates(pluginStates, all)
  return all.map((p) => ({
    id: p.id,
    name: p.name,
    version: p.version,
    description: p.description,
    enabledByDefault: p.enabledByDefault,
    enabled: resolved[p.id] ?? p.enabledByDefault,
    hasWorkspace: Boolean(p.workspace),
    instrumentCount: p.instruments?.instruments.length ?? 0,
    isExternal: externalPluginIds.has(p.id),
  }))
}

export function findRegisteredPluginByInstrumentId(
  instrumentId: string,
  pluginStates?: Partial<MiMIDIPluginStateMap>,
  plugins?: PluginDefinitionCore[],
) {
  return getEnabledPlugins(pluginStates, plugins).find((p) =>
    (p.instruments?.instruments ?? []).some((i) => i.id === instrumentId),
  )
}
