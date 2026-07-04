import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PluginsCatalogComposition } from "../PluginsCatalogComposition"

const {
  useExternalPlugins,
  useLabPerform,
  useLabProject,
  useLabRecordingSession,
  useMelodicSequencer,
  usePadBeats,
} = vi.hoisted(() => ({
  useExternalPlugins: vi.fn(),
  useLabPerform: vi.fn(() => {
    throw new Error("Plugins catalog must not initialize perform")
  }),
  useLabProject: vi.fn(),
  useLabRecordingSession: vi.fn(() => {
    throw new Error("Plugins catalog must not initialize recording")
  }),
  useMelodicSequencer: vi.fn(() => {
    throw new Error("Plugins catalog must not initialize melodic sequencer")
  }),
  usePadBeats: vi.fn(() => {
    throw new Error("Plugins catalog must not initialize pad beats")
  }),
}))

vi.mock("../../features/lab/useLabProject", () => ({
  useLabProject,
}))

vi.mock("../../features/lab/useLabPerform", () => ({
  useLabPerform,
}))

vi.mock("../../features/lab/useLabRecordingSession", () => ({
  useLabRecordingSession,
}))

vi.mock("../../features/step-sequencer/useMelodicSequencer", () => ({
  useMelodicSequencer,
}))

vi.mock("../../features/pad-sequencer/usePadBeats", () => ({
  usePadBeats,
}))

vi.mock("../../features/plugins-view/useExternalPlugins", () => ({
  useExternalPlugins,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PluginsCatalogComposition", () => {
  it("uses only the project facade and external plugin manager", () => {
    const updatePluginEnabled = vi.fn()
    useLabProject.mockReturnValue({
      applyUpdate: vi.fn(),
      registeredPlugins: [
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
      ],
      updatePluginEnabled,
    })
    useExternalPlugins.mockReturnValue({
      entries: [{ id: "external-tools", isDev: false }],
      installFromFile: vi.fn(),
      installFromFolder: vi.fn(),
      isRestoring: false,
      uninstall: vi.fn(),
    })

    render(
      <PluginsCatalogComposition
        language="es"
        onOpenPlugin={() => undefined}
      />,
    )

    expect(useLabProject).toHaveBeenCalledWith({
      mode: "plugins-only",
      timelineSnapEnabled: false,
      timelineSnapStep: 0.1,
    })
    expect(useExternalPlugins).toHaveBeenCalledOnce()
    expect(useLabRecordingSession).not.toHaveBeenCalled()
    expect(useLabPerform).not.toHaveBeenCalled()
    expect(useMelodicSequencer).not.toHaveBeenCalled()
    expect(usePadBeats).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("checkbox"))
    expect(updatePluginEnabled).toHaveBeenCalledWith("external-tools", false)
  })
})
