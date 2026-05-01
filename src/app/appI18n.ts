import { appMessagesByLanguage } from "../i18n"
import type { AppViewId } from "./appNavigation"

export type AppLanguage = keyof typeof appMessagesByLanguage

export type AppMessages = (typeof appMessagesByLanguage)[AppLanguage]
export type AppViewMessages = AppMessages["views"][AppViewId]

export const defaultAppLanguage: AppLanguage = "es"

export function getAppLanguageFromSearch(search: string): AppLanguage {
  const searchParams = new URLSearchParams(search)
  const requestedLanguage = searchParams.get("lang")

  if (requestedLanguage === "en" || requestedLanguage === "es") {
    return requestedLanguage
  }

  return defaultAppLanguage
}

export function resolveAppMessages(language: AppLanguage) {
  return appMessagesByLanguage[language] ?? appMessagesByLanguage[defaultAppLanguage]
}
