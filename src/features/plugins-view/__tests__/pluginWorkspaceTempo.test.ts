import { describe, expect, it } from "vitest"
import { createDefaultProjectWithPluginStates } from "../../../domain/project/projectDefaults"
import type { SamplerTrack } from "../../../domain/project/projectTypes"
import { getPluginWorkspaceBpm } from "../pluginWorkspaceTempo"

describe("getPluginWorkspaceBpm", () => {
  it("uses the first sampler track BPM", () => {
    const project = createDefaultProjectWithPluginStates({})
    const samplerTrack: SamplerTrack = {
      kind: "sampler",
      clips: [],
      id: "sampler-1",
      muted: false,
      name: "Beat",
      pattern: {
        bpm: 96,
        stepsPerBar: 16,
        lanes: [],
      },
    }

    expect(
      getPluginWorkspaceBpm([...project.timeline, samplerTrack]),
    ).toBe(96)
  })

  it("falls back to 120 when the project has no sampler track", () => {
    const project = createDefaultProjectWithPluginStates({})

    expect(getPluginWorkspaceBpm(project.timeline)).toBe(120)
  })
})
