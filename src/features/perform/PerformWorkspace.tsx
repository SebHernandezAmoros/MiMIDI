import LabApp from "../lab/LabApp"
import "./PerformWorkspace.css"
import type { AppLanguage } from "../../app/appI18n"

type PerformWorkspaceProps = {
  body: string
  title: string
  language?: AppLanguage
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function PerformWorkspace({ body, title, language, settingsOpen, onSettingsClose }: PerformWorkspaceProps) {
  void body
  void title

  return (
    <section className="perform-workspace" aria-label="Workspace Perform">
      <section className="perform-workspace-shell">
        <div className="perform-workspace-body">
          <LabApp language={language} mode="perform-only" settingsOpen={settingsOpen} onSettingsClose={onSettingsClose} />
        </div>
      </section>
    </section>
  )
}
