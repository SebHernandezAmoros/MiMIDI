import { decodeAudioData } from "../../engine/audio/audioEngine"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"
import { createSampleDbId } from "./sampleIds"

export function createLegacySampleImportUseCaseDependencies() {
  return {
    createSampleId: createSampleDbId,
    decodeAudioData,
    samples: {
      save: saveSampleBuffer,
    },
  }
}
