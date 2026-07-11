import { describe, expect, it } from "vitest"

import {
  getTrackLaneDefinition,
  trackLaneDefinitions,
} from "../trackLaneDefinitions"

describe("trackLaneDefinitions", () => {
  it("registers one lane definition per supported track kind", () => {
    expect(trackLaneDefinitions.map((definition) => definition.kind)).toEqual([
      "midi",
      "sampler",
      "audio-clip",
    ])
  })

  it("resolves lane definitions by view model kind", () => {
    expect(getTrackLaneDefinition({ kind: "midi" }).role).toBe("notes")
    expect(getTrackLaneDefinition({ kind: "sampler" }).role).toBe("pattern")
    expect(getTrackLaneDefinition({ kind: "audio-clip" }).role).toBe("audio")
  })
})
