import type { ComponentProps } from "react"
import {
  resolveAppMessages,
  type AppLanguage,
} from "../../app/appI18n"
import { ProjectFeatureView } from "./ProjectFeatureView"

type LocalizedProjectFeatureViewProps = {
  fileInputs: ComponentProps<typeof ProjectFeatureView>["fileInputs"]
  language?: AppLanguage
  projectFeature: ComponentProps<typeof ProjectFeatureView>["projectFeature"]
}

export function LocalizedProjectFeatureView({
  fileInputs,
  language = "es",
  projectFeature,
}: LocalizedProjectFeatureViewProps) {
  const t = resolveAppMessages(language).lab

  return (
    <ProjectFeatureView
      actions={{
        exportBundleLabel: t.common.export,
        exportingLabel: t.common.exporting,
        exportWavLabel: t.common.exportWav,
        importBundleLabel: t.common.import,
        newProjectLabel: t.project.newProject,
        playLabel: t.common.play,
        stopLabel: t.common.stop,
      }}
      currentProjectLabel={t.project.currentProject}
      fileInputs={fileInputs}
      newProjectDialog={{
        cancelLabel: t.common.cancel,
        continueWithoutSavingLabel: t.dialogs.continueWithout,
        description: t.dialogs.newProjectMsg,
        saveAndContinueLabel: t.dialogs.saveAndContinue,
        title: t.dialogs.newProjectTitle,
      }}
      projectFeature={projectFeature}
      summary={{
        notesLabel: t.project.notesLabel,
        projectLabel: t.project.projectLabel,
        projectNamePlaceholder: t.project.projectName,
        tracksLabel: t.project.tracksLabel,
      }}
    />
  )
}
