import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { usePluginWorkspaceNotification } from "../usePluginWorkspaceNotification"

describe("usePluginWorkspaceNotification", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows a notification and clears it after the current 3500 ms duration", () => {
    const { result } = renderHook(() => usePluginWorkspaceNotification())

    act(() => {
      result.current.notify("Clip enviado al proyecto")
    })

    expect(result.current.notification).toBe("Clip enviado al proyecto")

    act(() => {
      vi.advanceTimersByTime(3499)
    })
    expect(result.current.notification).toBe("Clip enviado al proyecto")

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.notification).toBe("")
  })

  it("replaces the visible notification and restarts its expiration", () => {
    const { result } = renderHook(() => usePluginWorkspaceNotification())

    act(() => {
      result.current.notify("Primer mensaje")
      vi.advanceTimersByTime(2000)
      result.current.notify("Segundo mensaje")
      vi.advanceTimersByTime(1500)
    })

    expect(result.current.notification).toBe("Segundo mensaje")

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.notification).toBe("")
  })

  it("clears the pending timer when the workspace unmounts", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout")
    const { result, unmount } = renderHook(() =>
      usePluginWorkspaceNotification(),
    )

    act(() => {
      result.current.notify("Mensaje pendiente")
    })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)
  })
})
