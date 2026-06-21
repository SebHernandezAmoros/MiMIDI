import type {
  SampleCalibration,
  SampleSlotMeta,
  SampleSlotRepository,
} from "../../application/ports/SampleSlotRepository"
import {
  DEFAULT_SAMPLE_CALIBRATION,
  NUM_SAMPLE_SLOTS,
} from "../../application/ports/SampleSlotRepository"

export const SAMPLE_SLOT_STORAGE_KEY = "mimidi-audio-slots"

function emptySlots(): (SampleSlotMeta | null)[] {
  return Array<null>(NUM_SAMPLE_SLOTS).fill(null)
}

function normalizeSlotMeta(item: unknown): SampleSlotMeta | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const meta = item as Record<string, unknown>

  if (
    typeof meta.index !== "number" ||
    typeof meta.name !== "string" ||
    typeof meta.duration !== "number" ||
    typeof meta.dbId !== "string"
  ) {
    return null
  }

  const calibration =
    meta.calibration && typeof meta.calibration === "object"
      ? {
          ...DEFAULT_SAMPLE_CALIBRATION,
          ...(meta.calibration as Partial<SampleCalibration>),
        }
      : { ...DEFAULT_SAMPLE_CALIBRATION }

  return {
    index: meta.index,
    name: meta.name,
    duration: meta.duration,
    dbId: meta.dbId,
    sampleRate: typeof meta.sampleRate === "number" ? meta.sampleRate : 44100,
    channels: typeof meta.channels === "number" ? meta.channels : 1,
    calibration,
  }
}

export function createLocalStorageSampleSlotRepository(
  storage: Storage,
): SampleSlotRepository {
  return {
    loadSlots() {
      try {
        const raw = storage.getItem(SAMPLE_SLOT_STORAGE_KEY)

        if (!raw) {
          return emptySlots()
        }

        const parsed = JSON.parse(raw) as unknown[]

        return Array.from({ length: NUM_SAMPLE_SLOTS }, (_, index) =>
          normalizeSlotMeta(parsed[index]),
        )
      } catch {
        return emptySlots()
      }
    },
    saveSlots(slots) {
      storage.setItem(SAMPLE_SLOT_STORAGE_KEY, JSON.stringify(slots))
    },
  }
}
