import type { AppLanguage } from "../../app/appI18n"
import type { MiMIDIPluginAPI } from "../../plugin-host/pluginHostModel"
import { PluginWorkspaceHost } from "./PluginWorkspaceHost"

type PluginWorkspaceViewProps = {
  api: MiMIDIPluginAPI
  language: AppLanguage
  notification: string
  pluginId: string
}

export function PluginWorkspaceView({
  api,
  language,
  notification,
  pluginId,
}: PluginWorkspaceViewProps) {
  return (
    <>
      <PluginWorkspaceHost
        api={api}
        language={language}
        pluginId={pluginId}
      />
      {notification && (
        <div role="status" className="plugin-toast">
          {notification}
        </div>
      )}
    </>
  )
}
