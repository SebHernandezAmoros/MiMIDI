import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useProjectHistory } from "./useProjectHistory"

type State = {
  value: number
}

describe("useProjectHistory", () => {
  it("records history and supports undo/redo", () => {
    const { result } = renderHook(() =>
      useProjectHistory<State>({ value: 0 }, { isEqual: (a, b) => a.value === b.value }),
    )

    act(() => {
      result.current.applyUpdate((current) => ({ value: current.value + 1 }))
      result.current.applyUpdate((current) => ({ value: current.value + 1 }))
    })

    expect(result.current.state.value).toBe(2)
    expect(result.current.undoStack).toHaveLength(2)
    expect(result.current.redoStack).toHaveLength(0)
    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.undo()
    })

    expect(result.current.state.value).toBe(1)
    expect(result.current.redoStack).toHaveLength(1)
    expect(result.current.canRedo).toBe(true)

    act(() => {
      result.current.redo()
    })

    expect(result.current.state.value).toBe(2)
    expect(result.current.redoStack).toHaveLength(0)
  })

  it("does not append history during transient updates and commits once", () => {
    const { result } = renderHook(() =>
      useProjectHistory<State>({ value: 0 }, { isEqual: (a, b) => a.value === b.value }),
    )

    act(() => {
      result.current.applyTransientUpdate(() => ({ value: 1 }))
      result.current.applyTransientUpdate(() => ({ value: 2 }))
      result.current.applyTransientUpdate(() => ({ value: 3 }))
    })

    expect(result.current.state.value).toBe(3)
    expect(result.current.undoStack).toHaveLength(0)

    act(() => {
      result.current.commitTransientUpdate((current) => ({ value: current.value + 1 }))
    })

    expect(result.current.state.value).toBe(4)
    expect(result.current.undoStack).toHaveLength(1)
    expect(result.current.undoStack[0].value).toBe(0)
  })

  it("respects history limit", () => {
    const { result } = renderHook(() =>
      useProjectHistory<State>({ value: 0 }, { isEqual: (a, b) => a.value === b.value, limit: 2 }),
    )

    act(() => {
      result.current.applyUpdate(() => ({ value: 1 }))
      result.current.applyUpdate(() => ({ value: 2 }))
      result.current.applyUpdate(() => ({ value: 3 }))
    })

    expect(result.current.undoStack).toHaveLength(2)
    expect(result.current.undoStack[0].value).toBe(1)
    expect(result.current.undoStack[1].value).toBe(2)
  })
})
