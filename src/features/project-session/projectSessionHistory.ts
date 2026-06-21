import type { MusicalProject } from "../../domain/project/projectTypes"
import { resolveProjectChangeActiveTrackId } from "../../application/use-cases/projectSelection"
import {
  formatRedoAppliedMessage,
  formatRedoUnavailableMessage,
  formatUndoAppliedMessage,
  formatUndoUnavailableMessage,
} from "./projectSessionMessages"

export type ProjectHistoryActionResolution =
  | {
      applied: false
      message: string
    }
  | {
      activeTrackId: string
      applied: true
      message: string
      project: MusicalProject
    }

export function resolveUndoProjectHistoryAction(
  previousProject: MusicalProject | null | undefined,
  currentActiveTrackId: string,
): ProjectHistoryActionResolution {
  if (!previousProject) {
    return {
      applied: false,
      message: formatUndoUnavailableMessage(),
    }
  }

  return {
    activeTrackId: resolveProjectChangeActiveTrackId(
      previousProject,
      currentActiveTrackId,
    ),
    applied: true,
    message: formatUndoAppliedMessage(),
    project: previousProject,
  }
}

export function resolveRedoProjectHistoryAction(
  nextProject: MusicalProject | null | undefined,
  currentActiveTrackId: string,
): ProjectHistoryActionResolution {
  if (!nextProject) {
    return {
      applied: false,
      message: formatRedoUnavailableMessage(),
    }
  }

  return {
    activeTrackId: resolveProjectChangeActiveTrackId(
      nextProject,
      currentActiveTrackId,
    ),
    applied: true,
    message: formatRedoAppliedMessage(),
    project: nextProject,
  }
}
