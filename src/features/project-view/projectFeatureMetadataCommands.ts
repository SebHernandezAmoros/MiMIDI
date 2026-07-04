type ProjectFeatureMetadataDependencies = {
  updateProjectName: (name: string) => void
}

export function createProjectFeatureMetadataCommands({
  updateProjectName,
}: ProjectFeatureMetadataDependencies) {
  return {
    changeProjectName(name: string) {
      updateProjectName(name)
    },
  }
}
