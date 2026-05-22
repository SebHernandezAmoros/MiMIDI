import type { AppViewMessages, AppLanguage } from "../../app/appI18n"
import { EditWorkspace } from "./EditWorkspace"

type EditScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function EditScreen({ copy, language, settingsOpen, onSettingsClose }: EditScreenProps) {
  return (
    <EditWorkspace
      body={copy.workspaceBody}
      language={language}
      title={copy.workspaceTitle}
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
