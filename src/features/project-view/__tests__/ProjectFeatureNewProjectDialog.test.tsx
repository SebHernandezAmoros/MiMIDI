import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../projectFeatureContract"
import { ProjectSessionProvider } from "../../project-session/ProjectSessionProvider"
import { ProjectFeatureNewProjectDialog } from "../ProjectFeatureNewProjectDialog"

afterEach(cleanup)

function createProjectFeatureContractFixture(
  isNewProjectConfirmOpen: boolean,
): ProjectFeatureContract {
  return {
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
      isNewProjectConfirmOpen,
      isPlaying: false,
    },
  }
}

function renderDialog(projectFeature: ProjectFeatureContract) {
  render(
    <ProjectSessionProvider projectFeature={projectFeature}>
      <ProjectFeatureNewProjectDialog
        cancelLabel="Cancel"
        continueWithoutSavingLabel="Continue without saving"
        description="Current work will be replaced."
        saveAndContinueLabel="Save and continue"
        title="New project"
      />
    </ProjectSessionProvider>,
  )
}

describe("ProjectFeatureNewProjectDialog", () => {
  it("stays hidden while confirmation is closed", () => {
    renderDialog(createProjectFeatureContractFixture(false))

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("renders the confirmation and forwards its actions", () => {
    const projectFeature = createProjectFeatureContractFixture(true)
    renderDialog(projectFeature)

    expect(screen.getByRole("dialog", { hidden: true }).textContent)
      .toContain("Current work will be replaced.")

    fireEvent.click(screen.getByRole("button", { hidden: true, name: "Cancel" }))
    fireEvent.click(screen.getByRole("button", {
      hidden: true,
      name: "Continue without saving",
    }))
    fireEvent.click(screen.getByRole("button", {
      hidden: true,
      name: "Save and continue",
    }))

    expect(projectFeature.commands.newProject.cancelNewProject).toHaveBeenCalledOnce()
    expect(projectFeature.commands.newProject.continueWithoutSaving).toHaveBeenCalledOnce()
    expect(projectFeature.commands.newProject.saveAndContinue).toHaveBeenCalledOnce()
  })

  it("cancels when the dialog backdrop is clicked", () => {
    const projectFeature = createProjectFeatureContractFixture(true)
    renderDialog(projectFeature)

    const backdrop = screen.getByRole("dialog", { hidden: true }).parentElement
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop as HTMLElement)

    expect(projectFeature.commands.newProject.cancelNewProject).toHaveBeenCalledOnce()
  })
})
