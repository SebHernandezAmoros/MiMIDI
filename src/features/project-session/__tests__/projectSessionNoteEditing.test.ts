import { describe, expect, it } from "vitest"
import {
  appendNoteToTrack,
  updateNoteInTrack,
} from "../../../domain/project/midiNoteMutations"
import { getMidiTrackNotes } from "../../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultProject } from "../../../engine/project/projectModel"
import {
  resolveRecordedNoteDuplication,
  resolveRecordedNoteRemoval,
  resolveRecordedNoteRevertToLastCommit,
  resolveRecordedNoteSafePatch,
  resolveRecordedNoteUpdateBlock,
} from "../projectSessionNoteEditing"

const recordedNote = {
  id: "note-1",
  note: "C4",
  startTime: 0,
  duration: 0.5,
  velocity: 0.9,
  instrumentId: "pure-sine",
} as const

describe("project session note editing", () => {
  it("removes a recorded note and clears the selected note when it was selected", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const projectWithNote = appendNoteToTrack(project, track.id, recordedNote)

    const result = resolveRecordedNoteRemoval({
      noteId: recordedNote.id,
      project: projectWithNote,
      selectedRecordedNoteId: recordedNote.id,
      trackId: track.id,
      trackName: track.name,
    })

    const nextTrack = getMidiTracks(result.project.timeline).find(
      (candidate) => candidate.id === track.id,
    )!
    expect(getMidiTrackNotes(nextTrack)).toEqual([])
    expect(result.selectedRecordedNoteId).toBeNull()
    expect(result.message).toBe(`Nota eliminada de ${track.name}.`)
  })

  it("keeps a different selected note when removing another note", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const projectWithNote = appendNoteToTrack(project, track.id, recordedNote)

    const result = resolveRecordedNoteRemoval({
      noteId: recordedNote.id,
      project: projectWithNote,
      selectedRecordedNoteId: "other-note",
      trackId: track.id,
      trackName: track.name,
    })

    expect(result.selectedRecordedNoteId).toBe("other-note")
    expect(result.message).toBe(`Nota eliminada de ${track.name}.`)
  })

  it("duplicates a recorded note using the snap step as offset", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const projectWithNote = appendNoteToTrack(project, track.id, recordedNote)

    const result = resolveRecordedNoteDuplication({
      noteId: recordedNote.id,
      offsetSeconds: 0.25,
      project: projectWithNote,
      trackId: track.id,
      trackName: track.name,
    })

    const nextTrack = getMidiTracks(result.project.timeline).find(
      (candidate) => candidate.id === track.id,
    )!
    const notes = getMidiTrackNotes(nextTrack)
    expect(notes).toHaveLength(2)
    expect(notes[0]).toMatchObject({
      note: recordedNote.note,
      startTime: recordedNote.startTime + 0.25,
    })
    expect(result.message).toBe(`Nota duplicada en ${track.name}.`)
  })

  it("duplicates a recorded note using the default unsnapped offset", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const projectWithNote = appendNoteToTrack(project, track.id, recordedNote)

    const result = resolveRecordedNoteDuplication({
      noteId: recordedNote.id,
      project: projectWithNote,
      trackId: track.id,
      trackName: track.name,
    })

    const nextTrack = getMidiTracks(result.project.timeline).find(
      (candidate) => candidate.id === track.id,
    )!
    expect(getMidiTrackNotes(nextTrack)[0]).toMatchObject({
      startTime: recordedNote.startTime + 0.05,
    })
  })

  it("blocks SMC pad duration updates and returns a message on commit", () => {
    expect(
      resolveRecordedNoteUpdateBlock({
        historyMode: "commit",
        isDurationUpdate: true,
        isSmcPadNote: true,
      }),
    ).toEqual({
      blocked: true,
      message: "Los golpes SMC Pad se pueden mover, pero no redimensionar.",
    })
  })

  it("blocks transient SMC pad duration updates without showing a message", () => {
    expect(
      resolveRecordedNoteUpdateBlock({
        historyMode: "transient",
        isDurationUpdate: true,
        isSmcPadNote: true,
      }),
    ).toEqual({
      blocked: true,
      message: null,
    })
  })

  it("allows SMC pad start-time updates", () => {
    expect(
      resolveRecordedNoteUpdateBlock({
        historyMode: "commit",
        isDurationUpdate: false,
        isSmcPadNote: true,
      }),
    ).toEqual({
      blocked: false,
      message: null,
    })
  })

  it("reverts a recorded note to its previous committed timing", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const committedProject = appendNoteToTrack(project, track.id, recordedNote)
    const editedProject = updateNoteInTrack(
      committedProject,
      track.id,
      recordedNote.id,
      { duration: 0.25, startTime: 1 },
    )
    const editedTrack = getMidiTracks(editedProject.timeline).find(
      (candidate) => candidate.id === track.id,
    )!
    const editedNote = getMidiTrackNotes(editedTrack).find(
      (note) => note.id === recordedNote.id,
    )!

    const result = resolveRecordedNoteRevertToLastCommit({
      currentNote: editedNote,
      project: editedProject,
      snapshots: [committedProject],
      trackId: track.id,
      trackName: track.name,
    })

    expect(result.applied).toBe(true)
    expect(result.message).toBe(`Nota revertida en ${track.name}.`)
    const nextTrack = getMidiTracks(result.project.timeline).find(
      (candidate) => candidate.id === track.id,
    )!
    expect(getMidiTrackNotes(nextTrack)[0]).toMatchObject({
      duration: recordedNote.duration,
      startTime: recordedNote.startTime,
    })
  })

  it("reports when there is no previous commit for a recorded note", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    const projectWithNote = appendNoteToTrack(project, track.id, recordedNote)

    const result = resolveRecordedNoteRevertToLastCommit({
      currentNote: recordedNote,
      project: projectWithNote,
      snapshots: [projectWithNote],
      trackId: track.id,
      trackName: track.name,
    })

    expect(result.applied).toBe(false)
    expect(result.message).toBe("No hay un commit anterior para esta nota.")
    expect(result.project).toBe(projectWithNote)
  })

  it("snaps and clamps recorded note patch values", () => {
    expect(
      resolveRecordedNoteSafePatch({
        patch: { duration: 0.13, startTime: -0.12 },
        timelineSnapEnabled: true,
        timelineSnapStep: 0.25,
      }),
    ).toEqual({
      duration: 0.25,
      startTime: 0,
    })
  })

  it("keeps unsnapped recorded note patch values with safety clamps", () => {
    expect(
      resolveRecordedNoteSafePatch({
        patch: { duration: -1, startTime: 0.33 },
        timelineSnapEnabled: false,
        timelineSnapStep: 0.25,
      }),
    ).toEqual({
      duration: 0.01,
      startTime: 0.33,
    })
  })

  it("keeps omitted recorded note patch fields omitted", () => {
    expect(
      resolveRecordedNoteSafePatch({
        patch: { duration: 0.4 },
        timelineSnapEnabled: false,
        timelineSnapStep: 0.25,
      }),
    ).toEqual({
      duration: 0.4,
    })
  })
})
