import type {
  PluginDefinitionCore,
} from "../../domain/plugins/pluginContracts"
import type {
  PluginToolSlotDefinition,
  PluginWorkspaceDefinition,
  ToolSlotId,
} from "./pluginHostModel"

export type {
  InstrumentPluginContribution,
  MiMIDIPluginId,
  MiMIDIPluginStateMap,
  PluginDefinitionCore,
  PluginAudioOutput,
  PluginMidiOutput,
  PluginOutput,
} from "../../domain/plugins/pluginContracts"
export type {
  MiMIDIPluginAPI,
  PluginToolSlotDefinition,
  PluginToolSlotProps,
  PluginWorkspaceDefinition,
  PluginWorkspaceProps,
  ToolSlotId,
} from "./pluginHostModel"

export type MiMIDIPluginDefinition = PluginDefinitionCore & {
  workspace?: PluginWorkspaceDefinition
  toolSlots?: Partial<Record<ToolSlotId, PluginToolSlotDefinition>>
}
