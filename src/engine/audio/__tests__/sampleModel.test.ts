import { beforeEach, describe, expect, it } from "vitest"
import {
  DEFAULT_CALIBRATION,
  loadSlotMetas,
  NUM_SLOTS,
  saveSlotMetas,
  type SampleSlotMeta,
} from "../sampleModel"
import { SAMPLE_SLOT_STORAGE_KEY } from "../../../infrastructure/storage/localStorageSampleSlotRepository"

describe("sampleModel slot metadata", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns empty slots when no metadata is stored", () => {
    expect(loadSlotMetas()).toEqual(Array<null>(NUM_SLOTS).fill(null))
  })

  it("saves and loads slot metadata through localStorage", () => {
    const slots: (SampleSlotMeta | null)[] = Array<null>(NUM_SLOTS).fill(null)
    slots[1] = {
      calibration: {
        ...DEFAULT_CALIBRATION,
        gain: 1.25,
      },
      channels: 2,
      dbId: "sample-kick",
      duration: 1.5,
      index: 1,
      name: "Kick",
      sampleRate: 48000,
    }

    saveSlotMetas(slots)

    expect(window.localStorage.getItem(SAMPLE_SLOT_STORAGE_KEY)).toBe(
      JSON.stringify(slots),
    )
    expect(loadSlotMetas()[1]).toEqual(slots[1])
  })

  it("normalizes legacy slot metadata with missing sample details", () => {
    window.localStorage.setItem(
      SAMPLE_SLOT_STORAGE_KEY,
      JSON.stringify([
        {
          dbId: "legacy-sample",
          duration: 2,
          index: 0,
          name: "Legacy",
        },
      ]),
    )

    expect(loadSlotMetas()[0]).toEqual({
      calibration: DEFAULT_CALIBRATION,
      channels: 1,
      dbId: "legacy-sample",
      duration: 2,
      index: 0,
      name: "Legacy",
      sampleRate: 44100,
    })
  })

  it("returns null for invalid slot entries", () => {
    window.localStorage.setItem(
      SAMPLE_SLOT_STORAGE_KEY,
      JSON.stringify([
        {
          duration: 2,
          index: 0,
          name: "Missing dbId",
        },
      ]),
    )

    expect(loadSlotMetas()[0]).toBeNull()
  })

  it("returns empty slots when stored JSON is invalid", () => {
    window.localStorage.setItem(SAMPLE_SLOT_STORAGE_KEY, "{bad-json")

    expect(loadSlotMetas()).toEqual(Array<null>(NUM_SLOTS).fill(null))
  })
})
