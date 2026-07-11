import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditTimelineViewToggle } from "../EditTimelineViewToggle"

describe("EditTimelineViewToggle", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the notes/tracks toggle and reports view changes", () => {
    const onTimelineViewChange = vi.fn()

    render(
      <EditTimelineViewToggle
        notesLabel="Notas"
        onTimelineViewChange={onTimelineViewChange}
        timelineView="notes"
        tracksLabel="Pistas"
      />,
    )

    expect(screen.getByRole("group").getAttribute("aria-label")).toBe(
      "Notas/Pistas",
    )
    expect(screen.getByRole("button", { name: "Notas" }).getAttribute("aria-pressed")).toBe(
      "true",
    )
    expect(screen.getByRole("button", { name: "Pistas" }).getAttribute("aria-pressed")).toBe(
      "false",
    )

    fireEvent.click(screen.getByRole("button", { name: "Pistas" }))

    expect(onTimelineViewChange).toHaveBeenCalledWith("tracks")
  })

  it("disables the notes button when no editable tracks exist", () => {
    const onTimelineViewChange = vi.fn()

    render(
      <EditTimelineViewToggle
        disabledNotes
        disabledNotesTitle="Agrega una pista MIDI primero"
        notesLabel="Notas"
        onTimelineViewChange={onTimelineViewChange}
        timelineView="tracks"
        tracksLabel="Pistas"
      />,
    )

    const notesButton = screen.getByRole("button", { name: "Notas" }) as HTMLButtonElement

    expect(notesButton.disabled).toBe(true)
    expect(notesButton.title).toBe("Agrega una pista MIDI primero")

    fireEvent.click(notesButton)

    expect(onTimelineViewChange).not.toHaveBeenCalled()
  })
})
