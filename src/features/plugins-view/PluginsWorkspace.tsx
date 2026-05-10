import { useState } from "react"
import { Folder, Upload } from "lucide-react"
import {
  getRegisteredPluginSummaries,
  type RegisteredPluginSummary,
} from "../../engine/plugins/pluginRegistry"

type PluginsWorkspaceProps = {
  body: string
  title: string
}

function makeShortLabel(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 2).toUpperCase()
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function PluginsWorkspace({ body, title }: PluginsWorkspaceProps) {
  void body
  void title

  const [pluginStates, setPluginStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      getRegisteredPluginSummaries().map((p) => [p.id, p.enabled]),
    ),
  )

  const plugins: RegisteredPluginSummary[] = getRegisteredPluginSummaries(pluginStates)

  function togglePlugin(id: string) {
    setPluginStates((current) => ({ ...current, [id]: !current[id] }))
  }

  return (
    <section className="app-mock-screen" aria-label="Workspace Plugins">
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-actions">
          <button className="ui-pill-btn" type="button">
            <Upload size={14} />
            IMPORT
          </button>
          <button className="ui-pill-btn" type="button">
            <Folder size={14} />
            PLUGIN FOLDER
          </button>
        </div>
      </header>

      <div className="app-plugin-list" aria-label="Lista de plugins">
        {plugins.map((plugin) => {
          const shortLabel = makeShortLabel(plugin.name)
          const isEnabled = pluginStates[plugin.id] ?? plugin.enabled

          return (
            <article className="app-plugin-row" key={plugin.id}>
              <span className="ui-badge" aria-hidden="true">
                {shortLabel}
              </span>
              <div className="ui-plugin-copy">
                <strong>{plugin.name}</strong>
                <span>
                  {plugin.version} · {plugin.description}
                </span>
              </div>
              <label className="ui-checkbox" aria-label={`${isEnabled ? "Desactivar" : "Activar"} ${plugin.name}`}>
                <input
                  checked={isEnabled}
                  onChange={() => togglePlugin(plugin.id)}
                  type="checkbox"
                />
                <span />
              </label>
              <span className="ui-list-arrow" aria-hidden="true">›</span>
            </article>
          )
        })}
      </div>
    </section>
  )
}
