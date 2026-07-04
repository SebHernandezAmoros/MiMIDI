import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectHistoryController } from "../useProjectHistoryController"

describe("useProjectHistoryController", () => {
  it("reports an unavailable undo without changing selection", () => {
    const setActiveTrackId = vi.fn()
    const setProjectMessage = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectHistoryController({
        activeTrackId: "track-1",
        redo: vi.fn(() => null),
        setActiveTrackId,
        setProjectMessage,
        setSelectedRecordedNoteId,
        undo: vi.fn(() => null),
      }),
    )

    act(() => {
      result.current.undoProjectEdit()
    })

    expect(setProjectMessage).toHaveBeenCalledWith(
      "No hay cambios anteriores para deshacer.",
    )
    expect(setActiveTrackId).not.toHaveBeenCalled()
    expect(setSelectedRecordedNoteId).not.toHaveBeenCalled()
  })

  it("applies redo selection and clears the selected note", () => {
    const project = createDefaultProject()
    const activeTrackId = getMidiTracks(project.timeline)[1]?.id ?? "track-1"
    const setActiveTrackId = vi.fn()
    const setProjectMessage = vi.fn()
    const setSelectedRecordedNoteId = vi.fn()
    const { result } = renderHook(() =>
      useProjectHistoryController({
        activeTrackId,
        redo: vi.fn(() => project),
        setActiveTrackId,
        setProjectMessage,
        setSelectedRecordedNoteId,
        undo: vi.fn(() => null),
      }),
    )

    act(() => {
      result.current.redoProjectEdit()
    })

    expect(setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
    expect(setActiveTrackId).toHaveBeenCalledWith(activeTrackId)
    expect(setProjectMessage).toHaveBeenCalledWith("Rehacer aplicado.")
  })
})
