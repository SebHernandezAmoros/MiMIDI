import LabApp from "../lab/LabApp"
import "./PerformWorkspace.css"

type PerformWorkspaceProps = {
  body: string
  title: string
}

export function PerformWorkspace({ body, title }: PerformWorkspaceProps) {
  void body
  void title

  return (
    <section className="perform-workspace" aria-label="Workspace Perform">
      <section className="perform-workspace-shell">
        <div className="perform-workspace-body">
          <LabApp mode="perform-only" />
        </div>
      </section>
    </section>
  )
}
