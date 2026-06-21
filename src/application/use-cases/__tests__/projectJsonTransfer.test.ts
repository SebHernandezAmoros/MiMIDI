import { describe, expect, it, vi } from "vitest"
import {
  createProjectJsonExport,
  importProjectJsonFileWithParser,
} from "../projectJsonTransfer"
import { createDefaultProject } from "../../../engine/project/projectModel"

describe("project JSON transfer use-cases", () => {
  it("creates a JSON export payload with the current file naming convention", async () => {
    const project = {
      ...createDefaultProject(),
      name: "Mi Demo Song",
    }

    const result = createProjectJsonExport(project)

    expect(result.fileName).toBe("mi-demo-song.json")
    expect(result.blob.type).toBe("application/json")
    expect(await result.blob.text()).toBe(JSON.stringify(project, null, 2))
    expect(result.types).toEqual([
      {
        accept: { "application/json": [".json"] },
        description: "Proyecto MiMIDI",
      },
    ])
  })

  it("imports a project JSON file with an injected parser", async () => {
    const project = createDefaultProject()
    const parseProject = vi.fn().mockReturnValue(project)
    const file = {
      text: vi.fn().mockResolvedValue("{\"name\":\"Imported\"}"),
    }

    const result = await importProjectJsonFileWithParser(file, parseProject)

    expect(file.text).toHaveBeenCalledOnce()
    expect(parseProject).toHaveBeenCalledWith("{\"name\":\"Imported\"}")
    expect(result).toBe(project)
  })
})
