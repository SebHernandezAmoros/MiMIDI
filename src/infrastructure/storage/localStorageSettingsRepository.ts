import type { SettingsRepository } from "../../application/ports/SettingsRepository"

export function createLocalStorageSettingsRepository(
  storage: Storage,
): SettingsRepository {
  return {
    getBoolean(key, fallback) {
      const stored = storage.getItem(key)
      return stored === null ? fallback : stored === "true"
    },
    setBoolean(key, value) {
      storage.setItem(key, String(value))
    },
    getNumber(key, fallback) {
      const stored = storage.getItem(key)
      return stored === null ? fallback : Number.parseFloat(stored)
    },
    setNumber(key, value) {
      storage.setItem(key, String(value))
    },
    getString(key, fallback) {
      return storage.getItem(key) ?? fallback
    },
    setString(key, value) {
      storage.setItem(key, value)
    },
    remove(key) {
      storage.removeItem(key)
    },
  }
}
