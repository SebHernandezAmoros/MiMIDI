import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { createProjectBundleExportWithDependencies } from "../projectBundleTransfer"

describe("project bundle transfer use-cases", () => {
  it("creates a bundle export payload with the current file naming convention", async () => {
    const project = {
      ...createDefaultProject(),
      name: "Mi Demo Bundle",
    }
    const blob = new Blob(["bundle"], { type: "application/zip" })
    const exportBundle = vi.fn().mockResolvedValue(blob)

    const result = await createProjectBundleExportWithDependencies(
      project,
      exportBundle,
    )

    expect(exportBundle).toHaveBeenCalledWith(project)
    expect(result.blob).toBe(blob)
    expect(result.fileName).toBe("mi-demo-bundle.mimidi")
    expect(result.types).toEqual([
      {
        accept: { "application/octet-stream": [".mimidi"] },
        description: "Bundle MiMIDI",
      },
    ])
  })
})
