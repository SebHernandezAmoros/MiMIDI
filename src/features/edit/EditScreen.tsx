import type { AppViewMessages } from "../../app/appI18n"
import { EditWorkspace } from "./EditWorkspace"

type EditScreenProps = {
  copy: AppViewMessages
}

export function EditScreen({ copy }: EditScreenProps) {
  return <EditWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
}
