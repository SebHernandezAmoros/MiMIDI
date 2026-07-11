import type { AppLanguage } from "./appI18n"
import LabApp from "../features/lab/LabApp"

type EditViewCompositionProps = {
  language?: AppLanguage
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

export function EditViewComposition({
  language,
  settingsOpen,
  onSettingsClose,
}: EditViewCompositionProps) {
  return (
    <LabApp
      language={language}
      mode="edit-only"
      settingsOpen={settingsOpen}
      onSettingsClose={onSettingsClose}
    />
  )
}
