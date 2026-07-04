import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PluginsWorkspace } from "../PluginsWorkspace"

afterEach(() => {
  cleanup()
  window.history.replaceState({}, "", "/")
})

describe("PluginsWorkspace", () => {
  it("renders plugin catalog content supplied by the app composition root", () => {
    window.history.replaceState({}, "", "/?view=plugins")

    render(
      <PluginsWorkspace
        body="Plugins body"
        pluginsContent={<div>Independent plugins catalog</div>}
        renderPluginWorkspace={() => null}
        title="Plugins title"
      />,
    )

    expect(screen.getByText("Independent plugins catalog")).not.toBeNull()
  })

  it("renders the supplied plugin workspace for the pluginId in the URL", () => {
    window.history.replaceState({}, "", "/?view=plugins&pluginId=demo-plugin")
    const renderPluginWorkspace = vi.fn((pluginId: string) => (
      <div>Workspace {pluginId}</div>
    ))

    render(
      <PluginsWorkspace
        body="Plugins body"
        pluginsContent={<div>Plugins catalog</div>}
        renderPluginWorkspace={renderPluginWorkspace}
        title="Plugins title"
      />,
    )

    expect(renderPluginWorkspace).toHaveBeenCalledWith("demo-plugin")
    expect(screen.getByText("Workspace demo-plugin")).not.toBeNull()
  })
})
