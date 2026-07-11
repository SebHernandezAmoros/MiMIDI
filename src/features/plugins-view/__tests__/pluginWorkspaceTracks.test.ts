import { describe, expect, it } from "vitest"
import { createDefaultProjectWithPluginStates } from "../../../domain/project/projectDefaults"
import { getPluginWorkspaceTracks } from "../pluginWorkspaceTracks"

describe("getPluginWorkspaceTracks", () => {
  it("projects melodic and percussion tracks to the plugin host DTO", () => {
    const project = createDefaultProjectWithPluginStates({})

    expect(getPluginWorkspaceTracks(project.timeline)).toEqual([
      {
        id: "track-1",
        name: "Track 1",
        type: "melodic",
      },
      {
        id: "track-2",
        name: "Pad 1",
        type: "percussion",
      },
    ])
  })

  it("excludes steps tracks from the plugin workspace contract", () => {
    const project = createDefaultProjectWithPluginStates({})
    const stepsOnly = project.timeline.filter(
      (track) => track.kind === "midi" && track.trackType === "steps",
    )

    expect(getPluginWorkspaceTracks(stepsOnly)).toEqual([])
  })
})
