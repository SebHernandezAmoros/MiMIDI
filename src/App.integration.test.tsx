import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import App from "./App"
import { PROJECT_STORAGE_KEY } from "./engine/project/projectStorage"

function getFirstTimelineBlock(container: HTMLElement) {
  const block = container.querySelector(".timeline-note-block")

  if (!(block instanceof HTMLElement)) {
    throw new Error("Timeline block was not found")
  }

  return block
}

function getNoteStartValue(block: HTMLElement) {
  return block.style.getPropertyValue("--note-start")
}

describe("App integration: timeline history", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    window.localStorage.clear()

    const seededProject = {
      id: "project-test",
      name: "Project Test",
      tracks: [
        {
          id: "track-1",
          instrumentId: "pure-sine",
          name: "Track 1",
          notes: [
            {
              id: "note-A4-0.000-0.500",
              note: "A4",
              startTime: 0,
              duration: 0.5,
              velocity: 1,
              instrumentId: "pure-sine",
            },
          ],
        },
      ],
    }

    window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(seededProject))
  })

  it("supports drag + undo/redo with buttons and keyboard shortcuts", () => {
    const { container } = render(<App />)

    let block = getFirstTimelineBlock(container)
    const startBeforeDrag = getNoteStartValue(block)

    const track = block.closest(".timeline-track")

    if (!(track instanceof HTMLElement)) {
      throw new Error("Timeline track was not found")
    }

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 24,
      top: 0,
      left: 0,
      right: 400,
      bottom: 24,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.pointerDown(block, { clientX: 40 })
    fireEvent.pointerMove(window, { clientX: 160 })
    fireEvent.pointerUp(window)

    block = getFirstTimelineBlock(container)
    const startAfterDrag = getNoteStartValue(block)

    expect(startAfterDrag).not.toBe(startBeforeDrag)
    expect(screen.getByText(/Historial:\s*[1-9]/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }))

    block = getFirstTimelineBlock(container)
    expect(getNoteStartValue(block)).toBe(startBeforeDrag)

    fireEvent.click(screen.getByRole("button", { name: "Rehacer" }))

    block = getFirstTimelineBlock(container)
    expect(getNoteStartValue(block)).toBe(startAfterDrag)

    fireEvent.keyDown(window, { key: "z", ctrlKey: true })

    block = getFirstTimelineBlock(container)
    expect(getNoteStartValue(block)).toBe(startBeforeDrag)

    fireEvent.keyDown(window, { key: "y", ctrlKey: true })

    block = getFirstTimelineBlock(container)
    expect(getNoteStartValue(block)).toBe(startAfterDrag)
  })

  it("shows tooltip in Revertir nota button", () => {
    const { container } = render(<App />)

    fireEvent.click(getFirstTimelineBlock(container))

    const revertButton = within(container).getByRole("button", { name: "Revertir nota" })

    expect(revertButton.getAttribute("title")).toContain("estado confirmado")
  })
})
