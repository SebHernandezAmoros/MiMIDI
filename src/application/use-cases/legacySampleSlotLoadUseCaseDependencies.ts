import { loadSlotMetas } from "../../engine/audio/sampleModel"

export function createLegacySampleSlotLoadUseCaseDependencies() {
  return {
    sampleSlots: {
      loadSlots: loadSlotMetas,
    },
  }
}
