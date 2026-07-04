import { describe, expect, it, vi } from "vitest"
import {
  installPluginCatalogFile,
  installPluginCatalogFolder,
  uninstallPluginCatalogEntry,
  type PluginCatalogActionDependencies,
} from "../pluginCatalogActions"

function createDependencies(
  overrides: Partial<PluginCatalogActionDependencies> = {},
): PluginCatalogActionDependencies {
  return {
    installFromFile: vi.fn(async () => ({ id: "file-plugin" })),
    installFromFolder: vi.fn(async () => ({ id: "folder-plugin" })),
    logError: vi.fn(),
    setPluginEnabled: vi.fn(),
    showError: vi.fn(),
    uninstall: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe("pluginCatalogActions", () => {
  it("installs a .mimod file and enables the installed plugin", async () => {
    const dependencies = createDependencies()
    const file = new File(["plugin"], "demo.mimod")

    await installPluginCatalogFile(file, dependencies)

    expect(dependencies.installFromFile).toHaveBeenCalledWith(file)
    expect(dependencies.setPluginEnabled).toHaveBeenCalledWith(
      "file-plugin",
      true,
    )
  })

  it("reports .mimod installation errors with the current copy", async () => {
    const error = new Error("manifest invalido")
    const dependencies = createDependencies({
      installFromFile: vi.fn(async () => {
        throw error
      }),
    })

    await installPluginCatalogFile(
      new File(["plugin"], "broken.mimod"),
      dependencies,
    )

    expect(dependencies.logError).toHaveBeenCalledWith(
      "[IMPORT .mimod]",
      error,
    )
    expect(dependencies.showError).toHaveBeenCalledWith(
      "No se pudo instalar el plugin:\nmanifest invalido",
    )
    expect(dependencies.setPluginEnabled).not.toHaveBeenCalled()
  })

  it("keeps folder picker cancellation silent", async () => {
    const error = new Error("cancelled")
    error.name = "AbortError"
    const dependencies = createDependencies({
      installFromFolder: vi.fn(async () => {
        throw error
      }),
    })

    await installPluginCatalogFolder(dependencies)

    expect(dependencies.logError).not.toHaveBeenCalled()
    expect(dependencies.showError).not.toHaveBeenCalled()
    expect(dependencies.setPluginEnabled).not.toHaveBeenCalled()
  })

  it("uninstalls a plugin before removing its project state", async () => {
    const calls: string[] = []
    const dependencies = createDependencies({
      setPluginEnabled: vi.fn(() => calls.push("state")),
      uninstall: vi.fn(async () => {
        calls.push("uninstall")
      }),
    })

    await uninstallPluginCatalogEntry("external-tools", dependencies)

    expect(calls).toEqual(["uninstall", "state"])
    expect(dependencies.setPluginEnabled).toHaveBeenCalledWith(
      "external-tools",
      undefined,
    )
  })
})
