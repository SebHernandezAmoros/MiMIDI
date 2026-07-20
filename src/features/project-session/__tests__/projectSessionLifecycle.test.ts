import { describe, expect, it } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { getMidiTrackNotes } from "../../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import {
  createDefaultProject,
  resetProject,
} from "../../../engine/project/projectModel"
import {
  resolveProjectSessionClear,
  resolveProjectSessionRestart,
} from "../projectSessionLifecycle"

describe("project session lifecycle", () => {
  it("clears recorded notes while preserving the project structure", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const projectWithNote = appendNoteToTrack(project, track.id, {
      id: "note-1",
      note: "C4",
      startTime: 0,
      duration: 0.5,
      velocity: 0.9,
      instrumentId: "pure-sine",
    })

    const resolution = resolveProjectSessionClear()
    const clearedProject = resolution.updateProject(projectWithNote)
    const clearedTrack = getMidiTracks(clearedProject.timeline).find(
      (candidate) => candidate.id === track.id,
    )!

    expect(getMidiTrackNotes(clearedTrack)).toEqual([])
    expect(clearedProject.id).toBe(project.id)
    expect(clearedProject.name).toBe(project.name)
    expect(clearedProject.timeline).toHaveLength(project.timeline.length)
    expect(resolution.selectedRecordedNoteId).toBeNull()
    expect(resolution.message).toBe(
      "Notas limpiadas. Pistas y nombre conservados.",
    )
  })

  it("restarts the project while preserving its identity", () => {
    const project = {
      ...createDefaultProject(),
      id: "project-kept",
      name: "Proyecto editado",
    }

    const resolution = resolveProjectSessionRestart({ resetProject })
    const restartedProject = resolution.updateProject(project)

    expect(restartedProject.id).toBe(project.id)
    expect(restartedProject.name).toBe("MiMIDI Project")
    expect(getMidiTracks(restartedProject.timeline).map((track) => track.trackType))
      .toEqual(["melodic", "percussion", "percussion", "steps"])
    expect(resolution.activeTrackId).toBe("track-1")
    expect(resolution.selectedRecordedNoteId).toBeNull()
    expect(resolution.message).toBe("Proyecto reiniciado desde cero.")
  })
})
