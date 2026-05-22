import type { AppViewMessages, AppLanguage } from "../../app/appI18n"
import { PerformWorkspace } from "./PerformWorkspace"

type PerformScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function PerformScreen({ copy, language, settingsOpen, onSettingsClose }: PerformScreenProps) {
  return (
    <PerformWorkspace
      body={copy.workspaceBody}
      language={language}
      title={copy.workspaceTitle}
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
