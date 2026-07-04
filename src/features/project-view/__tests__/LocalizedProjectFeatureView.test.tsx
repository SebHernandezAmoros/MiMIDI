import { createRef } from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../projectFeatureContract"
import { LocalizedProjectFeatureView } from "../LocalizedProjectFeatureView"

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
    projectName: "Project",
    readModel: {
      hasPlayableContent: true,
      noteCount: 1,
      samplerMixCount: 0,
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

describe("LocalizedProjectFeatureView", () => {
  it("owns Project View labels while preserving prepared dependencies", () => {
    const bundleInputRef = createRef<HTMLInputElement>()
    const jsonInputRef = createRef<HTMLInputElement>()
    const onBundleChange = vi.fn()
    const onJsonChange = vi.fn()

    render(
      <LocalizedProjectFeatureView
        fileInputs={{
          bundleInputRef,
          jsonInputRef,
          onBundleChange,
          onJsonChange,
        }}
        language="en"
        projectFeature={createProjectFeatureContractFixture()}
      />,
    )

    expect(screen.getByRole("button", { name: "Play" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Export WAV" })).not.toBeNull()
    expect(screen.getByLabelText("Project")).not.toBeNull()
    expect(bundleInputRef.current?.accept).toBe(".mimidi")
    expect(jsonInputRef.current?.accept).toBe(".json,application/json")
  })
})
