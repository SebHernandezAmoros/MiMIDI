import type { ReactNode } from "react"
import type { AppViewMessages, AppLanguage } from "../../app/appI18n"
import { EditWorkspace } from "./EditWorkspace"

type EditScreenProps = {
  copy: AppViewMessages
  editContent: ReactNode
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function EditScreen({ copy, editContent, language, settingsOpen, onSettingsClose }: EditScreenProps) {
  return (
    <EditWorkspace
      body={copy.workspaceBody}
      editContent={editContent}
      language={language}
      title={copy.workspaceTitle}
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
