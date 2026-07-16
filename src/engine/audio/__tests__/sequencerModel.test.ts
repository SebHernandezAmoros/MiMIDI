import { beforeEach, describe, expect, it } from "vitest"
import {
  createDefaultPattern,
  loadSeqPattern,
  saveSeqPattern,
  SEQ_PATTERN_STORAGE_KEY,
  syncPatternLanes,
  type SequencerPattern,
} from "../sequencerModel"

describe("sequencerModel pattern persistence", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns a default pattern when no pattern is stored", () => {
    expect(loadSeqPattern()).toEqual(createDefaultPattern())
  })

  it("saves and loads the sequencer pattern through settings storage", () => {
    const pattern: SequencerPattern = {
      bpm: 96,
      lanes: [
        {
          slotDbId: "sample-kick",
          steps: [{ active: true }, { active: false }],
        },
      ],
      stepsPerBar: 2,
    }

    saveSeqPattern(pattern)

    expect(window.localStorage.getItem(SEQ_PATTERN_STORAGE_KEY)).toBe(
      JSON.stringify(pattern),
    )
    expect(loadSeqPattern()).toEqual(pattern)
  })

  it("falls back to a default pattern when stored JSON is invalid", () => {
    window.localStorage.setItem(SEQ_PATTERN_STORAGE_KEY, "{bad-json")

    expect(loadSeqPattern()).toEqual(createDefaultPattern())
  })
})

describe("sequencerModel lane sync", () => {
  it("syncs lanes from sample-like slots using only dbId", () => {
    const pattern: SequencerPattern = {
      bpm: 120,
      lanes: [
        {
          slotDbId: "kick",
          steps: [{ active: true }, { active: false }],
        },
      ],
      stepsPerBar: 2,
    }

    expect(syncPatternLanes(pattern, [{ dbId: "kick" }, null, { dbId: "snare" }]))
      .toEqual({
        ...pattern,
        lanes: [
          {
            slotDbId: "kick",
            steps: [{ active: true }, { active: false }],
          },
          {
            slotDbId: "snare",
            steps: [{ active: false }, { active: false }],
          },
        ],
      })
  })
})
