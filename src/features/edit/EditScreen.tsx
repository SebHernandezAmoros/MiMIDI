import type { AppViewMessages } from "../../app/appI18n"
import { EditWorkspace } from "./EditWorkspace"

type EditScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function EditScreen({ copy, settingsOpen, onSettingsClose }: EditScreenProps) {
  return (
    <EditWorkspace
      body={copy.workspaceBody}
      title={copy.workspaceTitle}
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
