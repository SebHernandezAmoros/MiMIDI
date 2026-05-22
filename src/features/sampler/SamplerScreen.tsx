import LabApp from "../lab/LabApp"
import type { AppViewMessages, AppLanguage } from "../../app/appI18n"

type SamplerScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function SamplerScreen({ copy, language, settingsOpen, onSettingsClose }: SamplerScreenProps) {
  void copy
  return <LabApp language={language} mode="sampler-only" settingsOpen={settingsOpen} onSettingsClose={onSettingsClose} />
}
