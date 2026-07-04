import { describe, expect, it, vi } from "vitest"
import { createProjectFeatureContract } from "../projectFeatureContract"

describe("project feature contract", () => {
  it("keeps the minimal project view data and command groups", () => {
    const input = {
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

    const contract = createProjectFeatureContract(input)

    expect(contract).toBe(input)
    expect(Object.keys(contract)).toEqual([
      "commands",
      "projectName",
      "readModel",
      "status",
    ])
    expect(Object.keys(contract.commands)).toEqual([
      "audio",
      "bundle",
      "metadata",
      "newProject",
      "playback",
    ])
  })
})
