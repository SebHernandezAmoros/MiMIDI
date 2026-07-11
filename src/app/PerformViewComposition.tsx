import type { AppLanguage } from "./appI18n"
import LabApp from "../features/lab/LabApp"

type PerformViewCompositionProps = {
  language?: AppLanguage
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function PerformViewComposition({
  language,
  settingsOpen,
  onSettingsClose,
}: PerformViewCompositionProps) {
  return (
    <LabApp
      language={language}
      mode="perform-only"
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
