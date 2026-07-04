import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../projectFeatureContract"
import { ProjectSessionProvider } from "../../project-session/ProjectSessionProvider"
import { ProjectFeatureActions } from "../ProjectFeatureActions"

afterEach(cleanup)

function createProjectFeatureContractFixture(
  overrides: Partial<ProjectFeatureContract> = {},
): ProjectFeatureContract {
  const contract: ProjectFeatureContract = {
    commands: {
      audio: { exportWav: vi.fn() },
      bundle: {
        exportBundle: vi.fn(),
        requestBundleImport: vi.fn(),
      },
      metadata: { changeProjectName: vi.fn() },
      newProject: {
        cancelNewProject: vi.fn(),
        continueWithoutSaving: vi.fn(),
        requestNewProject: vi.fn(),
        saveAndContinue: vi.fn(),
      },
      playback: { togglePlayback: vi.fn() },
    },
    projectName: "MiMIDI Project",
    readModel: {
      hasPlayableContent: true,
      noteCount: 3,
      samplerMixCount: 1,
      trackCount: 2,
    },
    status: {
      isExportingAudio: false,
      isMixOnlyPlaying: false,
      isNewProjectConfirmOpen: false,
      isPlaying: false,
    },
  }

  return {
    ...contract,
    ...overrides,
    readModel: {
      ...contract.readModel,
      ...overrides.readModel,
    },
    status: {
      ...contract.status,
      ...overrides.status,
    },
  }
}

function renderActions(projectFeature: ProjectFeatureContract) {
  render(
    <ProjectSessionProvider projectFeature={projectFeature}>
      <ProjectFeatureActions
        exportBundleLabel="Export bundle"
        exportingLabel="Exporting"
        exportWavLabel="Export WAV"
        importBundleLabel="Import bundle"
        newProjectLabel="New project"
        playLabel="Play"
        stopLabel="Stop"
      />
    </ProjectSessionProvider>,
  )
}

describe("ProjectFeatureActions", () => {
  it("forwards visible project actions to the session contract", () => {
    const projectFeature = createProjectFeatureContractFixture()
    renderActions(projectFeature)

    fireEvent.click(screen.getByRole("button", { name: "Play" }))
    fireEvent.click(screen.getByRole("button", { name: "Export WAV" }))
    fireEvent.click(screen.getByRole("button", { name: "Export bundle" }))
    fireEvent.click(screen.getByRole("button", { name: "Import bundle" }))
    fireEvent.click(screen.getByRole("button", { name: "New project" }))

    expect(projectFeature.commands.playback.togglePlayback).toHaveBeenCalledOnce()
    expect(projectFeature.commands.audio.exportWav).toHaveBeenCalledOnce()
    expect(projectFeature.commands.bundle.exportBundle).toHaveBeenCalledOnce()
    expect(projectFeature.commands.bundle.requestBundleImport).toHaveBeenCalledOnce()
    expect(projectFeature.commands.newProject.requestNewProject).toHaveBeenCalledOnce()
  })

  it("preserves playback and WAV disabled states", () => {
    const projectFeature = createProjectFeatureContractFixture({
      readModel: {
        hasPlayableContent: false,
        noteCount: 3,
        samplerMixCount: 1,
        trackCount: 2,
      },
    })
    renderActions(projectFeature)

    expect((screen.getByRole("button", { name: "Play" }) as HTMLButtonElement).disabled)
      .toBe(true)
    expect((screen.getByRole("button", { name: "Export WAV" }) as HTMLButtonElement).disabled)
      .toBe(true)
  })

  it("shows active playback and audio export states", () => {
    const projectFeature = createProjectFeatureContractFixture({
      readModel: {
        hasPlayableContent: false,
        noteCount: 3,
        samplerMixCount: 1,
        trackCount: 2,
      },
      status: {
        isExportingAudio: true,
        isMixOnlyPlaying: true,
        isNewProjectConfirmOpen: false,
        isPlaying: false,
      },
    })
    renderActions(projectFeature)

    expect((screen.getByRole("button", { name: "Stop" }) as HTMLButtonElement).disabled)
      .toBe(false)
    expect((screen.getByRole("button", { name: "Exporting" }) as HTMLButtonElement).disabled)
      .toBe(true)
  })
})
