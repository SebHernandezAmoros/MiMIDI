import { describe, expect, it } from "vitest"
import {
  appendNoteToTrack,
  createDefaultProject,
  createProjectTrack,
  getMidiTracks,
} from "../../../engine/project/projectModel"
import {
  resolveInitialActiveTrackId,
  resolveFirstProjectActiveTrackId,
  resolveProjectChangeActiveTrackId,
  resolvePrimaryTrack,
  resolveSelectedRecordedNote,
} from "../projectSelection"

describe("project selection use-cases", () => {
  it("selects the first percussion track for sampler mode", () => {
    const project = createDefaultProject()
    const percussionTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "percussion",
    )

    expect(resolveInitialActiveTrackId(project, "sampler-only")).toBe(
      percussionTrack?.id,
    )
  })

  it("selects the first melodic track outside sampler mode", () => {
    const project = createDefaultProject()
    const melodicTrack = getMidiTracks(project.timeline).find(
      (track) => track.trackType === "melodic",
    )

    expect(resolveInitialActiveTrackId(project, "perform-only")).toBe(
      melodicTrack?.id,
    )
  })

  it("falls back to track-1 when the project has no midi tracks", () => {
    const project = { ...createDefaultProject(), timeline: [] }

    expect(resolveInitialActiveTrackId(project, "full")).toBe("track-1")
  })

  it("resolves sampler mode primary track from percussion tracks", () => {
    const project = createDefaultProject()
    const midiTracks = getMidiTracks(project.timeline)
    const melodicTracks = midiTracks.filter((track) => track.trackType === "melodic")
    const percussionTracks = midiTracks.filter((track) => track.trackType === "percussion")
    const emptyTrack = createProjectTrack(99)

    const result = resolvePrimaryTrack({
      activeTrackId: "missing-track",
      emptyTrack,
      melodicTracks,
      midiTracks,
      mode: "sampler-only",
      percussionTracks,
    })

    expect(result).toBe(percussionTracks[0])
  })

  it("resolves perform mode primary track from melodic tracks", () => {
    const project = createDefaultProject()
    const midiTracks = getMidiTracks(project.timeline)
    const melodicTracks = midiTracks.filter((track) => track.trackType === "melodic")
    const percussionTracks = midiTracks.filter((track) => track.trackType === "percussion")
    const emptyTrack = createProjectTrack(99)

    const result = resolvePrimaryTrack({
      activeTrackId: "missing-track",
      emptyTrack,
      melodicTracks,
      midiTracks,
      mode: "perform-only",
      percussionTracks,
    })

    expect(result).toBe(melodicTracks[0])
  })

  it("resolves standard modes from the active midi track first", () => {
    const project = createDefaultProject()
    const midiTracks = getMidiTracks(project.timeline)
    const melodicTracks = midiTracks.filter((track) => track.trackType === "melodic")
    const percussionTracks = midiTracks.filter((track) => track.trackType === "percussion")
    const emptyTrack = createProjectTrack(99)

    const result = resolvePrimaryTrack({
      activeTrackId: percussionTracks[0].id,
      emptyTrack,
      melodicTracks,
      midiTracks,
      mode: "full",
      percussionTracks,
    })

    expect(result).toBe(percussionTracks[0])
  })

  it("returns the empty track when no primary track can be resolved", () => {
    const emptyTrack = createProjectTrack(99)

    const result = resolvePrimaryTrack({
      activeTrackId: "missing-track",
      emptyTrack,
      melodicTracks: [],
      midiTracks: [],
      mode: "full",
      percussionTracks: [],
    })

    expect(result).toBe(emptyTrack)
  })

  it("resolves the selected recorded note by id", () => {
    const project = createDefaultProject()
    const trackId = getMidiTracks(project.timeline)[0].id
    const projectWithNote = appendNoteToTrack(project, trackId, {
      duration: 0.5,
      id: "selected-note",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 0,
      velocity: 0.8,
    })
    const track = getMidiTracks(projectWithNote.timeline)[0]

    expect(resolveSelectedRecordedNote(track, "selected-note")?.id).toBe(
      "selected-note",
    )
    expect(resolveSelectedRecordedNote(track, "missing-note")).toBeNull()
  })

  it("keeps the active track after a project change when it still exists", () => {
    const project = createDefaultProject()
    const activeTrackId = getMidiTracks(project.timeline)[1].id

    expect(resolveProjectChangeActiveTrackId(project, activeTrackId)).toBe(
      activeTrackId,
    )
  })

  it("falls back to the first midi track after a project change", () => {
    const project = createDefaultProject()
    const firstTrackId = getMidiTracks(project.timeline)[0].id

    expect(resolveProjectChangeActiveTrackId(project, "missing-track")).toBe(
      firstTrackId,
    )
  })

  it("falls back to track-1 after a project change with no midi tracks", () => {
    const project = { ...createDefaultProject(), timeline: [] }

    expect(resolveProjectChangeActiveTrackId(project, "missing-track")).toBe(
      "track-1",
    )
  })

  it("resolves the first active track for imported projects", () => {
    const project = createDefaultProject()
    const firstTrackId = getMidiTracks(project.timeline)[0].id

    expect(resolveFirstProjectActiveTrackId(project)).toBe(firstTrackId)
  })

  it("falls back to track-1 for imported projects without midi tracks", () => {
    const project = { ...createDefaultProject(), timeline: [] }

    expect(resolveFirstProjectActiveTrackId(project)).toBe("track-1")
  })
})
