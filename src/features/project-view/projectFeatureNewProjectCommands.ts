type ProjectFeatureNewProjectDependencies = {
  exportBundle: () => void | Promise<void>
  restartProject: () => void | Promise<void>
  setConfirmOpen: (open: boolean) => void
}

export function createProjectFeatureNewProjectCommands({
  exportBundle,
  restartProject,
  setConfirmOpen,
}: ProjectFeatureNewProjectDependencies) {
  return {
    requestNewProject() {
      setConfirmOpen(true)
    },
    cancelNewProject() {
      setConfirmOpen(false)
    },
    continueWithoutSaving() {
      setConfirmOpen(false)
      void restartProject()
    },
    saveAndContinue() {
      setConfirmOpen(false)
      void exportBundle()
      void restartProject()
    },
  }
}
