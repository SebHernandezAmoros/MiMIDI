import { describe, expect, it, vi } from "vitest"
import { createProjectFeatureAudioCommands } from "../projectFeatureAudioCommands"

describe("project feature audio commands", () => {
  it("starts the WAV export", () => {
    const exportWav = vi.fn()
    const commands = createProjectFeatureAudioCommands({
      exportWav,
    })

    commands.exportWav()

    expect(exportWav).toHaveBeenCalledOnce()
  })
})
