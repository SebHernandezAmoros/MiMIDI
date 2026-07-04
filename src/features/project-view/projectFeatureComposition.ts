import type { MusicalProject } from "../../domain/project/projectTypes"
import { createProjectFeatureAudioCommands } from "./projectFeatureAudioCommands"
import { createProjectFeatureBundleCommands } from "./projectFeatureBundleCommands"
import {
  createProjectFeatureContract,
  type ProjectFeatureContract,
} from "./projectFeatureContract"
import { createProjectFeatureMetadataCommands } from "./projectFeatureMetadataCommands"
import { createProjectFeatureNewProjectCommands } from "./projectFeatureNewProjectCommands"
import { createProjectFeaturePlaybackCommands } from "./projectFeaturePlaybackCommands"
import { resolveProjectFeatureReadModel } from "./projectFeatureReadModel"

type ProjectFeatureCompositionDependencies = {
  exportBundle: () => void | Promise<void>
  exportWav: () => void | Promise<void>
  openBundleImport: () => void
  playProject: () => void
  restartProject: () => void | Promise<void>
  setConfirmOpen: (open: boolean) => void
  stopPlayback: () => void
  updateProjectName: (name: string) => void
}

type ProjectFeatureCompositionInput = {
  dependencies: ProjectFeatureCompositionDependencies
  project: MusicalProject
  status: ProjectFeatureContract["status"]
}

export function createProjectFeatureComposition({
  dependencies,
  project,
  status,
}: ProjectFeatureCompositionInput): ProjectFeatureContract {
  const bundle = createProjectFeatureBundleCommands({
    exportBundle: dependencies.exportBundle,
    openBundleImport: dependencies.openBundleImport,
  })

  return createProjectFeatureContract({
    commands: {
      audio: createProjectFeatureAudioCommands({
        exportWav: dependencies.exportWav,
      }),
      bundle,
      metadata: createProjectFeatureMetadataCommands({
        updateProjectName: dependencies.updateProjectName,
      }),
      newProject: createProjectFeatureNewProjectCommands({
        exportBundle: bundle.exportBundle,
        restartProject: dependencies.restartProject,
        setConfirmOpen: dependencies.setConfirmOpen,
      }),
      playback: createProjectFeaturePlaybackCommands({
        isMixOnlyPlaying: status.isMixOnlyPlaying,
        isPlaying: status.isPlaying,
        playProject: dependencies.playProject,
        stopPlayback: dependencies.stopPlayback,
      }),
    },
    projectName: project.name,
    readModel: resolveProjectFeatureReadModel(project),
    status,
  })
}
