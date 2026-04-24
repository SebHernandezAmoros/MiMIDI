import type { MusicalProject } from "./projectModel"
import { parseImportedProject } from "./projectModel"

export const PROJECT_STORAGE_KEY = "mimidi-project"

export function loadStoredProject() {
  const storedProject = window.localStorage.getItem(PROJECT_STORAGE_KEY)

  if (!storedProject) {
    return null
  }

  try {
    return parseImportedProject(storedProject)
  } catch {
    return null
  }
}

export function saveProject(project: MusicalProject) {
  window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project))
}
