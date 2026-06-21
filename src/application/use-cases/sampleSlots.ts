import type {
  SampleSlotMeta,
  SampleSlotRepository,
} from "../ports/SampleSlotRepository"
import { createLegacySampleUseCaseDependencies } from "./legacySampleUseCaseDependencies"

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

export function loadSampleSlots(): (SampleSlotMeta | null)[] {
  return loadSampleSlotsWithRepository(
    createLegacySampleUseCaseDependencies().sampleSlots,
  )
}

export function saveSampleSlots(slots: (SampleSlotMeta | null)[]): void {
  saveSampleSlotsWithRepository(
    createLegacySampleUseCaseDependencies().sampleSlots,
    slots,
  )
}
