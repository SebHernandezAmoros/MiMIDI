import { decodeAudioData } from "../../engine/audio/audioEngine"
import { loadSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacySampleDecodeUseCaseDependencies() {
  return {
    decodeAudioData,
    samples: {
      load: loadSampleBuffer,
    },
  }
}
