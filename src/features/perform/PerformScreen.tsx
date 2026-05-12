import type { AppViewMessages } from "../../app/appI18n"
import { PerformWorkspace } from "./PerformWorkspace"

type PerformScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function PerformScreen({ copy, settingsOpen, onSettingsClose }: PerformScreenProps) {
  return (
    <PerformWorkspace
      body={copy.workspaceBody}
      title={copy.workspaceTitle}
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
