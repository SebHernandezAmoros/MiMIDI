import LabApp from "../lab/LabApp"

type ProjectWorkspaceProps = {
  body: string
  title: string
}

export function ProjectWorkspace({ body, title }: ProjectWorkspaceProps) {
  void body
  void title
  return (
    <section className="app-mock-screen" aria-label="Workspace Project">
      <LabApp mode="project-only" />
    </section>
  )
}
