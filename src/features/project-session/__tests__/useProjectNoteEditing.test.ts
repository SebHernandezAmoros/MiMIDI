import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { getMidiTrackNotes } from "../../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectNoteEditing } from "../useProjectNoteEditing"

const recordedNote = {
  id: "note-1",
  note: "C4",
  startTime: 0,
  duration: 0.5,
  velocity: 0.9,
  instrumentId: "pure-sine",
} as const

function createFixture() {
  const initialProject = createDefaultProject()
  const primaryTrack = getMidiTracks(initialProject.timeline)[0]
  let currentProject = appendNoteToTrack(
    initialProject,
    primaryTrack.id,
    recordedNote,
  )
  const applyUpdate = vi.fn((updater: (project: MusicalProject) => MusicalProject) => {
    currentProject = updater(currentProject)
  })
  const applyTransientUpdate = vi.fn()
  const commitTransientUpdate = vi.fn()
  const setProjectMessage = vi.fn()
  const setSelectedRecordedNoteId = vi.fn()

  return {
    applyTransientUpdate,
    applyUpdate,
    commitTransientUpdate,
    getCurrentProject: () => currentProject,
    options: {
      applyTransientUpdate,
      applyUpdate,
      commitTransientUpdate,
      primaryTrack,
      primaryTrackNotes: getMidiTrackNotes(primaryTrack).concat(recordedNote),
      project: currentProject,
      selectedRecordedNote: recordedNote,
      selectedRecordedNoteId: recordedNote.id,
      setProjectMessage,
      setSelectedRecordedNoteId,
      timelineSnapEnabled: true,
      timelineSnapStep: 0.25,
      undoStack: [currentProject],
    },
    setProjectMessage,
    setSelectedRecordedNoteId,
  }
}

describe("useProjectNoteEditing", () => {
  it("coordinates removal, selection and feedback through the session facade", () => {
    const fixture = createFixture()
    const { result } = renderHook(() => useProjectNoteEditing(fixture.options))

    act(() => result.current.removeRecordedNote(recordedNote.id))

    const nextTrack = getMidiTracks(fixture.getCurrentProject().timeline).find(
      (track) => track.id === fixture.options.primaryTrack.id,
    )!
    expect(getMidiTrackNotes(nextTrack)).toEqual([])
    expect(fixture.setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
    expect(fixture.setProjectMessage).toHaveBeenCalledWith(
      `Nota eliminada de ${fixture.options.primaryTrack.name}.`,
    )
  })

  it("routes transient and committed timing updates through project history", () => {
    const fixture = createFixture()
    const { result } = renderHook(() => useProjectNoteEditing(fixture.options))

    act(() => {
      result.current.updateRecordedNote(
        recordedNote.id,
        { duration: 0.13, startTime: -0.1 },
        "transient",
      )
      result.current.updateRecordedNote(
        recordedNote.id,
        { startTime: 0.38 },
        "commit",
      )
    })

    expect(fixture.applyTransientUpdate).toHaveBeenCalledOnce()
    expect(fixture.commitTransientUpdate).toHaveBeenCalledOnce()

    const transientUpdater = fixture.applyTransientUpdate.mock.calls[0][0]
    const transientProject = transientUpdater(fixture.getCurrentProject())
    const transientTrack = getMidiTracks(transientProject.timeline).find(
      (track) => track.id === fixture.options.primaryTrack.id,
    )!
    expect(getMidiTrackNotes(transientTrack)[0]).toMatchObject({
      duration: 0.25,
      startTime: 0,
    })

    const commitUpdater = fixture.commitTransientUpdate.mock.calls[0][0]
    const committedProject = commitUpdater(fixture.getCurrentProject())
    const committedTrack = getMidiTracks(committedProject.timeline).find(
      (track) => track.id === fixture.options.primaryTrack.id,
    )!
    expect(getMidiTrackNotes(committedTrack)[0].startTime).toBe(0.5)
  })

  it("derives whether the selected note changed from the latest commit", () => {
    const fixture = createFixture()
    const editedProject = fixture.options.project
    const committedProject = createDefaultProject()
    const committedTrack = getMidiTracks(committedProject.timeline)[0]
    const committedWithNote = appendNoteToTrack(
      committedProject,
      committedTrack.id,
      recordedNote,
    )

    const { result } = renderHook(() =>
      useProjectNoteEditing({
        ...fixture.options,
        project: editedProject,
        selectedRecordedNote: {
          ...recordedNote,
          startTime: 1,
        },
        undoStack: [committedWithNote],
      }),
    )

    expect(result.current.selectedNoteHistoryStatus).toBe("modificada")
  })
})
