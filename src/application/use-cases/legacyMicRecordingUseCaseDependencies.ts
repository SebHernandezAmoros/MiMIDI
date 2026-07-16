import { decodeAudioData } from "../../engine/audio/audioEngine"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"
import { createSampleDbId } from "./sampleIds"

export function createLegacyMicRecordingUseCaseDependencies() {
  return {
    createSampleId: createSampleDbId,
    decodeAudioData,
    now: () => new Date(),
    samples: {
      save: saveSampleBuffer,
    },
  }
}
