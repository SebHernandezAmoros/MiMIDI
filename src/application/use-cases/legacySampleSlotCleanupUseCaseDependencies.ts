import { loadSlotMetas, saveSlotMetas } from "../../engine/audio/sampleModel"
import { deleteSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacySampleSlotCleanupDependencies() {
  return {
    sampleSlots: {
      loadSlots: loadSlotMetas,
      saveSlots: saveSlotMetas,
    },
    samples: {
      delete: deleteSampleBuffer,
    },
  }
}
