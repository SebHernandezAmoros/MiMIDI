import type { AppViewMessages } from "../../app/appI18n"

type SamplerScreenProps = {
  copy: AppViewMessages
}

export function SamplerScreen({ copy }: SamplerScreenProps) {
  return (
    <section className="app-view-screen" aria-label="Pantalla Sampler">
      <div className="app-view-intro">
        <h2>{copy.label}</h2>
        <p>{copy.intro}</p>
      </div>
      <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Sampler">
        <h2>{copy.workspaceTitle}</h2>
        <p>{copy.workspaceBody}</p>
      </section>
    </section>
  )
}
