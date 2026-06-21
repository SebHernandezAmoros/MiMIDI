import { createLocalStorageSampleSlotRepository } from "../../infrastructure/storage/localStorageSampleSlotRepository"
import {
  DEFAULT_SAMPLE_CALIBRATION,
  NUM_SAMPLE_SLOTS,
} from "../../application/ports/SampleSlotRepository"
import type { SampleSlotMeta } from "../../application/ports/SampleSlotRepository"

export const NUM_SLOTS = NUM_SAMPLE_SLOTS
export const DEFAULT_CALIBRATION = DEFAULT_SAMPLE_CALIBRATION
export type { SampleSlotMeta }

export function loadSlotMetas(): (SampleSlotMeta | null)[] {
  return createLocalStorageSampleSlotRepository(localStorage).loadSlots()
}

export function saveSlotMetas(slots: (SampleSlotMeta | null)[]): void {
  createLocalStorageSampleSlotRepository(localStorage).saveSlots(slots)
}
