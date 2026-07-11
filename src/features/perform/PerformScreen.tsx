import type { ReactNode } from "react"
import type { AppViewMessages, AppLanguage } from "../../app/appI18n"
import { PerformWorkspace } from "./PerformWorkspace"

type PerformScreenProps = {
  copy: AppViewMessages
  performContent: ReactNode
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function PerformScreen({ copy, performContent }: PerformScreenProps) {
  return (
    <PerformWorkspace
      body={copy.workspaceBody}
      performContent={performContent}
      title={copy.workspaceTitle}
    />
  )
}
