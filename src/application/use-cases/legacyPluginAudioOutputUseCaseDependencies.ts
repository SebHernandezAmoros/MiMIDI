import { decodeAudioData } from "../../engine/audio/audioEngine"
import { loadSlotMetas, saveSlotMetas } from "../../engine/audio/sampleModel"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"

export function createLegacyPluginAudioOutputUseCaseDependencies() {
  return {
    decodeAudioData,
    sampleSlots: {
      loadSlots: loadSlotMetas,
      saveSlots: saveSlotMetas,
    },
    samples: {
      save: saveSampleBuffer,
    },
  }
}
