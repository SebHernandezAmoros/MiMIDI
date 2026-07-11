import { describe, expect, it, vi } from "vitest"
import type { PluginAudioOutputResult } from "../../../application/use-cases/pluginAudioOutputs"
import { createDefaultProjectWithPluginStates } from "../../../domain/project/projectDefaults"
import {
  getAudioClipTracks,
  getMidiTracks,
} from "../../../domain/project/timelineQueries"
import type { PluginOutput } from "../../../domain/plugins/pluginContracts"
import {
  handlePluginWorkspaceOutput,
  type PluginWorkspaceOutputDependencies,
} from "../pluginWorkspaceOutputs"

function createDependencies(
  audioResult: PluginAudioOutputResult | null = null,
) {
  let project = createDefaultProjectWithPluginStates({})
  const dependencies: PluginWorkspaceOutputDependencies = {
    applyProjectUpdate: vi.fn((updater) => {
      project = updater(project)
    }),
    notifySamplerSlotsChanged: vi.fn(),
    processAudioOutput: vi.fn(async () => audioResult),
    saveFile: vi.fn(),
  }

  return {
    dependencies,
    getProject: () => project,
  }
}

const audioOutput: PluginOutput = {
  blob: new Blob(["audio"]),
  destination: "project",
  duration: 2.5,
  name: "Plugin audio",
  type: "audio",
}

describe("handlePluginWorkspaceOutput", () => {
  it("adds MIDI output as a melodic project track", async () => {
    const { dependencies, getProject } = createDependencies()

    await handlePluginWorkspaceOutput(dependencies, {
      instrumentId: "pure-sine",
      name: "Plugin melody",
      notes: [
        {
          duration: 0.5,
          id: "plugin-note",
          instrumentId: "pure-sine",
          note: "C4",
          startTime: 0,
          velocity: 0.8,
        },
      ],
      type: "midi",
    })

    const track = getMidiTracks(getProject().timeline).at(-1)
    expect(track).toMatchObject({
      instrumentId: "pure-sine",
      name: "Plugin melody",
      trackType: "melodic",
    })
    expect(track?.clips[0]?.notes.map((note) => note.id)).toEqual([
      "plugin-note",
    ])
    expect(dependencies.processAudioOutput).not.toHaveBeenCalled()
  })

  it("adds processed project audio as an AudioClipTrack", async () => {
    const { dependencies, getProject } = createDependencies({
      dbId: "plugin-audio-1",
      duration: 2.5,
      name: "Plugin audio",
      type: "project-track",
    })

    await handlePluginWorkspaceOutput(dependencies, audioOutput)

    expect(dependencies.processAudioOutput).toHaveBeenCalledWith(audioOutput)
    expect(getAudioClipTracks(getProject().timeline).at(-1)).toMatchObject({
      dbId: "plugin-audio-1",
      duration: 2.5,
      name: "Plugin audio",
    })
  })

  it("notifies sampler slot changes after sampler audio is processed", async () => {
    const { dependencies } = createDependencies({ type: "sampler-slot" })

    await handlePluginWorkspaceOutput(dependencies, {
      ...audioOutput,
      destination: "sampler",
    })

    expect(dependencies.notifySamplerSlotsChanged).toHaveBeenCalledTimes(1)
    expect(dependencies.saveFile).not.toHaveBeenCalled()
  })

  it("saves the fallback download when sampler slots are full", async () => {
    const download = {
      blob: new Blob(["fallback"], { type: "audio/webm" }),
      fileName: "Plugin audio.webm",
      type: "download" as const,
      types: [
        {
          accept: { "audio/webm": [".webm"] },
          description: "Audio WebM",
        },
      ],
    }
    const { dependencies } = createDependencies(download)

    await handlePluginWorkspaceOutput(dependencies, {
      ...audioOutput,
      destination: "sampler",
    })

    expect(dependencies.saveFile).toHaveBeenCalledWith(
      download.blob,
      download.fileName,
      download.types,
    )
  })

  it("does nothing when audio processing returns no result", async () => {
    const { dependencies, getProject } = createDependencies()
    const initialProject = getProject()

    await handlePluginWorkspaceOutput(dependencies, audioOutput)

    expect(getProject()).toBe(initialProject)
    expect(dependencies.notifySamplerSlotsChanged).not.toHaveBeenCalled()
    expect(dependencies.saveFile).not.toHaveBeenCalled()
  })
})
