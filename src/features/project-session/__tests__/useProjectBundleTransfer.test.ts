import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent } from "react"
import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectBundleTransfer } from "../useProjectBundleTransfer"

function createImportEvent(file: File) {
  return {
    target: {
      files: [file],
      value: "project.mimidi",
    },
  } as unknown as ChangeEvent<HTMLInputElement>
}

function createFixture() {
  const project = createDefaultProject()
  const blob = new Blob(["bundle"])
  const types = [
    {
      accept: { "application/octet-stream": [".mimidi"] },
      description: "Bundle MiMIDI",
    },
  ]
  const dependencies = {
    createProjectBundleExport: vi.fn().mockResolvedValue({
      blob,
      fileName: "project.mimidi",
      types,
    }),
    importProjectBundleFile: vi.fn(),
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

describe("useProjectBundleTransfer", () => {
  it("exports the current bundle and reports progress", async () => {
    const fixture = createFixture()
    const { result } = renderHook(() =>
      useProjectBundleTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.exportBundle()
    })

    expect(fixture.dependencies.createProjectBundleExport)
      .toHaveBeenCalledWith(fixture.project)
    expect(fixture.dependencies.saveFile).toHaveBeenCalledWith(
      fixture.blob,
      "project.mimidi",
      fixture.types,
    )
    expect(fixture.options.setProjectMessage.mock.calls).toEqual([
      ["Empaquetando proyecto..."],
      ["Proyecto guardado como .mimidi (incluye muestras)."],
    ])
  })

  it("reports bundle export failures", async () => {
    const fixture = createFixture()
    fixture.dependencies.createProjectBundleExport.mockRejectedValue(
      new Error("bundle failed"),
    )
    const { result } = renderHook(() =>
      useProjectBundleTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.exportBundle()
    })

    expect(fixture.dependencies.saveFile).not.toHaveBeenCalled()
    expect(fixture.options.setProjectMessage.mock.calls).toEqual([
      ["Empaquetando proyecto..."],
      ["No se pudo exportar el bundle."],
    ])
  })

  it("imports a bundle and resets selection and input", async () => {
    const fixture = createFixture()
    const importedProject = {
      ...createDefaultProject(),
      name: "Proyecto importado",
    }
    fixture.dependencies.importProjectBundleFile.mockResolvedValue(
      importedProject,
    )
    const event = createImportEvent(
      new File(["bundle"], "project.mimidi"),
    )
    const { result } = renderHook(() =>
      useProjectBundleTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.importBundle(event)
    })

    expect(fixture.options.replaceState).toHaveBeenCalledWith(importedProject)
    expect(fixture.options.setActiveTrackId).toHaveBeenCalledWith("track-1")
    expect(fixture.options.setSelectedRecordedNoteId).toHaveBeenCalledWith(null)
    expect(fixture.options.setProjectMessage.mock.calls).toEqual([
      ["Importando proyecto..."],
      ["Proyecto importado: Proyecto importado."],
    ])
    expect(event.target.value).toBe("")
  })

  it("reports bundle import failures and resets the input", async () => {
    const fixture = createFixture()
    fixture.dependencies.importProjectBundleFile.mockRejectedValue(
      new Error("invalid bundle"),
    )
    const event = createImportEvent(
      new File(["invalid"], "project.mimidi"),
    )
    const { result } = renderHook(() =>
      useProjectBundleTransfer(fixture.options),
    )

    await act(async () => {
      await result.current.importBundle(event)
    })

    expect(fixture.options.replaceState).not.toHaveBeenCalled()
    expect(fixture.options.setProjectMessage.mock.calls).toEqual([
      ["Importando proyecto..."],
      ["No se pudo importar el archivo .mimidi."],
    ])
    expect(event.target.value).toBe("")
  })
})
