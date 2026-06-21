import type { MusicalProject } from "../../domain/project/projectTypes"

export type ProjectRepository = {
  load(): MusicalProject | null
  save(project: MusicalProject): void
}
