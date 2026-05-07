import type { AppViewMessages } from "../../app/appI18n"
import { PluginsWorkspace } from "./PluginsWorkspace"

type PluginsScreenProps = {
  copy: AppViewMessages
}

export function PluginsScreen({ copy }: PluginsScreenProps) {
  return <PluginsWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
}
