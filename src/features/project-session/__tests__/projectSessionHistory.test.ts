import { describe, expect, it } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import {
  createDefaultProject,
  removeTrack,
} from "../../../engine/project/projectModel"
import {
  resolveRedoProjectHistoryAction,
  resolveUndoProjectHistoryAction,
} from "../projectSessionHistory"

describe("project session history", () => {
  it("resolves unavailable undo actions", () => {
    expect(resolveUndoProjectHistoryAction(null, "track-1")).toEqual({
      applied: false,
      message: "No hay cambios anteriores para deshacer.",
    })
  })

  it("resolves applied undo actions preserving the active track when possible", () => {
    const project = createDefaultProject()
    const activeTrackId = getMidiTracks(project.timeline)[1]?.id ?? "track-1"

    expect(resolveUndoProjectHistoryAction(project, activeTrackId)).toEqual({
      activeTrackId,
      applied: true,
      message: "Deshacer aplicado.",
      project,
    })
  })

  it("resolves applied undo actions with a safe fallback track", () => {
    const project = createDefaultProject()
    const firstTrackId = getMidiTracks(project.timeline)[0]?.id ?? "track-1"

    expect(resolveUndoProjectHistoryAction(project, "missing-track")).toEqual({
      activeTrackId: firstTrackId,
      applied: true,
      message: "Deshacer aplicado.",
      project,
    })
  })

  it("resolves unavailable redo actions", () => {
    expect(resolveRedoProjectHistoryAction(undefined, "track-1")).toEqual({
      applied: false,
      message: "No hay cambios posteriores para rehacer.",
    })
  })

  it("resolves applied redo actions with the same selection fallback semantics", () => {
    const project = createDefaultProject()
    const currentTrackId = getMidiTracks(project.timeline)[0]?.id ?? "track-1"
    const projectWithoutCurrentTrack = removeTrack(project, currentTrackId)
    const fallbackTrackId =
      getMidiTracks(projectWithoutCurrentTrack.timeline)[0]?.id ?? "track-1"

    expect(
      resolveRedoProjectHistoryAction(projectWithoutCurrentTrack, currentTrackId),
    ).toEqual({
      activeTrackId: fallbackTrackId,
      applied: true,
      message: "Rehacer aplicado.",
      project: projectWithoutCurrentTrack,
    })
  })
})
