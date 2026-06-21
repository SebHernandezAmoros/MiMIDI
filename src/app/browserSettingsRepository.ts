import type { SettingsRepository } from "../application/ports/SettingsRepository"
import { createLocalStorageSettingsRepository } from "../infrastructure/storage/localStorageSettingsRepository"

let browserSettingsRepository: SettingsRepository | null = null

export function getBrowserSettingsRepository(): SettingsRepository {
  browserSettingsRepository ??= createLocalStorageSettingsRepository(localStorage)
  return browserSettingsRepository
}
