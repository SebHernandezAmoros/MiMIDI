import type { ProjectRepository } from "../../application/ports/ProjectRepository"
import { parseImportedProject } from "../../domain/project/projectParsing"
import type { MusicalProject } from "../../domain/project/projectTypes"

export const PROJECT_STORAGE_KEY = "mimidi-project"

export function createLocalStorageProjectRepository(
  storage: Storage,
): ProjectRepository {
  return {
    load() {
      const storedProject = storage.getItem(PROJECT_STORAGE_KEY)

      if (!storedProject) {
        return null
      }

      try {
        return parseImportedProject(storedProject)
      } catch {
        return null
      }
    },
    save(project: MusicalProject) {
      storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project))
    },
  }
}
