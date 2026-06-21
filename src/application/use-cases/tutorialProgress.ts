import type { SettingsRepository } from "../ports/SettingsRepository"

export const TUTORIAL_PROGRESS_KEYS = {
  completeSeen: "mimidi-complete-tutorial-seen",
  introSeen: "mimidi-tutorial-seen",
} as const

export function isTutorialSeenWithRepository(
  repository: SettingsRepository,
): boolean {
  return repository.getBoolean(TUTORIAL_PROGRESS_KEYS.introSeen, false)
}

export function markTutorialSeenWithRepository(
  repository: SettingsRepository,
): void {
  repository.setBoolean(TUTORIAL_PROGRESS_KEYS.introSeen, true)
}

export function isCompleteTutorialSeenWithRepository(
  repository: SettingsRepository,
): boolean {
  return repository.getBoolean(TUTORIAL_PROGRESS_KEYS.completeSeen, false)
}

export function markCompleteTutorialSeenWithRepository(
  repository: SettingsRepository,
): void {
  repository.setBoolean(TUTORIAL_PROGRESS_KEYS.completeSeen, true)
}
