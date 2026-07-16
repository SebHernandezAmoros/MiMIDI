import { loadSlotMetas } from "../../engine/audio/sampleModel"
import { loadSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacyProjectBundleExportUseCaseDependencies() {
  return {
    sampleSlots: {
      loadSlots: loadSlotMetas,
    },
    samples: {
      load: loadSampleBuffer,
    },
  }
}
