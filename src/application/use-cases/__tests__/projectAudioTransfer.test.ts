import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { createProjectAudioExportWithDependencies } from "../projectAudioTransfer"

describe("project audio transfer use-cases", () => {
  it("creates an audio export payload with current WAV options and file picker types", async () => {
    const project = createDefaultProject()
    const blob = new Blob(["wav"], { type: "audio/wav" })
    const exportAudio = vi.fn().mockResolvedValue({
      blob,
      duration: 1.25,
      fileName: "demo.wav",
    })

    const result = await createProjectAudioExportWithDependencies(
      project,
      0.7,
      exportAudio,
    )

    expect(exportAudio).toHaveBeenCalledWith(project, {
      bitDepth: 32,
      float: true,
      masterVolume: 0.7,
    })
    expect(result).toEqual({
      blob,
      duration: 1.25,
      fileName: "demo.wav",
      types: [
        {
          accept: { "audio/wav": [".wav"] },
          description: "Audio WAV",
        },
      ],
    })
  })
})
