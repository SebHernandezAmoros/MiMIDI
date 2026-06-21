import { describe, expect, it, vi } from "vitest"
import type { ProjectRepository } from "../../ports/ProjectRepository"
import {
  getProjectSessionRestoreMessageWithRepository,
  loadProjectSessionInitialProjectWithRepository,
  saveProjectSessionWithRepository,
} from "../projectSessionPersistence"
import {
  appendNoteToTrack,
  createDefaultProject,
  getMidiTracks,
} from "../../../engine/project/projectModel"

function createProjectRepository(
  overrides: Partial<ProjectRepository> = {},
): ProjectRepository {
  return {
    load: vi.fn(),
    save: vi.fn(),
    ...overrides,
  }
}

describe("project session persistence use-cases", () => {
  it("loads the stored project when one exists", () => {
    const storedProject = createDefaultProject()
    const repository = createProjectRepository({
      load: vi.fn().mockReturnValue(storedProject),
    })
    const createDefault = vi.fn()

    const result = loadProjectSessionInitialProjectWithRepository(
      repository,
      createDefault,
    )

    expect(result).toBe(storedProject)
    expect(createDefault).not.toHaveBeenCalled()
  })

  it("creates a default project when no stored project exists", () => {
    const defaultProject = createDefaultProject()
    const repository = createProjectRepository({
      load: vi.fn().mockReturnValue(null),
    })
    const createDefault = vi.fn().mockReturnValue(defaultProject)

    const result = loadProjectSessionInitialProjectWithRepository(
      repository,
      createDefault,
    )

    expect(result).toBe(defaultProject)
    expect(createDefault).toHaveBeenCalledOnce()
  })

  it("builds a restore message only when the stored project has notes", () => {
    const emptyProject = createDefaultProject()
    const emptyRepository = createProjectRepository({
      load: vi.fn().mockReturnValue(emptyProject),
    })

    expect(getProjectSessionRestoreMessageWithRepository(emptyRepository)).toBe(
      "",
    )

    const trackId = getMidiTracks(emptyProject.timeline)[0].id
    const projectWithNotes = appendNoteToTrack(emptyProject, trackId, {
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 0,
      velocity: 0.8,
    })
    const repositoryWithNotes = createProjectRepository({
      load: vi.fn().mockReturnValue(projectWithNotes),
    })

    expect(
      getProjectSessionRestoreMessageWithRepository(repositoryWithNotes),
    ).toBe(`Proyecto restaurado: ${projectWithNotes.name}.`)
  })

  it("saves the current project through the repository", () => {
    const project = createDefaultProject()
    const repository = createProjectRepository()

    saveProjectSessionWithRepository(repository, project)

    expect(repository.save).toHaveBeenCalledWith(project)
  })
})
