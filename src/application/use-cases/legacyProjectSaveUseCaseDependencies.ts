import { saveProject } from "../../engine/project/projectStorage"

export function createLegacyProjectSaveUseCaseDependencies() {
  return {
    projects: {
      save: saveProject,
    },
  }
}
