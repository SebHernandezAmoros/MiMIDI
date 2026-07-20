import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { OscillatorWorkspace } from "./OscillatorWorkspace"
import { clearOscillatorSettingsForTest } from "./oscillatorSettingsStore"

function createAPI() {
  return {
    audio: {
      playNote: vi.fn(),
      stopNote: vi.fn(),
    },
    project: {
      getBPM: vi.fn(() => 120),
    },
    session: {
      sendOutput: vi.fn(),
    },
    ui: {
      notify: vi.fn(),
    },
  }
}

describe("OscillatorWorkspace", () => {
  afterEach(() => {
    cleanup()
    clearOscillatorSettingsForTest()
  })

  it("previews the selected waveform instrument", async () => {
    const api = createAPI()
    render(<OscillatorWorkspace api={api} version="0.1.0" />)

    fireEvent.click(screen.getByText("Square"))
    fireEvent.click(screen.getByText("Preview"))

    expect(api.audio.playNote).toHaveBeenCalledWith("C4", "oscillator", 0.8)
  })

  it("keeps the workspace focused on preview instead of sending phrases", async () => {
    const api = createAPI()
    render(<OscillatorWorkspace api={api} version="0.1.0" />)

    expect(screen.queryByText("Send phrase")).toBeNull()
    expect(api.session.sendOutput).not.toHaveBeenCalled()
    expect(api.ui.notify).not.toHaveBeenCalled()
  })

  it("exposes piano-compatible motion controls", async () => {
    const api = createAPI()
    render(<OscillatorWorkspace api={api} version="0.1.0" />)

    fireEvent.click(screen.getByText("Vibrato"))
    fireEvent.click(screen.getByText("Step"))

    expect(screen.getByText("Motion")).toBeTruthy()
    expect(screen.getByText("Motion Shape")).toBeTruthy()
    expect(screen.getByText("Oscillator - Sine - vibrato - step")).toBeTruthy()
    expect(screen.queryByText("Root")).toBeNull()
    expect(screen.queryByText("Octave")).toBeNull()
    expect(screen.queryByText("Envelope")).toBeNull()
  })
})
