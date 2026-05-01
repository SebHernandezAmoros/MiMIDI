import LabApp from "../lab/LabApp"

type PerformWorkspaceProps = {
  body: string
  title: string
}

export function PerformWorkspace({ body, title }: PerformWorkspaceProps) {
  return (
    <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Perform">
      <h2>{title}</h2>
      <p>{body}</p>
      <LabApp mode="perform-only" />
    </section>
  )
}
