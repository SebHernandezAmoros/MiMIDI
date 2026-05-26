import { useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { navigateTo } from "../../app/navigation"
import { getRegisteredPlugins } from "../../engine/plugins/pluginRegistry"
import type { MiMIDIPluginAPI } from "../../engine/plugins/pluginModel"
import type { AppLanguage } from "../../app/appI18n"
import { AppErrorBoundary } from "../../app/components/AppErrorBoundary"

type PluginWorkspaceHostProps = {
  api: MiMIDIPluginAPI
  language: AppLanguage
  pluginId: string
}

export function PluginWorkspaceHost({ api, language, pluginId }: PluginWorkspaceHostProps) {
  const plugin = getRegisteredPlugins().find(p => p.id === pluginId)

  // Carga y limpieza del CSS propio del plugin
  useEffect(() => {
    const cssUrl = plugin?.workspace?.cssUrl
    if (!cssUrl) return

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = cssUrl
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [plugin?.workspace?.cssUrl])

  function handleBack() {
    navigateTo(`/?view=plugins`)
  }

  return (
    <section className="app-mock-screen" aria-label={plugin?.name ?? pluginId}>
      <header className="app-mock-toolbar">
        <button className="ui-icon-btn" onClick={handleBack} type="button" aria-label="Volver a plugins">
          <ChevronLeft size={18} />
        </button>
        <strong style={{ flex: 1, paddingInline: "0.5rem" }}>
          {plugin?.name ?? pluginId}
        </strong>
        {plugin && (
          <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>{plugin.version}</span>
        )}
      </header>

      <div className="app-plugin-workspace-body">
        {!plugin && (
          <p className="app-plugin-workspace-empty">Plugin «{pluginId}» no encontrado.</p>
        )}
        {plugin && !plugin.workspace && (
          <p className="app-plugin-workspace-empty">
            Este plugin no tiene entorno propio. Solo aporta instrumentos al catálogo.
          </p>
        )}
        {plugin?.workspace && (
          <AppErrorBoundary>
            <plugin.workspace.component api={api} language={language} />
          </AppErrorBoundary>
        )}
      </div>
    </section>
  )
}
