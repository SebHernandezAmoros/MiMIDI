import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { getMidiTrackNotes } from "../../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import {
  createDefaultProject,
  resetProject,
} from "../../../engine/project/projectModel"
import { useProjectSessionLifecycle } from "../useProjectSessionLifecycle"

describe("useProjectSessionLifecycle", () => {
  it("clears notes and selection without clearing sample slots", () => {
    const project = createDefaultProject()
    const track = getMidiTracks(project.timeline)[0]
    let updatedProject = appendNoteToTrack(project, track.id, {
      id: "note-1",
      note: "C4",
      startTime: 0,
      duration: 0.5,
      velocity: 0.9,
      instrumentId: "pure-sine",
    })
    const applyUpdate = vi.fn((update) => {
      updatedProject = update(updatedProject)
    })
    const clearSampleSlots = vi.fn()
    const setActiveTrackId = vi.fn()
    const setProjectMessage = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectSessionLifecycle({
        applyUpdate,
        clearSampleSlots,
        resetProject,
        setActiveTrackId,
        setProjectMessage,
        setSelectedRecordedNoteId,
      }),
    )

    act(() => {
      result.current.clearSession()
    })

    expect(getMidiTrackNotes(getMidiTracks(updatedProject.timeline)[0])).toEqual([])
    expect(clearSampleSlots).not.toHaveBeenCalled()
    expect(setActiveTrackId).not.toHaveBeenCalled()
    expect(setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
    expect(setProjectMessage).toHaveBeenCalledWith(
      "Notas limpiadas. Pistas y nombre conservados.",
    )
  })

  it("waits for sample cleanup before restarting project and selection", async () => {
    let updatedProject = {
      ...createDefaultProject(),
      name: "Proyecto editado",
    }
    let resolveSampleCleanup!: () => void
    const clearSampleSlots = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSampleCleanup = resolve
        }),
    )
    const applyUpdate = vi.fn((update) => {
      updatedProject = update(updatedProject)
    })
    const setActiveTrackId = vi.fn()
    const setProjectMessage = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectSessionLifecycle({
        applyUpdate,
        clearSampleSlots,
        resetProject,
        setActiveTrackId,
        setProjectMessage,
        setSelectedRecordedNoteId,
      }),
    )
    let restartPromise!: Promise<void>

    act(() => {
      restartPromise = result.current.restartProject()
    })

    expect(applyUpdate).not.toHaveBeenCalled()
    expect(setActiveTrackId).not.toHaveBeenCalled()

    await act(async () => {
      resolveSampleCleanup()
      await restartPromise
    })

    expect(updatedProject.name).toBe("MiMIDI Project")
    expect(setActiveTrackId).toHaveBeenCalledWith("track-1")
    expect(setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
    expect(setProjectMessage).toHaveBeenCalledWith(
      "Proyecto reiniciado desde cero.",
    )
  })
})
