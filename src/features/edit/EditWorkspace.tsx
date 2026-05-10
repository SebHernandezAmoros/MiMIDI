import LabApp from "../lab/LabApp"

type EditWorkspaceProps = {
  body: string
  title: string
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function EditWorkspace({ body, title, settingsOpen, onSettingsClose }: EditWorkspaceProps) {
  void body
  void title
  return (
    <section className="app-mock-screen" aria-label="Workspace Edit">
      <div className="app-edit-lab">
        <LabApp mode="edit-only" settingsOpen={settingsOpen} onSettingsClose={onSettingsClose} />
      </div>
    </section>
  )
}
