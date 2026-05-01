import LabApp from "../lab/LabApp"

type ProjectWorkspaceProps = {
  body: string
  title: string
}

export function ProjectWorkspace({ body, title }: ProjectWorkspaceProps) {
  return (
    <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Project">
      <h2>{title}</h2>
      <p>{body}</p>
      <LabApp mode="project-only" />
    </section>
  )
}
