import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent } from "react"
import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectJsonTransfer } from "../useProjectJsonTransfer"

function createImportEvent(file: File) {
  return {
    target: {
      files: [file],
      value: "project.json",
    },
  } as unknown as ChangeEvent<HTMLInputElement>
}

function createFixture() {
  const project = createDefaultProject()
  const blob = new Blob(["project"])
  const types = [
    {
      accept: { "application/json": [".json"] },
      description: "Proyecto MiMIDI",
    },
  ]
  const dependencies = {
    createProjectJsonExport: vi.fn(() => ({
      blob,
      fileName: "project.json",
      types,
    })),
    importProjectJsonFile: vi.fn(),
    saveFile: vi.fn().mockResolvedValue(undefined),
  }
  const options = {
    dependencies,
    project,
    replaceState: vi.fn(),
    setActiveTrackId: vi.fn(),
    setProjectMessage: vi.fn(),
    setSelectedRecordedNoteId: vi.fn(),
  }

  return {
    blob,
    dependencies,
    options,
    project,
    types,
  }
}

describe("useProjectJsonTransfer", () => {
  it("exports the current project and reports completion", async () => {
    const fixture = createFixture()
    const { result } = renderHook(() =>
      useProjectJsonTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.exportProject()
    })

    expect(fixture.dependencies.createProjectJsonExport)
      .toHaveBeenCalledWith(fixture.project)
    expect(fixture.dependencies.saveFile).toHaveBeenCalledWith(
      fixture.blob,
      "project.json",
      fixture.types,
    )
    expect(fixture.options.setProjectMessage).toHaveBeenCalledWith(
      "Proyecto exportado a JSON.",
    )
  })

  it("imports a JSON project and resets selection and input", async () => {
    const fixture = createFixture()
    const importedProject = {
      ...createDefaultProject(),
      name: "Proyecto importado",
    }
    fixture.dependencies.importProjectJsonFile.mockResolvedValue(importedProject)
    const event = createImportEvent(new File(["{}"], "project.json"))
    const { result } = renderHook(() =>
      useProjectJsonTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.importProjectFile(event)
    })

    expect(fixture.options.replaceState).toHaveBeenCalledWith(importedProject)
    expect(fixture.options.setActiveTrackId).toHaveBeenCalledWith("track-1")
    expect(fixture.options.setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
    expect(fixture.options.setProjectMessage).toHaveBeenCalledWith(
      "Proyecto importado: Proyecto importado.",
    )
    expect(event.target.value).toBe("")
  })

  it("reports JSON import failures and resets the input", async () => {
    const fixture = createFixture()
    fixture.dependencies.importProjectJsonFile.mockRejectedValue(
      new Error("invalid project"),
    )
    const event = createImportEvent(new File(["invalid"], "project.json"))
    const { result } = renderHook(() =>
      useProjectJsonTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.importProjectFile(event)
    })

    expect(fixture.options.replaceState).not.toHaveBeenCalled()
    expect(fixture.options.setProjectMessage).toHaveBeenCalledWith(
      "No se pudo importar el JSON del proyecto.",
    )
    expect(event.target.value).toBe("")
  })
})
