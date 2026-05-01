import type { AppViewMessages } from "../../app/appI18n"
import { EditWorkspace } from "./EditWorkspace"

type EditScreenProps = {
  copy: AppViewMessages
}

export function EditScreen({ copy }: EditScreenProps) {
  return (
    <section className="app-view-screen" aria-label="Pantalla Edit">
      <div className="app-view-intro">
        <h2>{copy.label}</h2>
        <p>{copy.intro}</p>
      </div>
      <EditWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
    </section>
  )
}
