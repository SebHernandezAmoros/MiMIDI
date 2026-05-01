import LabApp from "../lab/LabApp"

type EditWorkspaceProps = {
  body: string
  title: string
}

export function EditWorkspace({ body, title }: EditWorkspaceProps) {
  return (
    <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Edit">
      <h2>{title}</h2>
      <p>{body}</p>
      <LabApp mode="edit-only" />
    </section>
  )
}
