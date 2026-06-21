import {
  isCompleteTutorialSeenWithRepository,
  isTutorialSeenWithRepository,
  markCompleteTutorialSeenWithRepository,
  markTutorialSeenWithRepository,
} from "../../application/use-cases/tutorialProgress"
import { createLocalStorageSettingsRepository } from "../../infrastructure/storage/localStorageSettingsRepository"

function getTutorialSettingsRepository() {
  return createLocalStorageSettingsRepository(localStorage)
}

export function isTutorialSeen(): boolean {
  return isTutorialSeenWithRepository(getTutorialSettingsRepository())
}

export function markTutorialSeen(): void {
  markTutorialSeenWithRepository(getTutorialSettingsRepository())
}

export function isCompleteTutorialSeen(): boolean {
  return isCompleteTutorialSeenWithRepository(getTutorialSettingsRepository())
}

export function markCompleteTutorialSeen(): void {
  markCompleteTutorialSeenWithRepository(getTutorialSettingsRepository())
}
