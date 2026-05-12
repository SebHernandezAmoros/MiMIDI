import LabApp from "../lab/LabApp"

type ProjectWorkspaceProps = {
  body: string
  title: string
}

export function ProjectWorkspace({ body, title }: ProjectWorkspaceProps) {
  void body
  void title
  return <LabApp mode="project-only" />
}
