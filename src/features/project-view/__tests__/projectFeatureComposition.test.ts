import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { createProjectFeatureComposition } from "../projectFeatureComposition"

describe("project feature composition", () => {
  it("builds the contract from resolved state and callbacks", () => {
    const project = createDefaultProject()
    const exportBundle = vi.fn()
    const exportWav = vi.fn()
    const openBundleImport = vi.fn()
    const playProject = vi.fn()
    const restartProject = vi.fn()
    const setConfirmOpen = vi.fn()
    const stopPlayback = vi.fn()
    const updateProjectName = vi.fn()
    const status = {
      isExportingAudio: false,
      isMixOnlyPlaying: false,
      isNewProjectConfirmOpen: false,
      isPlaying: false,
    }

    const contract = createProjectFeatureComposition({
      dependencies: {
        exportBundle,
        exportWav,
        openBundleImport,
        playProject,
        restartProject,
        setConfirmOpen,
        stopPlayback,
        updateProjectName,
      },
      project,
      status,
    })

    expect(contract.projectName).toBe(project.name)
    expect(contract.readModel).toEqual({
      hasPlayableContent: false,
      noteCount: 0,
      samplerMixCount: 0,
      trackCount: 3,
    })
    expect(contract.status).toBe(status)

    contract.commands.metadata.changeProjectName("New name")
    contract.commands.audio.exportWav()
    contract.commands.bundle.exportBundle()
    contract.commands.bundle.requestBundleImport()
    contract.commands.newProject.requestNewProject()
    contract.commands.playback.togglePlayback()

    expect(updateProjectName).toHaveBeenCalledWith("New name")
    expect(exportWav).toHaveBeenCalledOnce()
    expect(exportBundle).toHaveBeenCalledOnce()
    expect(openBundleImport).toHaveBeenCalledOnce()
    expect(setConfirmOpen).toHaveBeenCalledWith(true)
    expect(playProject).toHaveBeenCalledOnce()
    expect(restartProject).not.toHaveBeenCalled()
    expect(stopPlayback).not.toHaveBeenCalled()
  })
})
