import React from "react"

export function exposeRuntime() {
  ;(window as unknown as Record<string, unknown>).__MIMIDI_RUNTIME__ = { React }
}
