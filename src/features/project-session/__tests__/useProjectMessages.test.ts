import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useProjectMessages } from "../useProjectMessages"

describe("useProjectMessages", () => {
  it("owns the project message state with lazy initialization", () => {
    const getInitialMessage = vi.fn(() => "Proyecto restaurado.")
    const { result, rerender } = renderHook(() =>
      useProjectMessages(getInitialMessage),
    )

    expect(result.current.projectMessage).toBe("Proyecto restaurado.")
    expect(getInitialMessage).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.setProjectMessage("Proyecto actualizado.")
    })
    rerender()

    expect(result.current.projectMessage).toBe("Proyecto actualizado.")
    expect(getInitialMessage).toHaveBeenCalledTimes(1)
  })
})
