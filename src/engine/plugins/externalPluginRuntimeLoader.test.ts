import { describe, expect, it, vi } from "vitest"
import {
  loadExternalPluginDefinitionFromJavaScript,
  type ExternalPluginRuntimeLoaderDependencies,
} from "./externalPluginRuntimeLoader"

function createDeps(moduleResult: unknown): ExternalPluginRuntimeLoaderDependencies {
  return {
    createObjectUrl: vi.fn(() => "blob:plugin-module"),
    importModule: vi.fn(async () => moduleResult),
    revokeObjectUrl: vi.fn(),
  }
}

describe("externalPluginRuntimeLoader", () => {
  it("loads a plugin definition from a module default export", async () => {
    const definition = {
      id: "runtime-plugin",
      name: "Runtime Plugin",
      version: "1.0.0",
      description: "Loaded dynamically",
      enabledByDefault: false,
    }
    const deps = createDeps({ default: definition })

    const loaded = await loadExternalPluginDefinitionFromJavaScript(
      "export default {}",
      deps,
    )

    expect(loaded).toBe(definition)
    expect(deps.createObjectUrl).toHaveBeenCalledWith(expect.any(Blob))
    expect(deps.importModule).toHaveBeenCalledWith("blob:plugin-module")
    expect(deps.revokeObjectUrl).toHaveBeenCalledWith("blob:plugin-module")
  })

  it("uses the imported module itself when there is no default export", async () => {
    const definition = {
      id: "module-plugin",
      name: "Module Plugin",
      version: "1.0.0",
      description: "Loaded dynamically",
      enabledByDefault: true,
    }
    const deps = createDeps(definition)

    const loaded = await loadExternalPluginDefinitionFromJavaScript(
      "export const id = 'module-plugin'",
      deps,
    )

    expect(loaded).toBe(definition)
  })

  it("revokes the object URL when module import fails", async () => {
    const deps: ExternalPluginRuntimeLoaderDependencies = {
      createObjectUrl: vi.fn(() => "blob:broken-plugin"),
      importModule: vi.fn(async () => {
        throw new Error("import failed")
      }),
      revokeObjectUrl: vi.fn(),
    }

    await expect(
      loadExternalPluginDefinitionFromJavaScript("throw new Error()", deps),
    ).rejects.toThrow("import failed")

    expect(deps.revokeObjectUrl).toHaveBeenCalledWith("blob:broken-plugin")
  })
})
