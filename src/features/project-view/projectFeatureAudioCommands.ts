type ProjectFeatureAudioDependencies = {
  exportWav: () => void | Promise<void>
}

export function createProjectFeatureAudioCommands({
  exportWav,
}: ProjectFeatureAudioDependencies) {
  return {
    exportWav() {
      void exportWav()
    },
  }
}
