import { getRegisteredPlugins } from "../../engine/plugins/pluginRegistry"
import type { MiMIDIPluginStateMap } from "../../domain/plugins/pluginContracts"
import type { MiMIDIPluginAPI, ToolSlotId } from "../../plugin-host/pluginHostModel"
import type { AppLanguage } from "../../app/appI18n"

type PluginSlotProps = {
  api: MiMIDIPluginAPI
  language: AppLanguage
  pluginStates?: MiMIDIPluginStateMap
  slotId: ToolSlotId
}

export function PluginSlot({ api, language, pluginStates, slotId }: PluginSlotProps) {
  const contributors = getRegisteredPlugins()
    .filter(p => {
      const enabled = pluginStates ? (pluginStates[p.id] ?? p.enabledByDefault) : p.enabledByDefault
      return enabled && p.toolSlots?.[slotId]
    })
    .map(p => ({ id: p.id, Component: p.toolSlots![slotId]! }))

  if (contributors.length === 0) return null

  return (
    <>
      {contributors.map(({ id, Component }) => (
        <Component key={id} api={api} language={language} slotId={slotId} />
      ))}
    </>
  )
}
