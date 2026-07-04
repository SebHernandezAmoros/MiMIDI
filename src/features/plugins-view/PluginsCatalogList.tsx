import { X } from "lucide-react"
import { resolveAppMessages, tpl, type AppLanguage } from "../../app/appI18n"
import type { RegisteredPluginSummary } from "../../engine/plugins/pluginRegistry"
import type { ExternalPluginEntry } from "./useExternalPlugins"

type ExternalPluginCatalogEntry = Pick<ExternalPluginEntry, "id" | "isDev">

type PluginsCatalogListProps = {
  externalPluginEntries: ExternalPluginCatalogEntry[]
  isRestoring: boolean
  language: AppLanguage
  onOpenPlugin?: (id: string) => void
  onPluginEnabledChange: (id: string, enabled: boolean) => void
  onPluginUninstall: (id: string) => void
  plugins: RegisteredPluginSummary[]
}

export function PluginsCatalogList({
  externalPluginEntries,
  isRestoring,
  language,
  onOpenPlugin,
  onPluginEnabledChange,
  onPluginUninstall,
  plugins,
}: PluginsCatalogListProps) {
  const copy = resolveAppMessages(language)

  return (
    <div className="app-plugin-list" aria-label={copy.lab.project.pluginList}>
      {isRestoring && (
        <p style={{ padding: "0.75rem 1rem", opacity: 0.5, fontSize: "0.8rem" }}>
          Restaurando plugins...
        </p>
      )}
      {plugins.map((plugin) => {
        const words = plugin.name.trim().split(/\s+/)
        const shortLabel =
          words.length === 1
            ? plugin.name.slice(0, 2).toUpperCase()
            : words.slice(0, 2).map((word) => word[0]).join("").toUpperCase()
        const isExt = plugin.isExternal
        const extEntry = externalPluginEntries.find((entry) => entry.id === plugin.id)
        const isDev = extEntry?.isDev ?? false

        return (
          <article className={`ui-list-row${isExt ? " ui-list-row-ext" : ""}`} key={plugin.id}>
            <span
              className="ui-badge"
              aria-hidden="true"
              title={isDev ? "Plugin de desarrollo (no persistido)" : isExt ? "Plugin externo (.mimod)" : "Plugin interno"}
            >
              {shortLabel}
            </span>
            <div className="ui-plugin-copy">
              <strong>{plugin.name}</strong>
              <span>
                {plugin.version} · {plugin.description}
                {isDev && <em style={{ opacity: 0.6 }}> · dev</em>}
                {isExt && !isDev && <em style={{ opacity: 0.6 }}> · externo</em>}
              </span>
            </div>
            {plugin.instrumentCount > 0 && (
              <label
                className="ui-toggle"
                aria-label={tpl(
                  plugin.enabled
                    ? copy.lab.project.disablePlugin
                    : copy.lab.project.enablePlugin,
                  { name: plugin.name },
                )}
              >
                <input
                  checked={plugin.enabled}
                  onChange={() => onPluginEnabledChange(plugin.id, !plugin.enabled)}
                  type="checkbox"
                />
                <span />
              </label>
            )}
            {isExt && (
              <button
                aria-label={`Desinstalar ${plugin.name}`}
                className="ui-icon-btn ui-icon-btn-danger"
                title="Desinstalar plugin externo"
                type="button"
                onClick={() => onPluginUninstall(plugin.id)}
              >
                <X size={14} />
              </button>
            )}
            {plugin.hasWorkspace && onOpenPlugin ? (
              <button
                aria-label={`Abrir ${plugin.name}`}
                className="ui-list-arrow ui-list-arrow-btn"
                onClick={() => onOpenPlugin(plugin.id)}
                type="button"
              >
                ›
              </button>
            ) : (
              <span
                className="ui-list-arrow"
                aria-hidden="true"
                style={{ opacity: plugin.hasWorkspace ? 1 : 0.2 }}
              >
                ›
              </span>
            )}
          </article>
        )
      })}
    </div>
  )
}
