import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import {
  getMidiTrackNotes,
  getTrackNoteTimelineContentLength,
  getTracksTimelineLength,
} from "../../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import type { MusicalProject } from "../../../domain/project/projectTypes"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectTimelineDurationEditing } from "../useProjectTimelineDurationEditing"

describe("useProjectTimelineDurationEditing", () => {
  it("routes finite project and note timeline durations through project history", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const { result } = renderHook(() =>
      useProjectTimelineDurationEditing({
        applyUpdate,
        primaryTrackId: primaryTrack.id,
        primaryTrackName: primaryTrack.name,
        primaryTrackNotes: getMidiTrackNotes(primaryTrack),
        setProjectMessage: vi.fn(),
      }),
    )

    act(() => {
      result.current.updateProjectTrackTimelineDurationValue(20)
      result.current.updatePrimaryTrackNoteTimelineDurationValue(12)
      result.current.updateProjectTrackTimelineDurationValue(Number.NaN)
      result.current.updatePrimaryTrackNoteTimelineDurationValue(
        Number.POSITIVE_INFINITY,
      )
    })

    expect(applyUpdate).toHaveBeenCalledTimes(2)

    const projectUpdater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const noteUpdater = applyUpdate.mock.calls[1][0] as (
      project: MusicalProject,
    ) => MusicalProject

    expect(projectUpdater(project).trackTimelineDuration).toBe(20)
    expect(
      getMidiTracks(noteUpdater(project).timeline)[0].noteTimelineDuration,
    ).toBe(12)
  })

  it("resets project timeline duration to current content and reports feedback", () => {
    const project = {
      ...createDefaultProject(),
      trackTimelineDuration: 99,
    }
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const setProjectMessage = vi.fn()
    const { result } = renderHook(() =>
      useProjectTimelineDurationEditing({
        applyUpdate,
        primaryTrackId: primaryTrack.id,
        primaryTrackName: primaryTrack.name,
        primaryTrackNotes: getMidiTrackNotes(primaryTrack),
        setProjectMessage,
      }),
    )

    act(() => result.current.resetProjectTrackTimelineDuration())

    expect(applyUpdate).toHaveBeenCalledOnce()
    expect(setProjectMessage).toHaveBeenCalledWith(
      "Duracion del timeline ajustada al contenido.",
    )

    const updater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    expect(updater(project).trackTimelineDuration).toBe(
      getTracksTimelineLength(project.timeline),
    )
  })

  it("resets primary note timeline duration from current track content and reports feedback", () => {
    const initialProject = createDefaultProject()
    const primaryTrack = getMidiTracks(initialProject.timeline)[0]
    const project = appendNoteToTrack(initialProject, primaryTrack.id, {
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 2,
      velocity: 0.9,
    })
    const applyUpdate = vi.fn()
    const setProjectMessage = vi.fn()
    const { result } = renderHook(() =>
      useProjectTimelineDurationEditing({
        applyUpdate,
        primaryTrackId: primaryTrack.id,
        primaryTrackName: primaryTrack.name,
        primaryTrackNotes: getMidiTrackNotes(primaryTrack),
        setProjectMessage,
      }),
    )

    act(() => result.current.resetPrimaryTrackNoteTimelineDuration())

    expect(applyUpdate).toHaveBeenCalledOnce()
    expect(setProjectMessage).toHaveBeenCalledWith(
      `Duracion del timeline de notas ajustada al contenido de ${primaryTrack.name}.`,
    )

    const updater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    const updatedTrack = getMidiTracks(updater(project).timeline)[0]
    expect(updatedTrack.noteTimelineDuration).toBe(
      getTrackNoteTimelineContentLength(updatedTrack),
    )
  })

  it("reports when the primary note timeline has no notes to compact", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const setProjectMessage = vi.fn()
    const { result } = renderHook(() =>
      useProjectTimelineDurationEditing({
        applyUpdate,
        primaryTrackId: primaryTrack.id,
        primaryTrackName: primaryTrack.name,
        primaryTrackNotes: [],
        setProjectMessage,
      }),
    )

    act(() => result.current.compactPrimaryTrackNoteTimelineStart())

    expect(applyUpdate).not.toHaveBeenCalled()
    expect(setProjectMessage).toHaveBeenCalledWith(
      `No hay notas en ${primaryTrack.name} para compactar.`,
    )
  })

  it("reports when the primary note timeline already starts at zero", () => {
    const project = createDefaultProject()
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const primaryTrackNotes = [{
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine" as const,
      note: "C4" as const,
      startTime: 0,
      velocity: 0.9,
    }]
    const applyUpdate = vi.fn()
    const setProjectMessage = vi.fn()
    const { result } = renderHook(() =>
      useProjectTimelineDurationEditing({
        applyUpdate,
        primaryTrackId: primaryTrack.id,
        primaryTrackName: primaryTrack.name,
        primaryTrackNotes,
        setProjectMessage,
      }),
    )

    act(() => result.current.compactPrimaryTrackNoteTimelineStart())

    expect(applyUpdate).not.toHaveBeenCalled()
    expect(setProjectMessage).toHaveBeenCalledWith(
      `Las notas de ${primaryTrack.name} ya empiezan en 0s.`,
    )
  })

  it("compacts the primary note timeline through project history and reports feedback", () => {
    const initialProject = createDefaultProject()
    const initialTrack = getMidiTracks(initialProject.timeline)[0]
    const project = appendNoteToTrack(initialProject, initialTrack.id, {
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 2,
      velocity: 0.9,
    })
    const primaryTrack = getMidiTracks(project.timeline)[0]
    const applyUpdate = vi.fn()
    const setProjectMessage = vi.fn()
    const { result } = renderHook(() =>
      useProjectTimelineDurationEditing({
        applyUpdate,
        primaryTrackId: primaryTrack.id,
        primaryTrackName: primaryTrack.name,
        primaryTrackNotes: getMidiTrackNotes(primaryTrack),
        setProjectMessage,
      }),
    )

    act(() => result.current.compactPrimaryTrackNoteTimelineStart())

    expect(applyUpdate).toHaveBeenCalledOnce()
    expect(setProjectMessage).toHaveBeenCalledWith(
      `Inicio del timeline de notas compactado en ${primaryTrack.name}.`,
    )

    const updater = applyUpdate.mock.calls[0][0] as (
      project: MusicalProject,
    ) => MusicalProject
    expect(
      getMidiTrackNotes(getMidiTracks(updater(project).timeline)[0])[0].startTime,
    ).toBe(0)
  })
})
