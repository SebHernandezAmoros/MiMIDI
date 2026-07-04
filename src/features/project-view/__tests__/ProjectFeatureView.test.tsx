import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../projectFeatureContract"
import { ProjectFeatureView } from "../ProjectFeatureView"

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
      isNewProjectConfirmOpen: false,
      isPlaying: false,
    },
  }
}

describe("ProjectFeatureView", () => {
  it("mounts the project session boundary and prepared file dependencies", () => {
    const projectFeature = createProjectFeatureContractFixture()
    const bundleInputRef = createRef<HTMLInputElement>()
    const jsonInputRef = createRef<HTMLInputElement>()
    const onBundleChange = vi.fn()
    const onJsonChange = vi.fn()
    render(
      <ProjectFeatureView
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
        fileInputs={{
          bundleInputRef,
          jsonInputRef,
          onBundleChange,
          onJsonChange,
        }}
        newProjectDialog={{
          cancelLabel: "Cancel",
          continueWithoutSavingLabel: "Continue without saving",
          description: "Current work will be replaced.",
          saveAndContinueLabel: "Save and continue",
          title: "New project",
        }}
        projectFeature={projectFeature}
        summary={{
          notesLabel: "notes",
          projectLabel: "Project",
          projectNamePlaceholder: "Name",
          tracksLabel: "tracks",
        }}
      />,
    )

    expect((screen.getByLabelText("Project") as HTMLInputElement).value)
      .toBe("MiMIDI Project")
    fireEvent.click(screen.getByRole("button", { name: "Play" }))
    expect(projectFeature.commands.playback.togglePlayback).toHaveBeenCalledOnce()

    expect(bundleInputRef.current?.accept).toBe(".mimidi")
    expect(jsonInputRef.current?.accept).toBe(".json,application/json")
    fireEvent.change(bundleInputRef.current as HTMLInputElement)
    fireEvent.change(jsonInputRef.current as HTMLInputElement)
    expect(onBundleChange).toHaveBeenCalledOnce()
    expect(onJsonChange).toHaveBeenCalledOnce()
  })
})
