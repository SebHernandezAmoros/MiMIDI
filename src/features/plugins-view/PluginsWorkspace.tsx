import LabApp from "../lab/LabApp"

type PluginsWorkspaceProps = {
  body: string
  title: string
}

export function PluginsWorkspace({ body, title }: PluginsWorkspaceProps) {
  void body
  void title
  return <LabApp mode="plugins-only" />
}
