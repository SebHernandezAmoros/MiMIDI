import type { ProjectRepository } from "../ports/ProjectRepository"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { getMidiTrackNotes } from "../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import { createDefaultProject } from "../../engine/project/projectModel"
import { createLegacyProjectLoadUseCaseDependencies } from "./legacyProjectLoadUseCaseDependencies"
import { createLegacyProjectSaveUseCaseDependencies } from "./legacyProjectSaveUseCaseDependencies"

export type CreateDefaultProject = () => MusicalProject

export function loadProjectSessionInitialProjectWithRepository(
  repository: Pick<ProjectRepository, "load">,
  createDefault: CreateDefaultProject,
): MusicalProject {
  return repository.load() ?? createDefault()
}

export function getProjectSessionRestoreMessageWithRepository(
  repository: Pick<ProjectRepository, "load">,
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
  repository: Pick<ProjectRepository, "save">,
  project: MusicalProject,
): void {
  repository.save(project)
}

export function loadProjectSessionInitialProject(): MusicalProject {
  const { projects } = createLegacyProjectLoadUseCaseDependencies()
  return loadProjectSessionInitialProjectWithRepository(
    projects,
    createDefaultProject,
  )
}

export function getProjectSessionRestoreMessage(): string {
  const { projects } = createLegacyProjectLoadUseCaseDependencies()
  return getProjectSessionRestoreMessageWithRepository(projects)
}

export function saveProjectSession(project: MusicalProject): void {
  const { projects } = createLegacyProjectSaveUseCaseDependencies()
  saveProjectSessionWithRepository(projects, project)
}
