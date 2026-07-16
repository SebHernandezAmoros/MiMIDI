import { saveSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacyPluginClipStoreUseCaseDependencies() {
  return {
    samples: {
      save: saveSampleBuffer,
    },
  }
}
