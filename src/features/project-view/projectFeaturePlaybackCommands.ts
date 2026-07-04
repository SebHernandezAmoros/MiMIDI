type ProjectFeaturePlaybackDependencies = {
  isMixOnlyPlaying: boolean
  isPlaying: boolean
  playProject: () => void
  stopPlayback: () => void
}

export function createProjectFeaturePlaybackCommands({
  isMixOnlyPlaying,
  isPlaying,
  playProject,
  stopPlayback,
}: ProjectFeaturePlaybackDependencies) {
  return {
    togglePlayback() {
      if (isPlaying || isMixOnlyPlaying) {
        stopPlayback()
        return
      }
      playProject()
    },
  }
}
