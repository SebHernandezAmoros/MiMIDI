import LabApp from "../lab/LabApp"
import type { AppLanguage } from "../../app/appI18n"

type ProjectWorkspaceProps = {
  body: string
  title: string
  language?: AppLanguage
}

export function ProjectWorkspace({ body, title, language }: ProjectWorkspaceProps) {
  void body
  void title
  return (
    <section className="app-mock-screen" aria-label="Workspace Project">
      <LabApp language={language} mode="project-only" />
    </section>
  )
}
