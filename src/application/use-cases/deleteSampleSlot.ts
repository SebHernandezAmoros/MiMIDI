import type { SampleRepository } from "../ports/SampleRepository"
import { createLegacySampleDeleteUseCaseDependencies } from "./legacySampleDeleteUseCaseDependencies"

export async function deleteSampleSlotWithRepository(
  samples: Pick<SampleRepository, "delete">,
  dbId: string,
): Promise<void> {
  await samples.delete(dbId)
}

export async function deleteSampleSlot(dbId: string): Promise<void> {
  await deleteSampleSlotWithRepository(
    createLegacySampleDeleteUseCaseDependencies().samples,
    dbId,
  )
}
