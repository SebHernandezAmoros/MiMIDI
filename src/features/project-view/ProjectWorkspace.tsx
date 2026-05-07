import LabApp from "../lab/LabApp"

type ProjectWorkspaceProps = {
  body: string
  title: string
}

export function ProjectWorkspace({ body, title }: ProjectWorkspaceProps) {
  void body

  return (
    <section className="app-mock-screen" aria-label="Workspace Project">
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-copy">
          <strong>{title}</strong>
        </div>
      </header>
      <div className="app-project-lab">
        <LabApp mode="project-only" />
      </div>
    </section>
  )
}
