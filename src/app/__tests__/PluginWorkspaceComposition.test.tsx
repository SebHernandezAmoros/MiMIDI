import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../engine/project/projectModel"
import { PluginWorkspaceComposition } from "../PluginWorkspaceComposition"

const {
  createPluginWorkspaceClipStorage,
  handlePluginWorkspaceOutput,
  loadPluginClip,
  playNote,
  processPluginAudioOutput,
  saveFile,
  stopNote,
  storePluginClip,
  usePluginWorkspaceAPI,
  usePluginWorkspaceNotePreview,
  usePluginWorkspaceNotification,
  useProjectPerformanceComposition,
  useProjectPlaybackComposition,
} = vi.hoisted(() => ({
  createPluginWorkspaceClipStorage: vi.fn(),
  handlePluginWorkspaceOutput: vi.fn(),
  loadPluginClip: vi.fn(),
  playNote: vi.fn(),
  processPluginAudioOutput: vi.fn(),
  saveFile: vi.fn(),
  stopNote: vi.fn(),
  storePluginClip: vi.fn(),
  usePluginWorkspaceAPI: vi.fn(),
  usePluginWorkspaceNotePreview: vi.fn(),
  usePluginWorkspaceNotification: vi.fn(),
  useProjectPerformanceComposition: vi.fn(),
  useProjectPlaybackComposition: vi.fn(),
}))

vi.mock("../useProjectPlaybackComposition", () => ({
  useProjectPlaybackComposition,
}))

vi.mock("../useProjectPerformanceComposition", () => ({
  useProjectPerformanceComposition,
}))

vi.mock("../../features/plugins-view/usePluginWorkspaceNotification", () => ({
  usePluginWorkspaceNotification,
}))

vi.mock("../../features/plugins-view/usePluginWorkspaceNotePreview", () => ({
  usePluginWorkspaceNotePreview,
}))

vi.mock("../../features/plugins-view/pluginWorkspaceClipStorage", () => ({
  createPluginWorkspaceClipStorage,
}))

vi.mock("../../features/plugins-view/pluginWorkspaceOutputs", () => ({
  handlePluginWorkspaceOutput,
}))

vi.mock("../../features/plugins-view/usePluginWorkspaceAPI", () => ({
  usePluginWorkspaceAPI,
}))

vi.mock("../../application/use-cases/pluginAudioOutputs", () => ({
  loadPluginClip,
  processPluginAudioOutput,
  storePluginClip,
}))

vi.mock("../../application/use-cases/playNote", () => ({
  playNote,
  stopNote,
}))

vi.mock("../../application/use-cases/saveFile", () => ({
  saveFile,
}))

vi.mock("../../features/plugins-view/PluginWorkspaceView", () => ({
  PluginWorkspaceView: ({
    language,
    pluginId,
  }: {
    language: string
    pluginId: string
  }) => <div>{`${language}:${pluginId}`}</div>,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PluginWorkspaceComposition", () => {
  it("mounts the workspace from the shared project and performance boundaries", () => {
    const project = createDefaultProject()
    const applyUpdate = vi.fn()
    const projectSession = { applyUpdate, project }
    const playback = { playbackTransport: { isPlaying: true } }
    const triggerSmcPad = vi.fn()
    const performanceComposition = {
      instrumentCatalog: { availableInstruments: [{ id: "pure-sine" }] },
      performance: { triggerSmcPad },
      recording: { recordingState: "idle" },
    }
    const notify = vi.fn()
    const preview = { playNote: vi.fn(), stopNote: vi.fn() }
    const clipStorage = {
      loadClip: vi.fn(),
      storeClip: vi.fn(),
    }
    const api = { project: {} }
    useProjectPlaybackComposition.mockReturnValue({
      playback,
      projectSession,
    })
    useProjectPerformanceComposition.mockReturnValue(performanceComposition)
    usePluginWorkspaceNotification.mockReturnValue({
      notification: "Plugin ready",
      notify,
    })
    usePluginWorkspaceNotePreview.mockReturnValue(preview)
    createPluginWorkspaceClipStorage.mockReturnValue(clipStorage)
    usePluginWorkspaceAPI.mockReturnValue(api)

    render(
      <PluginWorkspaceComposition language="en" pluginId="demo-plugin" />,
    )

    expect(useProjectPlaybackComposition).toHaveBeenCalledWith({
      mode: "plugin-workspace",
      timelineSnapEnabled: false,
      timelineSnapStep: 0.1,
    })
    expect(useProjectPerformanceComposition).toHaveBeenCalledWith({
      projectSession,
    })
    expect(usePluginWorkspaceNotePreview).toHaveBeenCalledWith(
      expect.objectContaining({
        instruments: performanceComposition.instrumentCatalog.availableInstruments,
        stopVoice: stopNote,
      }),
    )
    expect(createPluginWorkspaceClipStorage).toHaveBeenCalledWith({
      loadClip: loadPluginClip,
      storeClip: storePluginClip,
    })

    const apiDependencies = usePluginWorkspaceAPI.mock.calls[0][0]
    apiDependencies.audio.triggerPad("kick", 0.7)
    expect(triggerSmcPad).toHaveBeenCalledWith("kick", 0.7)
    expect(apiDependencies.notify).toBe(notify)
    expect(apiDependencies.session.loadClip).toBe(clipStorage.loadClip)
    expect(apiDependencies.session.storeClip).toBe(clipStorage.storeClip)
    expect(apiDependencies.transport).toEqual({
      isPlaying: true,
      isRecording: false,
    })
    expect(screen.getByText("en:demo-plugin")).toBeTruthy()
  })
})
