import { saveSlotMetas } from "../../engine/audio/sampleModel"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"
import { parseImportedProject } from "../../engine/project/projectModel"

export function createLegacyProjectBundleImportUseCaseDependencies() {
  return {
    parseProject: parseImportedProject,
    sampleSlots: {
      saveSlots: saveSlotMetas,
    },
    samples: {
      save: saveSampleBuffer,
    },
  }
}
