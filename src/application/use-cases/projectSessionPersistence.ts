import type { ProjectRepository } from "../ports/ProjectRepository"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import { createDefaultProject } from "../../engine/project/projectModel"
import { createLegacyProjectUseCaseDependencies } from "./legacyProjectUseCaseDependencies"

export type CreateDefaultProject = () => MusicalProject

export function loadProjectSessionInitialProjectWithRepository(
  repository: ProjectRepository,
  createDefault: CreateDefaultProject,
): MusicalProject {
  return repository.load() ?? createDefault()
}

export function getProjectSessionRestoreMessageWithRepository(
  repository: ProjectRepository,
): string {
  const storedProject = repository.load()
  if (!storedProject) return ""

  return getMidiTracks(storedProject.timeline).some(
    (track) => getMidiTrackNotes(track).length > 0,
  )
    ? `Proyecto restaurado: ${storedProject.name}.`
    : ""
}

export function saveProjectSessionWithRepository(
  repository: ProjectRepository,
  project: MusicalProject,
): void {
  repository.save(project)
}

export function loadProjectSessionInitialProject(): MusicalProject {
  const { projects } = createLegacyProjectUseCaseDependencies()
  return loadProjectSessionInitialProjectWithRepository(
    projects,
    createDefaultProject,
  )
}

export function getProjectSessionRestoreMessage(): string {
  const { projects } = createLegacyProjectUseCaseDependencies()
  return getProjectSessionRestoreMessageWithRepository(projects)
}

export function saveProjectSession(project: MusicalProject): void {
  const { projects } = createLegacyProjectUseCaseDependencies()
  saveProjectSessionWithRepository(projects, project)
}
