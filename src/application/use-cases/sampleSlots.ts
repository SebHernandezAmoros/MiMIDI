import type {
  SampleSlotMeta,
  SampleSlotRepository,
} from "../ports/SampleSlotRepository"
import { NUM_SAMPLE_SLOTS } from "../ports/SampleSlotRepository"
import type { SampleRepository } from "../ports/SampleRepository"
import { createLegacySampleSlotCleanupDependencies } from "./legacySampleSlotCleanupUseCaseDependencies"
import { createLegacySampleSlotLoadUseCaseDependencies } from "./legacySampleSlotLoadUseCaseDependencies"
import { createLegacySampleSlotSaveUseCaseDependencies } from "./legacySampleSlotSaveUseCaseDependencies"

export function loadSampleSlotsWithRepository(
  sampleSlots: Pick<SampleSlotRepository, "loadSlots">,
): (SampleSlotMeta | null)[] {
  return sampleSlots.loadSlots()
}

export function saveSampleSlotsWithRepository(
  sampleSlots: Pick<SampleSlotRepository, "saveSlots">,
  slots: (SampleSlotMeta | null)[],
): void {
  sampleSlots.saveSlots(slots)
}

export async function clearSampleSlotsWithRepositories({
  sampleSlots,
  samples,
}: {
  sampleSlots: SampleSlotRepository
  samples: Pick<SampleRepository, "delete">
}): Promise<void> {
  const slots = sampleSlots.loadSlots()
  for (const slot of slots) {
    if (slot) await samples.delete(slot.dbId)
  }
  sampleSlots.saveSlots(Array<null>(NUM_SAMPLE_SLOTS).fill(null))
}

export function loadSampleSlots(): (SampleSlotMeta | null)[] {
  return loadSampleSlotsWithRepository(
    createLegacySampleSlotLoadUseCaseDependencies().sampleSlots,
  )
}

export function saveSampleSlots(slots: (SampleSlotMeta | null)[]): void {
  saveSampleSlotsWithRepository(
    createLegacySampleSlotSaveUseCaseDependencies().sampleSlots,
    slots,
  )
}

export async function clearSampleSlots(): Promise<void> {
  const dependencies = createLegacySampleSlotCleanupDependencies()
  await clearSampleSlotsWithRepositories({
    sampleSlots: dependencies.sampleSlots,
    samples: dependencies.samples,
  })
}
