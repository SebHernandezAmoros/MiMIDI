import { beforeEach, describe, expect, it } from "vitest"
import { createDefaultProject } from "../projectModel"
import {
  loadStoredProject,
  PROJECT_STORAGE_KEY,
  saveProject,
} from "../projectStorage"

describe("projectStorage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns null when no project is stored", () => {
    expect(loadStoredProject()).toBeNull()
  })

  it("saves and loads a project through localStorage", () => {
    const project = {
      ...createDefaultProject(),
      id: "stored-project",
      name: "Stored Project",
    }

    saveProject(project)

    expect(window.localStorage.getItem(PROJECT_STORAGE_KEY)).toBe(
      JSON.stringify(project),
    )
    expect(loadStoredProject()).toMatchObject({
      id: "stored-project",
      name: "Stored Project",
    })
  })

  it("returns null when stored JSON is invalid", () => {
    window.localStorage.setItem(PROJECT_STORAGE_KEY, "{bad-json")

    expect(loadStoredProject()).toBeNull()
  })

  it("returns null when stored JSON is not a valid MiMIDI project", () => {
    window.localStorage.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify({ id: "bad-project", name: "Bad Project" }),
    )

    expect(loadStoredProject()).toBeNull()
  })
})
