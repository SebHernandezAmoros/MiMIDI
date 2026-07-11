import type { ReactNode } from "react"

type PerformWebWorkspaceProps = {
  performContent: ReactNode
}

export function PerformWebWorkspace({ performContent }: PerformWebWorkspaceProps) {
  return (
    <section aria-label="Workspace Perform Web" className="perform-workspace-web">
      {performContent}
    </section>
  )
}
