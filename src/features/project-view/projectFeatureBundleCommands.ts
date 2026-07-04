type ProjectFeatureBundleDependencies = {
  exportBundle: () => void | Promise<void>
  openBundleImport: () => void
}

export function createProjectFeatureBundleCommands({
  exportBundle,
  openBundleImport,
}: ProjectFeatureBundleDependencies) {
  return {
    exportBundle() {
      void exportBundle()
    },
    requestBundleImport() {
      openBundleImport()
    },
  }
}
