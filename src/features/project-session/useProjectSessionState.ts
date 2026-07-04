import type { MusicalProject } from "../../domain/project/projectTypes"
import { useProjectHistory } from "../history/useProjectHistory"

const PROJECT_HISTORY_LIMIT = 20

function areProjectsEquivalent(
  firstProject: MusicalProject,
  secondProject: MusicalProject,
) {
  return JSON.stringify(firstProject) === JSON.stringify(secondProject)
}

export function useProjectSessionState(initialProject: MusicalProject) {
  const {
    state: project,
    ...history
  } = useProjectHistory<MusicalProject>(initialProject, {
    isEqual: areProjectsEquivalent,
    limit: PROJECT_HISTORY_LIMIT,
  })

  return {
    project,
    ...history,
  }
}
