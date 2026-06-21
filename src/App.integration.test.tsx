import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import App from "./App"
import { PROJECT_STORAGE_KEY } from "./engine/project/projectStorage"

vi.mock("./engine/audio/audioEngine", () => ({
  playFrequency: vi.fn(),
  playNoise: vi.fn(),
  setMasterVolume: vi.fn(),
  startFrequency: vi.fn(() => "voice-1"),
  stopAllVoices: vi.fn(),
  stopVoice: vi.fn(),
}))

// IndexedDB no existe en jsdom — mock del storage de plugins externos
vi.mock("./engine/plugins/externalPluginStorage", () => ({
  listExternalPluginIds: vi.fn(() => Promise.resolve([])),
  loadExternalPlugin:    vi.fn(() => Promise.resolve(null)),
  saveExternalPlugin:    vi.fn(() => Promise.resolve()),
  deleteExternalPlugin:  vi.fn(() => Promise.resolve()),
}))

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
    window.history.pushState({}, "", "/lab")

    const seededProject = {
      id: "project-test",
      name: "Project Test",
      trackTimelineDuration: 8,
      tracks: [
        {
          id: "track-1",
          instrumentId: "pure-sine",
          name: "Track 1",
          muted: false,
          noteTimelineDuration: 8,
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
          pan: 0,
          solo: false,
          timelineClip: {
            id: "track-1-clip-1",
            startTime: 0,
          },
          volume: 1,
          envelope: { attack: 0.02, decay: 0.12, sustain: 0.68, release: 0.24 },
          volumeAutomation: {
            enabled: false,
            points: [
              { time: 0, value: 1 },
              { time: 4, value: 1 },
            ],
          },
        },
        {
          id: "track-2",
          instrumentId: "soft-triangle",
          name: "Track 2",
          muted: false,
          noteTimelineDuration: 8,
          notes: [
            {
              id: "note-C5-0.250-0.750",
              note: "C5",
              startTime: 0.25,
              duration: 0.5,
              velocity: 1,
              instrumentId: "soft-triangle",
            },
          ],
          pan: 0,
          solo: false,
          timelineClip: {
            id: "track-2-clip-1",
            startTime: 0,
          },
          volume: 1,
          envelope: { attack: 0.02, decay: 0.12, sustain: 0.68, release: 0.24 },
          volumeAutomation: {
            enabled: false,
            points: [
              { time: 0, value: 1 },
              { time: 4, value: 1 },
            ],
          },
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

  it("switches active track from the track timeline overview", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: "TRACKS" }))
    fireEvent.click(screen.getByRole("button", { name: /track 2/i }))

    const projectSummary = screen.getByLabelText("Proyecto actual")

    expect(within(projectSummary).getByText("Track 2")).toBeTruthy()
  })

  it("does not record test notes unless recording is active", async () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: "Reiniciar proyecto" }))
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar", hidden: true }))

    await waitFor(() => {
      within(screen.getByLabelText("Proyecto actual")).getByText("0")
    })

    fireEvent.click(screen.getByRole("button", { name: "Tocar nota" }))

    const projectSummary = screen.getByLabelText("Proyecto actual")
    expect(within(projectSummary).getByText("0")).toBeTruthy()
  })

  it("starts each new recording take at its own zero point", async () => {
    const { container } = render(<App />)

    fireEvent.click(screen.getByRole("button", { name: "Reiniciar proyecto" }))
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar", hidden: true }))

    await waitFor(() => {
      within(screen.getByLabelText("Proyecto actual")).getByText("0")
    })

    fireEvent.click(screen.getByRole("button", { name: "Iniciar grabacion" }))
    fireEvent.click(screen.getByRole("button", { name: "Tocar nota" }))
    fireEvent.click(screen.getByRole("button", { name: "Detener grabacion" }))

    fireEvent.click(screen.getByRole("button", { name: "Nueva pista" }))
    fireEvent.click(screen.getByRole("button", { name: "Iniciar grabacion" }))
    fireEvent.click(screen.getByRole("button", { name: "Tocar nota" }))
    fireEvent.click(screen.getByRole("button", { name: "Detener grabacion" }))

    const projectSummary = screen.getByLabelText("Proyecto actual")
    expect(within(projectSummary).getByText("Track 2")).toBeTruthy()

    const block = getFirstTimelineBlock(container)
    expect(Number(getNoteStartValue(block))).toBeLessThan(0.1)
  })

  it("moves a track clip in the track timeline and supports undo", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: "TRACKS" }))

    const activeTrackLane = screen.getByRole("button", { name: /track 1/i })
    const clip = activeTrackLane.querySelector(".track-timeline-clip")

    if (!(clip instanceof HTMLElement)) {
      throw new Error("Track timeline clip was not found")
    }

    const track = clip.closest(".track-timeline-track")

    if (!(track instanceof HTMLElement)) {
      throw new Error("Track timeline track was not found")
    }

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 48,
      top: 0,
      left: 0,
      right: 400,
      bottom: 48,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    const getClipStart = () => clip.style.getPropertyValue("--track-clip-start")
    const startBeforeDrag = getClipStart()

    fireEvent.pointerDown(clip, { clientX: 40 })
    fireEvent.pointerMove(window, { clientX: 200 })
    fireEvent.pointerUp(window)

    expect(getClipStart()).not.toBe(startBeforeDrag)

    fireEvent.keyDown(window, { key: "z", ctrlKey: true })

    expect(getClipStart()).toBe(startBeforeDrag)
  })

  it("allows defining a manual duration for the track timeline", () => {
    render(<App />)

    const durationInput = screen.getByLabelText("Duracion timeline (s)")
    fireEvent.change(durationInput, { target: { value: "16" } })

    expect(screen.getByText("16.0s")).toBeTruthy()
  })

  it("can reset the track timeline duration to fit current content", () => {
    render(<App />)

    const durationInput = screen.getByLabelText("Duracion timeline (s)")
    fireEvent.change(durationInput, { target: { value: "16" } })
    fireEvent.click(screen.getByRole("button", { name: "Ajustar al contenido" }))

    expect(Number((durationInput as HTMLInputElement).value)).toBeLessThan(16)
  })

  it("allows defining a manual duration for the note timeline", () => {
    render(<App />)

    const durationInput = screen.getByLabelText("Duracion timeline notas (s)")
    fireEvent.change(durationInput, { target: { value: "12" } })

    expect(screen.getAllByText("12.0s").length).toBeGreaterThan(0)
  })

  it("can reset the note timeline duration to fit current content", () => {
    render(<App />)

    const durationInput = screen.getByLabelText("Duracion timeline notas (s)")
    fireEvent.change(durationInput, { target: { value: "12" } })
    fireEvent.click(screen.getByRole("button", { name: "Ajustar notas al contenido" }))

    expect(Number((durationInput as HTMLInputElement).value)).toBeLessThan(12)
  })

  it("can compact the empty space before the first note in the note timeline", () => {
    window.history.pushState({}, "", "/?view=edit")
    const { container } = render(<App />)

    const trackSelect = screen.getByLabelText("Seleccionar pista")
    fireEvent.change(trackSelect, { target: { value: "track-2" } })

    let block = getFirstTimelineBlock(container)
    expect(Number(getNoteStartValue(block))).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: "Opciones de la vista" }))
    fireEvent.click(screen.getByRole("button", { name: "Compactar inicio", hidden: true }))

    block = getFirstTimelineBlock(container)
    expect(Number(getNoteStartValue(block))).toBe(0)
  })

  it("shows the app mode shell on the root route", () => {
    window.history.pushState({}, "", "/?view=edit")

    render(<App />)

    expect(screen.getByRole("button", { name: "Piano" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy()
    expect(screen.getByLabelText("Workspace Edit")).toBeTruthy()
    expect(screen.getByLabelText("Workspace de timeline")).toBeTruthy()
  })

  it("shows the replicated project view on the root route", () => {
    window.history.pushState({}, "", "/?view=project")

    render(<App />)

    expect(screen.getByRole("button", { name: "Project" })).toBeTruthy()
    expect(screen.getByLabelText("Workspace Project")).toBeTruthy()
    expect(screen.getByLabelText("Proyecto actual")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Exportar" })).toBeTruthy()
  })

  it("shows the replicated piano view on the root route", () => {
    window.history.pushState({}, "", "/?view=piano")

    render(<App />)

    expect(screen.getByRole("button", { name: "Piano" })).toBeTruthy()
    expect(screen.getByLabelText("Workspace Perform")).toBeTruthy()
    expect(screen.getByText("Modo del piano")).toBeTruthy()
    expect(screen.getByLabelText("Controles de grabación")).toBeTruthy()
    expect(screen.getByLabelText("Octava visible activa")).toBeTruthy()
  })
})
