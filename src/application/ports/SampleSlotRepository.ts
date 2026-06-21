export type SampleCalibration = {
  trimStart: number
  trimEnd: number
  gain: number
  fadeIn: number
  fadeOut: number
  tune: number
}

export const DEFAULT_SAMPLE_CALIBRATION: SampleCalibration = {
  trimStart: 0,
  trimEnd: 1,
  gain: 1,
  fadeIn: 0,
  fadeOut: 0,
  tune: 0,
}

export const NUM_SAMPLE_SLOTS = 8

export type SampleSlotMeta = {
  index: number
  name: string
  duration: number
  dbId: string
  sampleRate: number
  channels: number
  calibration: SampleCalibration
}

export type SampleSlotRepository = {
  loadSlots(): (SampleSlotMeta | null)[]
  saveSlots(slots: (SampleSlotMeta | null)[]): void
}
