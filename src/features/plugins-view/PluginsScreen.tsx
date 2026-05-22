import { AppDialog } from "../../app/components/AppDialog"
import { resolveAppMessages, type AppViewMessages, type AppLanguage } from "../../app/appI18n"
import { PluginsWorkspace } from "./PluginsWorkspace"

type PluginsScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function PluginsScreen({ copy, language, settingsOpen, onSettingsClose }: PluginsScreenProps) {
  const tc = resolveAppMessages(language ?? "es").lab.common
  return (
    <>
      <PluginsWorkspace body={copy.workspaceBody} language={language} title={copy.workspaceTitle} />
      <AppDialog
        description={copy.description}
        onClose={onSettingsClose}
        open={settingsOpen}
        title={`${tc.options} — ${copy.label}`}
      />
    </>
  )
}
