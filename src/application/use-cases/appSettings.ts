import type { SettingsRepository } from "../ports/SettingsRepository"

export const APP_SETTING_KEYS = {
  darkMode: "mimidi-dark-mode",
  masterVolume: "mimidi-master-volume",
  showKeyLabels: "mimidi-show-key-labels",
} as const

export type AppSettings = {
  darkMode: boolean
  masterVolume: number
  showKeyLabels: boolean
}

export function loadAppSettingsWithRepository(
  settings: SettingsRepository,
): AppSettings {
  return {
    darkMode: settings.getBoolean(APP_SETTING_KEYS.darkMode, false),
    masterVolume: settings.getNumber(APP_SETTING_KEYS.masterVolume, 0.8),
    showKeyLabels: settings.getBoolean(APP_SETTING_KEYS.showKeyLabels, true),
  }
}

export function saveDarkModeWithRepository(
  settings: SettingsRepository,
  value: boolean,
): void {
  settings.setBoolean(APP_SETTING_KEYS.darkMode, value)
}

export function saveShowKeyLabelsWithRepository(
  settings: SettingsRepository,
  value: boolean,
): void {
  settings.setBoolean(APP_SETTING_KEYS.showKeyLabels, value)
}

export function saveMasterVolumeWithRepository(
  settings: SettingsRepository,
  value: number,
): void {
  settings.setNumber(APP_SETTING_KEYS.masterVolume, value)
}
