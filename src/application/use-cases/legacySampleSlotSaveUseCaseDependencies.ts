import { saveSlotMetas } from "../../engine/audio/sampleModel"

export function createLegacySampleSlotSaveUseCaseDependencies() {
  return {
    sampleSlots: {
      saveSlots: saveSlotMetas,
    },
  }
}
