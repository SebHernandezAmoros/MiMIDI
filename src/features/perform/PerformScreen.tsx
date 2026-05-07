import type { AppViewMessages } from "../../app/appI18n"
import { PerformWorkspace } from "./PerformWorkspace"

type PerformScreenProps = {
  copy: AppViewMessages
}

export function PerformScreen({ copy }: PerformScreenProps) {
  return <PerformWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
}
