import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { RegisteredPluginSummary } from "../../../engine/plugins/pluginRegistry"
import { PluginsCatalogList } from "../PluginsCatalogList"

afterEach(cleanup)

const plugins: RegisteredPluginSummary[] = [
  {
    description: "External tools",
    enabled: true,
    enabledByDefault: false,
    hasWorkspace: true,
    id: "external-tools",
    instrumentCount: 1,
    isExternal: true,
    name: "External Tools",
    version: "1.0.0",
  },
]

describe("PluginsCatalogList", () => {
  it("delegates enable, uninstall and workspace actions", () => {
    const onPluginEnabledChange = vi.fn()
    const onPluginUninstall = vi.fn()
    const onOpenPlugin = vi.fn()

    render(
      <PluginsCatalogList
        externalPluginEntries={[{ id: "external-tools", isDev: false }]}
        isRestoring={false}
        language="es"
        onOpenPlugin={onOpenPlugin}
        onPluginEnabledChange={onPluginEnabledChange}
        onPluginUninstall={onPluginUninstall}
        plugins={plugins}
      />,
    )

    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(screen.getByRole("button", { name: "Desinstalar External Tools" }))
    fireEvent.click(screen.getByRole("button", { name: "Abrir External Tools" }))

    expect(onPluginEnabledChange).toHaveBeenCalledWith("external-tools", false)
    expect(onPluginUninstall).toHaveBeenCalledWith("external-tools")
    expect(onOpenPlugin).toHaveBeenCalledWith("external-tools")
  })

  it("keeps restore feedback and development metadata visible", () => {
    render(
      <PluginsCatalogList
        externalPluginEntries={[{ id: "external-tools", isDev: true }]}
        isRestoring
        language="es"
        onPluginEnabledChange={() => undefined}
        onPluginUninstall={() => undefined}
        plugins={plugins}
      />,
    )

    expect(screen.getByText("Restaurando plugins...")).not.toBeNull()
    expect(screen.getByText(/dev/)).not.toBeNull()
  })
})
