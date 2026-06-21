import type { SampleRepository } from "../ports/SampleRepository"
import { createLegacySampleUseCaseDependencies } from "./legacySampleUseCaseDependencies"

export async function deleteSampleSlotWithRepository(
  samples: SampleRepository,
  dbId: string,
): Promise<void> {
  await samples.delete(dbId)
}

export async function deleteSampleSlot(dbId: string): Promise<void> {
  await deleteSampleSlotWithRepository(
    createLegacySampleUseCaseDependencies().samples,
    dbId,
  )
}
