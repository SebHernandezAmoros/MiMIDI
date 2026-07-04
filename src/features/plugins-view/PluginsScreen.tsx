import { AppDialog } from "../../app/components/AppDialog"
import { resolveAppMessages, type AppViewMessages, type AppLanguage } from "../../app/appI18n"
import type { ReactNode } from "react"
import { PluginsWorkspace } from "./PluginsWorkspace"

type PluginsScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  pluginsContent: ReactNode
  renderPluginWorkspace: (pluginId: string) => ReactNode
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function PluginsScreen({
  copy,
  language,
  pluginsContent,
  renderPluginWorkspace,
  settingsOpen,
  onSettingsClose,
}: PluginsScreenProps) {
  const tc = resolveAppMessages(language ?? "es").lab.common
  return (
    <>
      <PluginsWorkspace
        body={copy.workspaceBody}
        pluginsContent={pluginsContent}
        renderPluginWorkspace={renderPluginWorkspace}
        title={copy.workspaceTitle}
      />
      <AppDialog
        description={copy.description}
        onClose={onSettingsClose}
        open={settingsOpen}
        title={`${tc.options} — ${copy.label}`}
      />
    </>
  )
}
