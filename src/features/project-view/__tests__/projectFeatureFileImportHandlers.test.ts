import type { ChangeEvent } from "react"
import { describe, expect, it, vi } from "vitest"
import { createProjectFeatureFileImportHandlers } from "../projectFeatureFileImportHandlers"

describe("createProjectFeatureFileImportHandlers", () => {
  it("tears down the active session before importing JSON and bundle files", async () => {
    const calls: string[] = []
    const importBundle = vi.fn(async () => {
      calls.push("import-bundle")
    })
    const importProjectFile = vi.fn(async () => {
      calls.push("import-json")
    })
    const tearDownSession = vi.fn(() => {
      calls.push("tear-down")
    })
    const handlers = createProjectFeatureFileImportHandlers({
      importBundle,
      importProjectFile,
      tearDownSession,
    })
    const jsonEvent = {
      target: { value: "project.json" },
    } as ChangeEvent<HTMLInputElement>
    const bundleEvent = {
      target: { value: "project.mimidi" },
    } as ChangeEvent<HTMLInputElement>

    await handlers.importProjectFile(jsonEvent)
    expect(calls).toEqual(["tear-down", "import-json"])
    expect(importProjectFile).toHaveBeenCalledWith(jsonEvent)

    calls.length = 0
    await handlers.importBundle(bundleEvent)
    expect(calls).toEqual(["tear-down", "import-bundle"])
    expect(importBundle).toHaveBeenCalledWith(bundleEvent)
  })
})
