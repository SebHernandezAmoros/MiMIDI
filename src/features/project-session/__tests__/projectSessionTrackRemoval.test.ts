import { describe, expect, it } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import {
  createDefaultProject,
  createProjectTrack,
} from "../../../engine/project/projectModel"
import {
  resolveActiveTrackRemoval,
  resolveStepsTrackRemoval,
} from "../projectSessionTrackRemoval"

describe("project session track removal", () => {
  it("returns null when there are no midi tracks to remove", () => {
    const project = { ...createDefaultProject(), timeline: [] }

    expect(resolveActiveTrackRemoval({ project, activeTrackId: "track-1" })).toBeNull()
  })

  it("removes a regular track and selects a neighboring fallback", () => {
    const project = createDefaultProject()
    const tracks = getMidiTracks(project.timeline)
    const activeTrack = tracks[2]
    const fallbackTrack = tracks[1]

    const result = resolveActiveTrackRemoval({
      project,
      activeTrackId: activeTrack.id,
    })

    expect(result).not.toBeNull()
    expect(result?.activeTrackId).toBe(fallbackTrack.id)
    expect(result?.message).toBe(`Pista eliminada: ${activeTrack.name}.`)
    expect(
      getMidiTracks(result?.project.timeline ?? []).some(
        (track) => track.id === activeTrack.id,
      ),
    ).toBe(false)
  })

  it("replaces the last percussion track with a fresh pad and selects it", () => {
    const project = createDefaultProject()
    const tracks = getMidiTracks(project.timeline)
    const activeTrack = tracks.find((track) => track.trackType === "percussion")!

    const result = resolveActiveTrackRemoval({
      project,
      activeTrackId: activeTrack.id,
    })

    expect(result).not.toBeNull()
    expect(result?.activeTrackId).toBe(`track-${tracks.length}`)
    expect(result?.message).toBe(
      `${activeTrack.name} eliminada. Pad 1 listo para usar.`,
    )
    expect(
      getMidiTracks(result?.project.timeline ?? []).some(
        (track) => track.trackType === "percussion",
      ),
    ).toBe(true)
  })

  it("replaces the last midi track with an empty melodic track", () => {
    const onlyTrack = createProjectTrack(7, "melodic")
    const project = {
      ...createDefaultProject(),
      timeline: [onlyTrack],
    }

    const result = resolveActiveTrackRemoval({
      project,
      activeTrackId: onlyTrack.id,
    })

    expect(result).not.toBeNull()
    expect(result?.activeTrackId).toBe("track-1")
    expect(result?.message).toBe(
      `${onlyTrack.name} eliminada. Pista vacia lista para grabar.`,
    )
    expect(getMidiTracks(result?.project.timeline ?? [])).toMatchObject([
      {
        id: "track-1",
        trackType: "melodic",
      },
    ])
  })

  it("removes an existing steps track and keeps the current selection unchanged", () => {
    const project = createDefaultProject()
    const stepsTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "steps",
    )!

    const result = resolveStepsTrackRemoval({
      project,
      trackId: stepsTrack.id,
    })

    expect(result).not.toBeNull()
    expect(result?.message).toBe(`Pista eliminada: ${stepsTrack.name}.`)
    expect(
      getMidiTracks(result?.project.timeline ?? []).some(
        (track) => track.id === stepsTrack.id,
      ),
    ).toBe(false)
  })

  it("returns null when the steps track to remove does not exist", () => {
    const project = createDefaultProject()

    expect(
      resolveStepsTrackRemoval({
        project,
        trackId: "missing-track",
      }),
    ).toBeNull()
  })
})
