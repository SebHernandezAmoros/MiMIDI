import type { ReactNode } from "react"
import type { AppViewMessages, AppLanguage } from "../../app/appI18n"

type SamplerScreenProps = {
  copy: AppViewMessages
  samplerContent: ReactNode
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function SamplerScreen({ copy, samplerContent }: SamplerScreenProps) {
  void copy
  return <>{samplerContent}</>
}
