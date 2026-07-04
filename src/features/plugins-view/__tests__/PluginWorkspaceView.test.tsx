import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { MiMIDIPluginAPI } from "../../../plugin-host/pluginHostModel"
import { PluginWorkspaceView } from "../PluginWorkspaceView"

const { PluginWorkspaceHost } = vi.hoisted(() => ({
  PluginWorkspaceHost: vi.fn(() => <div>Plugin workspace host</div>),
}))

vi.mock("../PluginWorkspaceHost", () => ({
  PluginWorkspaceHost,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PluginWorkspaceView", () => {
  it("renders the workspace host and current notification", () => {
    const api = {} as MiMIDIPluginAPI

    render(
      <PluginWorkspaceView
        api={api}
        language="es"
        notification="Clip enviado al proyecto"
        pluginId="demo-plugin"
      />,
    )

    expect(PluginWorkspaceHost).toHaveBeenCalledWith(
      {
        api,
        language: "es",
        pluginId: "demo-plugin",
      },
      undefined,
    )
    expect(screen.getByText("Plugin workspace host")).not.toBeNull()
    expect(screen.getByRole("status").textContent).toBe(
      "Clip enviado al proyecto",
    )
  })

  it("does not render an empty notification", () => {
    render(
      <PluginWorkspaceView
        api={{} as MiMIDIPluginAPI}
        language="en"
        notification=""
        pluginId="demo-plugin"
      />,
    )

    expect(screen.queryByRole("status")).toBeNull()
  })
})
