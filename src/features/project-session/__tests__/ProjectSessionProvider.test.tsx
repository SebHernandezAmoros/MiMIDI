import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ProjectFeatureContract } from "../../project-view/projectFeatureContract"
import { ProjectSessionProvider } from "../ProjectSessionProvider"
import { useProjectSession } from "../useProjectSession"

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
      hasPlayableContent: false,
      noteCount: 0,
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

describe("ProjectSessionProvider", () => {
  it("provides the current Project View contract", () => {
    const projectFeature = createProjectFeatureContractFixture()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ProjectSessionProvider projectFeature={projectFeature}>
        {children}
      </ProjectSessionProvider>
    )

    const { result } = renderHook(() => useProjectSession(), { wrapper })

    expect(result.current.projectFeature).toBe(projectFeature)
  })

  it("rejects consumers outside the provider", () => {
    expect(() => renderHook(() => useProjectSession())).toThrow(
      "useProjectSession must be used within ProjectSessionProvider",
    )
  })
})
