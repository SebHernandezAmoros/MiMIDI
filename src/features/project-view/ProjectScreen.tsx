import type { AppViewMessages, AppLanguage } from "../../app/appI18n"
import { ProjectWorkspace } from "./ProjectWorkspace"

type ProjectScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
}

export function ProjectScreen({ copy, language }: ProjectScreenProps) {
  return <ProjectWorkspace body={copy.workspaceBody} language={language} title={copy.workspaceTitle} />
}
