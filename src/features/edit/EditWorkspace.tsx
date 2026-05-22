import LabApp from "../lab/LabApp"
import type { AppLanguage } from "../../app/appI18n"

type EditWorkspaceProps = {
  body: string
  title: string
  language?: AppLanguage
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function EditWorkspace({ body, title, language, settingsOpen, onSettingsClose }: EditWorkspaceProps) {
  void body
  void title
  return (
    <section className="app-mock-screen" aria-label="Workspace Edit">
      <div className="app-edit-lab">
        <LabApp language={language} mode="edit-only" settingsOpen={settingsOpen} onSettingsClose={onSettingsClose} />
      </div>
    </section>
  )
}
