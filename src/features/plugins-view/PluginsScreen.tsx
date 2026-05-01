import type { AppViewMessages } from "../../app/appI18n"
import { PluginsWorkspace } from "./PluginsWorkspace"

type PluginsScreenProps = {
  copy: AppViewMessages
}

export function PluginsScreen({ copy }: PluginsScreenProps) {
  return (
    <section className="app-view-screen" aria-label="Pantalla Plugins">
      <div className="app-view-intro">
        <h2>{copy.label}</h2>
        <p>{copy.intro}</p>
      </div>
      <PluginsWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
    </section>
  )
}
