import { describe, expect, it, vi } from "vitest"
import { createProjectFeatureBundleCommands } from "../projectFeatureBundleCommands"

describe("project feature bundle commands", () => {
  it("starts the bundle export", () => {
    const exportBundle = vi.fn()
    const commands = createProjectFeatureBundleCommands({
      exportBundle,
      openBundleImport: vi.fn(),
    })

    commands.exportBundle()

    expect(exportBundle).toHaveBeenCalledOnce()
  })

  it("requests the bundle import selector", () => {
    const openBundleImport = vi.fn()
    const commands = createProjectFeatureBundleCommands({
      exportBundle: vi.fn(),
      openBundleImport,
    })

    commands.requestBundleImport()

    expect(openBundleImport).toHaveBeenCalledOnce()
  })
})
