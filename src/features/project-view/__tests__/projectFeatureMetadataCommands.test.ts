import { describe, expect, it, vi } from "vitest"
import { createProjectFeatureMetadataCommands } from "../projectFeatureMetadataCommands"

describe("project feature metadata commands", () => {
  it("forwards the project name without changing its value", () => {
    const updateProjectName = vi.fn()
    const commands = createProjectFeatureMetadataCommands({
      updateProjectName,
    })

    commands.changeProjectName("  Session Name  ")

    expect(updateProjectName).toHaveBeenCalledWith("  Session Name  ")
  })
})
