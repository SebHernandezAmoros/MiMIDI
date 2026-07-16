import { loadSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacyPluginClipLoadUseCaseDependencies() {
  return {
    samples: {
      load: loadSampleBuffer,
    },
  }
}
