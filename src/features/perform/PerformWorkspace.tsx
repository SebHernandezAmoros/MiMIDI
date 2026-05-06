import LabApp from "../lab/LabApp"
import "./PerformWorkspace.css"

type PerformWorkspaceProps = {
  body: string
  title: string
}

export function PerformWorkspace({ body, title }: PerformWorkspaceProps) {
  return (
    <section className="perform-workspace" aria-label="Workspace Perform">
      <section className="perform-workspace-intro app-view-panel">
        <h2>{title}</h2>
        <p>{body}</p>
      </section>
      <section className="perform-workspace-shell app-surface-window">
        <div className="app-surface-topbar">
          <span className="app-surface-icon" aria-hidden="true">
            ≡
          </span>
          <strong className="app-surface-brand">mimidi</strong>
          <span className="app-surface-icon" aria-hidden="true">
            •••
          </span>
        </div>
        <div className="perform-workspace-body">
          <LabApp mode="perform-only" />
        </div>
      </section>
    </section>
  )
}
