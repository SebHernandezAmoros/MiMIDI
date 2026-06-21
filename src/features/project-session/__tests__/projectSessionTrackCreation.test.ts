import { describe, expect, it } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { resolveTrackCreation } from "../projectSessionTrackCreation"

describe("project session track creation", () => {
  it("creates a melodic track and selects it", () => {
    const project = createDefaultProject()

    const result = resolveTrackCreation({ project, trackType: "melodic" })
    const nextTrack = getMidiTracks(result.project.timeline).at(-1)!

    expect(nextTrack.trackType).toBe("melodic")
    expect(nextTrack.name).toBe("Track 2")
    expect(result.activeTrackId).toBe(nextTrack.id)
    expect(result.createdTrackId).toBe(nextTrack.id)
    expect(result.message).toBe("Pista agregada: Track 2.")
  })

  it("creates a percussion track and selects it", () => {
    const project = createDefaultProject()

    const result = resolveTrackCreation({ project, trackType: "percussion" })
    const nextTrack = getMidiTracks(result.project.timeline).at(-1)!

    expect(nextTrack.trackType).toBe("percussion")
    expect(nextTrack.name).toBe("Pad 2")
    expect(result.activeTrackId).toBe(nextTrack.id)
    expect(result.createdTrackId).toBe(nextTrack.id)
    expect(result.message).toBe("Pista agregada: Pad 2.")
  })

  it("creates a steps track and selects it", () => {
    const project = createDefaultProject()

    const result = resolveTrackCreation({ project, trackType: "steps" })
    const nextTrack = getMidiTracks(result.project.timeline).at(-1)!

    expect(nextTrack.trackType).toBe("steps")
    expect(nextTrack.name).toBe("Steps 2")
    expect(result.activeTrackId).toBe(nextTrack.id)
    expect(result.createdTrackId).toBe(nextTrack.id)
    expect(result.message).toBe("Pista agregada: Steps 2.")
  })
})
