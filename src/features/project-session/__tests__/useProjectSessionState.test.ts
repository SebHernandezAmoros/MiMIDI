import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectSessionState } from "../useProjectSessionState"

describe("useProjectSessionState", () => {
  it("coordinates project updates with undo and redo", () => {
    const initialProject = createDefaultProject()
    const { result } = renderHook(() =>
      useProjectSessionState(initialProject),
    )

    act(() => {
      result.current.applyUpdate((project) => ({
        ...project,
        name: "Proyecto editado",
      }))
    })

    expect(result.current.project.name).toBe("Proyecto editado")
    expect(result.current.canUndo).toBe(true)
    expect(result.current.undoStack).toEqual([initialProject])

    act(() => {
      result.current.undo()
    })
    expect(result.current.project).toBe(initialProject)
    expect(result.current.canRedo).toBe(true)

    act(() => {
      result.current.redo()
    })
    expect(result.current.project.name).toBe("Proyecto editado")
  })

  it("ignores structurally equivalent project updates", () => {
    const initialProject = createDefaultProject()
    const { result } = renderHook(() =>
      useProjectSessionState(initialProject),
    )

    act(() => {
      result.current.applyUpdate((project) =>
        JSON.parse(JSON.stringify(project)),
      )
    })

    expect(result.current.project).toBe(initialProject)
    expect(result.current.undoStack).toHaveLength(0)
  })

  it("commits transient updates as one history entry", () => {
    const initialProject = createDefaultProject()
    const { result } = renderHook(() =>
      useProjectSessionState(initialProject),
    )

    act(() => {
      result.current.applyTransientUpdate((project) => ({
        ...project,
        name: "Movimiento transitorio",
      }))
      result.current.commitTransientUpdate((project) => ({
        ...project,
        name: "Movimiento confirmado",
      }))
    })

    expect(result.current.project.name).toBe("Movimiento confirmado")
    expect(result.current.undoStack).toEqual([initialProject])
  })

  it("preserves the history limit and clears history on replacement", () => {
    const initialProject = createDefaultProject()
    const { result } = renderHook(() =>
      useProjectSessionState(initialProject),
    )

    act(() => {
      for (let index = 1; index <= 21; index += 1) {
        result.current.applyUpdate((project) => ({
          ...project,
          name: `Proyecto ${index}`,
        }))
      }
    })

    expect(result.current.undoStack).toHaveLength(20)
    expect(result.current.undoStack[0].name).toBe("Proyecto 1")

    const replacement = {
      ...createDefaultProject(),
      name: "Proyecto reemplazado",
    }
    act(() => {
      result.current.replaceState(replacement)
    })

    expect(result.current.project).toBe(replacement)
    expect(result.current.undoStack).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
  })
})
