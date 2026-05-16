import { deleteSampleBuffer } from "../../engine/audio/sampleStorage"

export async function deleteSampleSlot(dbId: string): Promise<void> {
  await deleteSampleBuffer(dbId)
}
