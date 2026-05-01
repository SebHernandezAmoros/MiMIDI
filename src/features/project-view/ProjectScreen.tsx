import type { AppViewMessages } from "../../app/appI18n"
import { ProjectWorkspace } from "./ProjectWorkspace"

type ProjectScreenProps = {
  copy: AppViewMessages
}

export function ProjectScreen({ copy }: ProjectScreenProps) {
  return (
    <section className="app-view-screen" aria-label="Pantalla Project">
      <div className="app-view-intro">
        <h2>{copy.label}</h2>
        <p>{copy.intro}</p>
      </div>
      <ProjectWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
    </section>
  )
}
