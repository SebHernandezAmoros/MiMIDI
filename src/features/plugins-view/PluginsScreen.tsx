import { AppDialog } from "../../app/components/AppDialog"
import type { AppViewMessages } from "../../app/appI18n"
import { PluginsWorkspace } from "./PluginsWorkspace"

type PluginsScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

export function PluginsScreen({ copy, settingsOpen, onSettingsClose }: PluginsScreenProps) {
  return (
    <>
      <PluginsWorkspace body={copy.workspaceBody} title={copy.workspaceTitle} />
      <AppDialog
        description="Configuración del gestor de plugins."
        onClose={onSettingsClose}
        open={settingsOpen}
        title="Opciones — Plugins"
      />
    </>
  )
}
