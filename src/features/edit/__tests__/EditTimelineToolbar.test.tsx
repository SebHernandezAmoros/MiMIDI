import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditTimelineToolbar } from "../EditTimelineToolbar"

const tracks = [
  { id: "track-1", name: "Lead" },
  { id: "track-2", name: "Bass" },
]

describe("EditTimelineToolbar", () => {
  afterEach(() => {
    cleanup()
  })

  it("composes view toggle and active track select in notes view", () => {
    const onTimelineViewChange = vi.fn()
    const onTrackChange = vi.fn()

    render(
      <EditTimelineToolbar
        activeTrackId="track-1"
        activeTrackSelectLabel="Seleccionar pista"
        addMidiTrackDisabledTitle="Agrega una pista MIDI primero"
        hasNoTracks={false}
        isNoteEditMode={false}
        notesLabel="Notas"
        onTimelineViewChange={onTimelineViewChange}
        onTrackChange={onTrackChange}
        timelineView="notes"
        tracks={tracks}
        tracksLabel="Pistas"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Pistas" }))
    fireEvent.change(screen.getByLabelText("Seleccionar pista"), {
      target: { value: "track-2" },
    })

    expect(onTimelineViewChange).toHaveBeenCalledWith("tracks")
    expect(onTrackChange).toHaveBeenCalledWith("track-2")
  })

  it("renders the provided track name control in tracks view", () => {
    render(
      <EditTimelineToolbar
        activeTrackId="track-1"
        activeTrackSelectLabel="Seleccionar pista"
        addMidiTrackDisabledTitle="Agrega una pista MIDI primero"
        hasNoTracks={false}
        isNoteEditMode={false}
        notesLabel="Notas"
        onTimelineViewChange={vi.fn()}
        onTrackChange={vi.fn()}
        timelineView="tracks"
        trackNameControl={<span data-testid="track-name-control" />}
        tracks={tracks}
        tracksLabel="Pistas"
      />,
    )

    expect(screen.getByTestId("track-name-control")).toBeTruthy()
  })

  it("hides navigation controls while editing a note", () => {
    render(
      <EditTimelineToolbar
        activeTrackId="track-1"
        activeTrackSelectLabel="Seleccionar pista"
        addMidiTrackDisabledTitle="Agrega una pista MIDI primero"
        hasNoTracks={false}
        isNoteEditMode
        noteEditControls={<span data-testid="note-controls" />}
        notesLabel="Notas"
        onTimelineViewChange={vi.fn()}
        onTrackChange={vi.fn()}
        timelineView="notes"
        tracks={tracks}
        tracksLabel="Pistas"
      />,
    )

    expect(screen.queryByRole("button", { name: "Notas" })).toBeNull()
    expect(screen.queryByLabelText("Seleccionar pista")).toBeNull()
    expect(screen.getByTestId("note-controls")).toBeTruthy()
  })
})
