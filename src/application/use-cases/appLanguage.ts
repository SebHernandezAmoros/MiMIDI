import type { SettingsRepository } from "../ports/SettingsRepository"

export type SupportedAppLanguage = "en" | "es"

export const APP_LANGUAGE_KEY = "mimidi-language"
export const DEFAULT_APP_LANGUAGE: SupportedAppLanguage = "es"

function isSupportedLanguage(value: string | null): value is SupportedAppLanguage {
  return value === "en" || value === "es"
}

export function getAppLanguageFromSearchWithRepository(
  search: string,
  settings: SettingsRepository,
): SupportedAppLanguage {
  const searchParams = new URLSearchParams(search)
  const requestedLanguage = searchParams.get("lang")

  if (isSupportedLanguage(requestedLanguage)) {
    settings.setString(APP_LANGUAGE_KEY, requestedLanguage)
    return requestedLanguage
  }

  const storedLanguage = settings.getString(
    APP_LANGUAGE_KEY,
    DEFAULT_APP_LANGUAGE,
  )

  return isSupportedLanguage(storedLanguage)
    ? storedLanguage
    : DEFAULT_APP_LANGUAGE
}
