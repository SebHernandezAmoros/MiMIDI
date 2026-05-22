import LabApp from "../lab/LabApp"
import type { AppLanguage } from "../../app/appI18n"

type PluginsWorkspaceProps = {
  body: string
  language?: AppLanguage
  title: string
}

export function PluginsWorkspace({ body, language, title }: PluginsWorkspaceProps) {
  void body
  void title
  return <LabApp language={language} mode="plugins-only" />
}
