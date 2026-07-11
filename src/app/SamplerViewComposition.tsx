import type { AppLanguage } from "./appI18n"
import LabApp from "../features/lab/LabApp"

type SamplerViewCompositionProps = {
  language?: AppLanguage
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function SamplerViewComposition({
  language,
  settingsOpen,
  onSettingsClose,
}: SamplerViewCompositionProps) {
  return (
    <LabApp
      language={language}
      mode="sampler-only"
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
