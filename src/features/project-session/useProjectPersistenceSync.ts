import { useEffect } from "react"
import type { MusicalProject } from "../../domain/project/projectTypes"

type UseProjectPersistenceSyncOptions = {
  project: MusicalProject
  saveProjectSession: (project: MusicalProject) => void
}

export function useProjectPersistenceSync({
  project,
  saveProjectSession,
}: UseProjectPersistenceSyncOptions): void {
  useEffect(() => {
    saveProjectSession(project)
  }, [project, saveProjectSession])
}
