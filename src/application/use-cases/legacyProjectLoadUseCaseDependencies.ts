import { loadStoredProject } from "../../engine/project/projectStorage"

export function createLegacyProjectLoadUseCaseDependencies() {
  return {
    projects: {
      load: loadStoredProject,
    },
  }
}
