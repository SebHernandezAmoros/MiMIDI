import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../projectFeatureContract"
import { ProjectSessionProvider } from "../../project-session/ProjectSessionProvider"
import { ProjectFeatureRoot } from "../ProjectFeatureRoot"

afterEach(cleanup)

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
      isNewProjectConfirmOpen: true,
      isPlaying: false,
    },
  }
}

describe("ProjectFeatureRoot", () => {
  it("composes the project screen, file inputs and confirmation dialog", () => {
    const projectFeature = createProjectFeatureContractFixture()
    const { container } = render(
      <ProjectSessionProvider projectFeature={projectFeature}>
        <ProjectFeatureRoot
          actions={{
            exportBundleLabel: "Export bundle",
            exportingLabel: "Exporting",
            exportWavLabel: "Export WAV",
            importBundleLabel: "Import bundle",
            newProjectLabel: "New project",
            playLabel: "Play",
            stopLabel: "Stop",
          }}
          currentProjectLabel="Current project"
          newProjectDialog={{
            cancelLabel: "Cancel",
            continueWithoutSavingLabel: "Continue without saving",
            description: "Current work will be replaced.",
            saveAndContinueLabel: "Save and continue",
            title: "New project",
          }}
          summary={{
            notesLabel: "notes",
            projectLabel: "Project",
            projectNamePlaceholder: "Name",
            tracksLabel: "tracks",
          }}
        >
          <input data-testid="project-json-input" hidden type="file" />
        </ProjectFeatureRoot>
      </ProjectSessionProvider>,
    )

    const screenSection = screen.getByLabelText("Current project")
    expect(screenSection.contains(screen.getByTestId("project-json-input"))).toBe(true)
    expect((screen.getByLabelText("Project") as HTMLInputElement).value)
      .toBe("MiMIDI Project")
    expect(screen.getByRole("button", { name: "Play" })).not.toBeNull()
    expect(screen.getByRole("dialog", { hidden: true }).textContent)
      .toContain("Current work will be replaced.")
    expect(container.querySelector(".project-compact-divider")).not.toBeNull()
  })
})
