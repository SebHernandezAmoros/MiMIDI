import { AppDialog } from "../../app/components/AppDialog"
import { useProjectSession } from "../project-session/useProjectSession"

type ProjectFeatureNewProjectDialogProps = {
  cancelLabel: string
  continueWithoutSavingLabel: string
  description: string
  saveAndContinueLabel: string
  title: string
}

export function ProjectFeatureNewProjectDialog({
  cancelLabel,
  continueWithoutSavingLabel,
  description,
  saveAndContinueLabel,
  title,
}: ProjectFeatureNewProjectDialogProps) {
  const { projectFeature } = useProjectSession()
  const { newProject } = projectFeature.commands

  return (
    <AppDialog
      actions={
        <>
          <button onClick={newProject.cancelNewProject} type="button">
            {cancelLabel}
          </button>
          <button onClick={newProject.continueWithoutSaving} type="button">
            {continueWithoutSavingLabel}
          </button>
          <button
            className="app-dialog-confirm"
            onClick={newProject.saveAndContinue}
            type="button"
          >
            {saveAndContinueLabel}
          </button>
        </>
      }
      description={description}
      onClose={newProject.cancelNewProject}
      open={projectFeature.status.isNewProjectConfirmOpen}
      title={title}
    />
  )
}
