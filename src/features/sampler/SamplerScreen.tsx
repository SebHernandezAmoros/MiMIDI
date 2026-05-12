import LabApp from "../lab/LabApp"
import type { AppViewMessages } from "../../app/appI18n"

type SamplerScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function SamplerScreen({ copy, settingsOpen, onSettingsClose }: SamplerScreenProps) {
  void copy
  return <LabApp mode="sampler-only" settingsOpen={settingsOpen} onSettingsClose={onSettingsClose} />
}
