import type { ReactNode } from "react"

type ProjectWorkspaceProps = {
  body: string
  projectContent: ReactNode
  title: string
}

export function ProjectWorkspace({
  body,
  projectContent,
  title,
}: ProjectWorkspaceProps) {
  void body
  void title
  return (
    <section className="app-mock-screen" aria-label="Workspace Project">
      {projectContent}
    </section>
  )
}
