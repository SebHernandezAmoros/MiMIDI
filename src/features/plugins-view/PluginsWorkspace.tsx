import { useEffect, useState } from "react"
import { navigateTo } from "../../app/navigation"
import LabApp from "../lab/LabApp"
import type { AppLanguage } from "../../app/appI18n"
import { AppErrorBoundary } from "../../app/components/AppErrorBoundary"

type PluginsWorkspaceProps = {
  body: string
  language?: AppLanguage
  title: string
}

export function PluginsWorkspace({ body, language, title }: PluginsWorkspaceProps) {
  void body
  void title

  const [pluginId, setPluginId] = useState(
    () => new URLSearchParams(window.location.search).get("pluginId")
  )

  useEffect(() => {
    const sync = () => setPluginId(new URLSearchParams(window.location.search).get("pluginId"))
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [])

  if (pluginId) {
    return (
      <AppErrorBoundary fallback={(err) => (
        <div style={{ padding: "1.5rem", fontFamily: "monospace", fontSize: "0.85rem" }}>
          <strong>Error al cargar workspace del plugin</strong>
          <pre style={{ marginTop: "0.75rem", whiteSpace: "pre-wrap", opacity: 0.7 }}>
            {err.message}
          </pre>
          <button
            style={{ marginTop: "1rem", cursor: "pointer" }}
            type="button"
            onClick={() => navigateTo("/?view=plugins")}
          >
            ← Volver a plugins
          </button>
        </div>
      )}>
        <LabApp
          language={language}
          mode="plugin-workspace"
          pluginId={pluginId}
        />
      </AppErrorBoundary>
    )
  }

  return (
    <LabApp
      language={language}
      mode="plugins-only"
      onOpenPlugin={(id) => navigateTo(`/?view=plugins&pluginId=${id}`)}
    />
  )
}
