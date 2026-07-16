import { loadStoredProject, saveProject } from "../../engine/project/projectStorage"

export function createLegacySendSamplerMixToTimelineUseCaseDependencies() {
  return {
    projects: {
      load: loadStoredProject,
      save: saveProject,
    },
  }
}
