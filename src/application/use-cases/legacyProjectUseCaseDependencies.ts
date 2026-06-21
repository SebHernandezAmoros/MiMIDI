import { loadStoredProject, saveProject } from "../../engine/project/projectStorage"

export function createLegacyProjectUseCaseDependencies() {
  return {
    projects: {
      load: loadStoredProject,
      save: saveProject,
    },
  }
}
