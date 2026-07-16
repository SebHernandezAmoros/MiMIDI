import { deleteSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacySampleDeleteUseCaseDependencies() {
  return {
    samples: {
      delete: deleteSampleBuffer,
    },
  }
}
