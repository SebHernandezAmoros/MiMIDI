import { appMessagesByLanguage } from "../i18n"
import { getAppLanguageFromSearchWithRepository } from "../application/use-cases/appLanguage"
import type { AppViewId } from "./appNavigation"
import { getBrowserSettingsRepository } from "./browserSettingsRepository"

export type AppLanguage = keyof typeof appMessagesByLanguage

export type AppMessages = (typeof appMessagesByLanguage)[AppLanguage]
export type AppViewMessages = AppMessages["views"][AppViewId]

export const defaultAppLanguage: AppLanguage = "es"

export function getAppLanguageFromSearch(search: string): AppLanguage {
  return getAppLanguageFromSearchWithRepository(
    search,
    getBrowserSettingsRepository(),
  )
}

export function resolveAppMessages(language: AppLanguage) {
  return appMessagesByLanguage[language] ?? appMessagesByLanguage[defaultAppLanguage]
}

export function tpl(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replace(`{${key}}`, String(val)),
    template,
  )
}
