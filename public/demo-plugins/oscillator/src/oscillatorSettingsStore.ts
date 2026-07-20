import {
  getOscillatorPreset,
  normalizeOscillatorSettings,
  type OscillatorSettings,
} from "./oscillatorModel"

const STORAGE_KEY = "mimidi-plugin-oscillator-settings"

function canUseStorage() {
  return typeof localStorage !== "undefined"
}

export function getDefaultOscillatorSettings(): OscillatorSettings {
  return getOscillatorPreset("warm")
}

export function loadOscillatorSettings(): OscillatorSettings {
  if (!canUseStorage()) return getDefaultOscillatorSettings()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultOscillatorSettings()
    return normalizeOscillatorSettings(JSON.parse(raw) as Partial<OscillatorSettings>)
  } catch {
    return getDefaultOscillatorSettings()
  }
}

export function saveOscillatorSettings(settings: Partial<OscillatorSettings>): OscillatorSettings {
  const normalized = normalizeOscillatorSettings(settings)
  if (!canUseStorage()) return normalized

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // Storage can be unavailable in private modes; the plugin keeps working in memory.
  }

  return normalized
}

export function clearOscillatorSettingsForTest() {
  if (!canUseStorage()) return
  localStorage.removeItem(STORAGE_KEY)
}
