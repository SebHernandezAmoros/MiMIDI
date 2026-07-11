import type { AppLanguage } from "./appI18n"
import { getBrowserSettingsRepository } from "./browserSettingsRepository"
import { useProjectPlaybackComposition } from "./useProjectPlaybackComposition"
import { resetLabProjectViewPreferencesWithRepository } from "../application/use-cases/labViewPreferences"
import { LocalizedProjectFeatureView } from "../features/project-view/LocalizedProjectFeatureView"
import { createProjectFeatureComposition } from "../features/project-view/projectFeatureComposition"
import { createProjectFeatureFileImportHandlers } from "../features/project-view/projectFeatureFileImportHandlers"

type ProjectViewCompositionProps = {
  language?: AppLanguage
  masterVolume: number
}

export function ProjectViewComposition({
  language = "es",
  masterVolume,
}: ProjectViewCompositionProps) {
  const { playback, projectSession } = useProjectPlaybackComposition({
    mode: "project-only",
    timelineSnapEnabled: false,
    timelineSnapStep: 0.1,
  })

  function stopProjectPlayback() {
    playback.stopAll()
  }

  async function restartProject() {
    stopProjectPlayback()
    resetLabProjectViewPreferencesWithRepository(
      getBrowserSettingsRepository(),
      {
        clearActiveStepsTrack: () => {},
        resetPianoViewMode: () => {},
      },
    )
    await projectSession.restartProject()
  }

  const fileImportHandlers = createProjectFeatureFileImportHandlers({
    importBundle: projectSession.importBundle,
    importProjectFile: projectSession.importProjectFile,
    tearDownSession: stopProjectPlayback,
  })
  const projectFeature = createProjectFeatureComposition({
    dependencies: {
      exportBundle: projectSession.exportBundle,
      exportWav: () => projectSession.exportProjectAudio(masterVolume),
      openBundleImport: () => projectSession.importBundleRef.current?.click(),
      playProject: () => playback.playAll(projectSession.project, true),
      restartProject,
      setConfirmOpen: projectSession.setIsNewProjectConfirmOpen,
      stopPlayback: playback.stopAll,
      updateProjectName: projectSession.updateProjectName,
    },
    project: projectSession.project,
    status: {
      isExportingAudio: projectSession.isExportingAudio,
      isMixOnlyPlaying: playback.isMixOnlyPlaying,
      isNewProjectConfirmOpen: projectSession.isNewProjectConfirmOpen,
      isPlaying: playback.playbackTransport.isPlaying,
    },
  })

  return (
    <LocalizedProjectFeatureView
      fileInputs={{
        bundleInputRef: projectSession.importBundleRef,
        jsonInputRef: projectSession.importInputRef,
        onBundleChange: (event) =>
          void fileImportHandlers.importBundle(event),
        onJsonChange: (event) =>
          void fileImportHandlers.importProjectFile(event),
      }}
      language={language}
      projectFeature={projectFeature}
    />
  )
}
