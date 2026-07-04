import type { AppViewMessages, AppLanguage } from "../../app/appI18n"
import type { ReactNode } from "react"
import { ProjectWorkspace } from "./ProjectWorkspace"

type ProjectScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  projectContent: ReactNode
}

export function ProjectScreen({ copy, projectContent }: ProjectScreenProps) {
  return (
    <ProjectWorkspace
      body={copy.workspaceBody}
      projectContent={projectContent}
      title={copy.workspaceTitle}
    />
  )
}
