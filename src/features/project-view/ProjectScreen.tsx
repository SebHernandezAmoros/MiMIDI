import type { AppViewMessages } from "../../app/appI18n"
import { ProjectWorkspace } from "./ProjectWorkspace"

type ProjectScreenProps = {
  copy: AppViewMessages
}

export function ProjectScreen({ copy }: ProjectScreenProps) {
  return <ProjectWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
}
