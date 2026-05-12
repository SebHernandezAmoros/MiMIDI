import LabApp from "../lab/LabApp"
import "./PerformWorkspace.css"

type PerformWorkspaceProps = {
  body: string
  title: string
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function PerformWorkspace({ body, title, settingsOpen, onSettingsClose }: PerformWorkspaceProps) {
  void body
  void title

  return (
    <section className="perform-workspace" aria-label="Workspace Perform">
      <section className="perform-workspace-shell">
        <div className="perform-workspace-body">
          <LabApp mode="perform-only" settingsOpen={settingsOpen} onSettingsClose={onSettingsClose} />
        </div>
      </section>
    </section>
  )
}
