import type { ReactNode } from "react"
import type { AppLanguage } from "../../app/appI18n"

type EditWorkspaceProps = {
  body: string
  editContent: ReactNode
  title: string
  language?: AppLanguage
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function EditWorkspace({ body, editContent, title }: EditWorkspaceProps) {
  void body
  void title
  return (
    <section className="app-mock-screen" aria-label="Workspace Edit">
      <div className="app-edit-lab">{editContent}</div>
    </section>
  )
}
