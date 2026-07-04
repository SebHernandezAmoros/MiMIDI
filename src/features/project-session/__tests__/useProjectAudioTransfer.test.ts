import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectAudioTransfer } from "../useProjectAudioTransfer"

function createFixture() {
  const project = createDefaultProject()
  const blob = new Blob(["audio"])
  const types = [
    {
      accept: { "audio/wav": [".wav"] },
      description: "Audio WAV",
    },
  ]
  const dependencies = {
    createProjectAudioExport: vi.fn().mockResolvedValue({
      blob,
      duration: 2.5,
      fileName: "project.wav",
      types,
    }),
    isOfflineAudioSupported: vi.fn(() => true),
    saveFile: vi.fn().mockResolvedValue(undefined),
  }
  const options = {
    dependencies,
    hasRecordedNotes: true,
    project,
    setProjectMessage: vi.fn(),
  }

  return {
    blob,
    dependencies,
    options,
    project,
    types,
  }
}

describe("useProjectAudioTransfer", () => {
  it("does not export a project without notes or sampler tracks", async () => {
    const fixture = createFixture()
    fixture.options.hasRecordedNotes = false
    const { result } = renderHook(() =>
      useProjectAudioTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.exportProjectAudio(0.8)
    })

    expect(fixture.dependencies.isOfflineAudioSupported)
      .not.toHaveBeenCalled()
    expect(fixture.dependencies.createProjectAudioExport)
      .not.toHaveBeenCalled()
    expect(fixture.options.setProjectMessage).not.toHaveBeenCalled()
  })

  it("reports when offline audio export is unsupported", async () => {
    const fixture = createFixture()
    fixture.dependencies.isOfflineAudioSupported.mockReturnValue(false)
    const { result } = renderHook(() =>
      useProjectAudioTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.exportProjectAudio(0.8)
    })

    expect(fixture.dependencies.createProjectAudioExport)
      .not.toHaveBeenCalled()
    expect(fixture.options.setProjectMessage).toHaveBeenCalledWith(
      "Este navegador no soporta exportacion offline de audio.",
    )
  })

  it("exports WAV while exposing progress state", async () => {
    const fixture = createFixture()
    let finishExport: ((value: {
      blob: Blob
      duration: number
      fileName: string
      types: typeof fixture.types
    }) => void) | undefined
    fixture.dependencies.createProjectAudioExport.mockImplementation(
      () => new Promise((resolve) => {
        finishExport = resolve
      }),
    )
    const { result } = renderHook(() =>
      useProjectAudioTransfer(fixture.options),
    )

    let exportPromise: Promise<void> | undefined
    act(() => {
      exportPromise = result.current.exportProjectAudio(0.8)
    })

    expect(result.current.isExportingAudio).toBe(true)
    expect(fixture.dependencies.createProjectAudioExport)
      .toHaveBeenCalledWith(fixture.project, 0.8)

    await act(async () => {
      finishExport?.({
        blob: fixture.blob,
        duration: 2.5,
        fileName: "project.wav",
        types: fixture.types,
      })
      await exportPromise
    })

    expect(fixture.dependencies.saveFile).toHaveBeenCalledWith(
      fixture.blob,
      "project.wav",
      fixture.types,
    )
    expect(fixture.options.setProjectMessage).toHaveBeenCalledWith(
      "Audio exportado a WAV (2.50s).",
    )
    expect(result.current.isExportingAudio).toBe(false)
  })

  it("reports export failures and clears progress state", async () => {
    const fixture = createFixture()
    fixture.dependencies.createProjectAudioExport.mockRejectedValue(
      new Error("export failed"),
    )
    const { result } = renderHook(() =>
      useProjectAudioTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.exportProjectAudio(0.8)
    })

    expect(fixture.dependencies.saveFile).not.toHaveBeenCalled()
    expect(fixture.options.setProjectMessage).toHaveBeenCalledWith(
      "No se pudo exportar el audio del proyecto.",
    )
    expect(result.current.isExportingAudio).toBe(false)
  })
})
