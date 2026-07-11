import { describe, expect, it } from "vitest"

import {
  getTrackScheduler,
  trackSchedulers,
} from "../trackSchedulers"
import { audioClipTrackScheduler } from "../audioClipTrackScheduler"
import { scheduleAudioClipTrackWithDependencies } from "../audioClipTrackScheduler"
import {
  getMidiTrackScheduledNotes,
  midiTrackScheduler,
} from "../midiTrackScheduler"
import {
  samplerTrackScheduler,
  scheduleSamplerTrackWithDependencies,
} from "../samplerTrackScheduler"

describe("trackSchedulers", () => {
  it("registers the current track schedulers by kind", () => {
    expect(trackSchedulers).toEqual([
      midiTrackScheduler,
      samplerTrackScheduler,
      audioClipTrackScheduler,
    ])
  })

  it("resolves a scheduler from a track kind", () => {
    expect(getTrackScheduler({ kind: "midi" })).toBe(midiTrackScheduler)
    expect(getTrackScheduler({ kind: "sampler" })).toBe(samplerTrackScheduler)
    expect(getTrackScheduler({ kind: "audio-clip" })).toBe(
      audioClipTrackScheduler,
    )
  })

  it("exposes MIDI scheduled note resolution through the registry", () => {
    const scheduler = getTrackScheduler({ kind: "midi" })

    expect(scheduler.kind).toBe("midi")
    if (scheduler.kind !== "midi") {
      throw new Error("Expected MIDI scheduler")
    }
    expect(scheduler.getScheduledNotes).toBe(getMidiTrackScheduledNotes)
  })

  it("exposes audio clip scheduling through the registry", () => {
    const scheduler = getTrackScheduler({ kind: "audio-clip" })

    expect(scheduler.kind).toBe("audio-clip")
    if (scheduler.kind !== "audio-clip") {
      throw new Error("Expected audio clip scheduler")
    }
    expect(scheduler.schedule).toBe(scheduleAudioClipTrackWithDependencies)
  })

  it("exposes sampler scheduling through the registry", () => {
    const scheduler = getTrackScheduler({ kind: "sampler" })

    expect(scheduler.kind).toBe("sampler")
    if (scheduler.kind !== "sampler") {
      throw new Error("Expected sampler scheduler")
    }
    expect(scheduler.schedule).toBe(scheduleSamplerTrackWithDependencies)
  })
})
