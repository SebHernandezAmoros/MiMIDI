import type { AppViewMessages } from "../../app/appI18n"

type SettingsScreenProps = {
  copy: AppViewMessages
}

export function SettingsScreen({ copy }: SettingsScreenProps) {
  return (
    <section className="app-view-screen" aria-label="Pantalla Settings">
      <div className="app-view-intro">
        <h2>{copy.label}</h2>
        <p>{copy.intro}</p>
      </div>
      <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Settings">
        <h2>{copy.workspaceTitle}</h2>
        <p>{copy.workspaceBody}</p>
      </section>
    </section>
  )
}
