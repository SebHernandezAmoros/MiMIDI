import type { AppLanguage } from "./appI18n"
import { resolveAppMessages } from "./appI18n"
import { useLabProject } from "../features/lab/useLabProject"
import { PluginsCatalogList } from "../features/plugins-view/PluginsCatalogList"
import {
  PluginsCatalogDevelopmentTools,
  PluginsCatalogImportToolbar,
} from "../features/plugins-view/PluginsCatalogToolbar"
import {
  installPluginCatalogFile,
  installPluginCatalogFolder,
  uninstallPluginCatalogEntry,
  type PluginCatalogActionDependencies,
} from "../features/plugins-view/pluginCatalogActions"
import { useExternalPlugins } from "../features/plugins-view/useExternalPlugins"

type PluginsCatalogCompositionProps = {
  language?: AppLanguage
  onOpenPlugin?: (pluginId: string) => void
}

export function PluginsCatalogComposition({
  language = "es",
  onOpenPlugin,
}: PluginsCatalogCompositionProps) {
  const copy = resolveAppMessages(language).lab
  const projectSession = useLabProject({
    mode: "plugins-only",
    timelineSnapEnabled: false,
    timelineSnapStep: 0.1,
  })
  const externalPlugins = useExternalPlugins()
  const actionDependencies: PluginCatalogActionDependencies = {
    installFromFile: externalPlugins.installFromFile,
    installFromFolder: externalPlugins.installFromFolder,
    logError: (context, error) => console.error(context, error),
    setPluginEnabled: (pluginId, enabled) => {
      projectSession.applyUpdate((project) => {
        if (enabled === undefined) {
          const { [pluginId]: _, ...pluginStates } = project.pluginStates
          return { ...project, pluginStates }
        }
        return {
          ...project,
          pluginStates: {
            ...project.pluginStates,
            [pluginId]: enabled,
          },
        }
      })
    },
    showError: (message) => alert(message),
    uninstall: externalPlugins.uninstall,
  }

  return (
    <section
      className="app-mock-screen"
      aria-label={copy.project.pluginsSection}
    >
      <PluginsCatalogImportToolbar
        onMimodFile={(file) => {
          void installPluginCatalogFile(file, actionDependencies)
        }}
      />
      <PluginsCatalogList
        externalPluginEntries={externalPlugins.entries}
        isRestoring={externalPlugins.isRestoring}
        language={language}
        onOpenPlugin={onOpenPlugin}
        onPluginEnabledChange={projectSession.updatePluginEnabled}
        onPluginUninstall={(pluginId) => {
          void uninstallPluginCatalogEntry(pluginId, actionDependencies)
        }}
        plugins={projectSession.registeredPlugins}
      />
      <PluginsCatalogDevelopmentTools
        onPluginFolder={() => {
          void installPluginCatalogFolder(actionDependencies)
        }}
        supportsDirectoryPicker={"showDirectoryPicker" in window}
      />
    </section>
  )
}
