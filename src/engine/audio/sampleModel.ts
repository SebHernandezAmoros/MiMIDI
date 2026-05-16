import type { AudioCalibration } from "./audioEngine"

export const NUM_SLOTS = 8
const SLOT_STORAGE_KEY = "mimidi-audio-slots"

export const DEFAULT_CALIBRATION: AudioCalibration = {
  trimStart: 0,
  trimEnd: 1,
  gain: 1,
  fadeIn: 0,
  fadeOut: 0,
  tune: 0,
}

export type SampleSlotMeta = {
  index: number
  name: string
  duration: number
  dbId: string
  sampleRate: number
  channels: number
  calibration: AudioCalibration
}

export function loadSlotMetas(): (SampleSlotMeta | null)[] {
  try {
    const raw = localStorage.getItem(SLOT_STORAGE_KEY)
    if (!raw) return Array<null>(NUM_SLOTS).fill(null)
    const parsed = JSON.parse(raw) as unknown[]
    return Array.from({ length: NUM_SLOTS }, (_, i) => {
      const item = parsed[i]
      if (!item || typeof item !== "object") return null
      const m = item as Record<string, unknown>
      if (
        typeof m.index !== "number" ||
        typeof m.name !== "string" ||
        typeof m.duration !== "number" ||
        typeof m.dbId !== "string"
      ) return null
      const cal =
        m.calibration && typeof m.calibration === "object"
          ? { ...DEFAULT_CALIBRATION, ...(m.calibration as Partial<AudioCalibration>) }
          : { ...DEFAULT_CALIBRATION }
      return {
        index: m.index,
        name: m.name,
        duration: m.duration,
        dbId: m.dbId,
        sampleRate: typeof m.sampleRate === "number" ? m.sampleRate : 44100,
        channels: typeof m.channels === "number" ? m.channels : 1,
        calibration: cal,
      }
    })
  } catch {
    return Array<null>(NUM_SLOTS).fill(null)
  }
}

export function saveSlotMetas(slots: (SampleSlotMeta | null)[]): void {
  localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slots))
}
