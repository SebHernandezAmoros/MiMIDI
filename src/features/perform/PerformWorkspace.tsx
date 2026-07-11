import type { ReactNode } from "react"
import "./PerformWorkspace.css"

type PerformWorkspaceProps = {
  body: string
  performContent: ReactNode
  title: string
}

export function PerformWorkspace({ body, performContent, title }: PerformWorkspaceProps) {
  void body
  void title

  return (
    <section className="perform-workspace" aria-label="Workspace Perform">
      <section className="perform-workspace-shell">
        <div className="perform-workspace-body">
          {performContent}
        </div>
      </section>
    </section>
  )
}
