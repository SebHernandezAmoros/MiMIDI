import type { AppViewMessages } from "../../app/appI18n"
import { PerformWorkspace } from "./PerformWorkspace"

type PerformScreenProps = {
  copy: AppViewMessages
}

export function PerformScreen({ copy }: PerformScreenProps) {
  return (
    <section className="app-view-screen" aria-label="Pantalla Perform">
      <div className="app-view-intro">
        <h2>{copy.label}</h2>
        <p>{copy.intro}</p>
      </div>
      <PerformWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
    </section>
  )
}
