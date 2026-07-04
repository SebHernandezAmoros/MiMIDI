import type { createProjectFeatureAudioCommands } from "./projectFeatureAudioCommands"
import type { createProjectFeatureBundleCommands } from "./projectFeatureBundleCommands"
import type { createProjectFeatureMetadataCommands } from "./projectFeatureMetadataCommands"
import type { createProjectFeatureNewProjectCommands } from "./projectFeatureNewProjectCommands"
import type { createProjectFeaturePlaybackCommands } from "./projectFeaturePlaybackCommands"
import type { ProjectFeatureReadModel } from "./projectFeatureReadModel"

export type ProjectFeatureContract = {
  commands: {
    audio: ReturnType<typeof createProjectFeatureAudioCommands>
    bundle: ReturnType<typeof createProjectFeatureBundleCommands>
    metadata: ReturnType<typeof createProjectFeatureMetadataCommands>
    newProject: ReturnType<typeof createProjectFeatureNewProjectCommands>
    playback: ReturnType<typeof createProjectFeaturePlaybackCommands>
  }
  projectName: string
  readModel: ProjectFeatureReadModel
  status: {
    isExportingAudio: boolean
    isMixOnlyPlaying: boolean
    isNewProjectConfirmOpen: boolean
    isPlaying: boolean
  }
}

export function createProjectFeatureContract(
  contract: ProjectFeatureContract,
): ProjectFeatureContract {
  return contract
}
