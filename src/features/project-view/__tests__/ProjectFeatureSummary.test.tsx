import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../projectFeatureContract"
import { ProjectSessionProvider } from "../../project-session/ProjectSessionProvider"
import { ProjectFeatureSummary } from "../ProjectFeatureSummary"

function createProjectFeatureContractFixture(): ProjectFeatureContract {
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
      isNewProjectConfirmOpen: false,
      isPlaying: false,
    },
  }
}

describe("ProjectFeatureSummary", () => {
  it("renders project metadata and forwards name changes", () => {
    const projectFeature = createProjectFeatureContractFixture()
    render(
      <ProjectSessionProvider projectFeature={projectFeature}>
        <ProjectFeatureSummary
          notesLabel="notas"
          projectLabel="Proyecto"
          projectNamePlaceholder="Nombre"
          tracksLabel="pistas"
        />
      </ProjectSessionProvider>,
    )

    const nameInput = screen.getByLabelText("Proyecto")
    expect((nameInput as HTMLInputElement).value).toBe("MiMIDI Project")
    expect(screen.getByText("2 pistas · 1 mix · 3 notas")).not.toBeNull()

    fireEvent.change(nameInput, { target: { value: "Nueva sesion" } })

    expect(projectFeature.commands.metadata.changeProjectName)
      .toHaveBeenCalledWith("Nueva sesion")
  })
})
