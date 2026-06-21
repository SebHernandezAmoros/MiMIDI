import { createLocalStorageProjectRepository } from "../../infrastructure/storage/localStorageProjectRepository"
import type { MusicalProject } from "./projectModel"

export { PROJECT_STORAGE_KEY } from "../../infrastructure/storage/localStorageProjectRepository"

export function loadStoredProject() {
  return createLocalStorageProjectRepository(window.localStorage).load()
}

export function saveProject(project: MusicalProject) {
  createLocalStorageProjectRepository(window.localStorage).save(project)
}
