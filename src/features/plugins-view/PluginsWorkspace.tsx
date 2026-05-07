import { useState } from "react"

type PluginsWorkspaceProps = {
  body: string
  title: string
}

type PluginRow = {
  category: string
  enabled: boolean
  id: string
  name: string
  shortLabel: string
  version: string
}

const initialPlugins: PluginRow[] = [
  {
    category: "Dynamics",
    enabled: true,
    id: "compressor",
    name: "M Compressor",
    shortLabel: "MC",
    version: "v1.0.0",
  },
  {
    category: "Reverb",
    enabled: true,
    id: "reverb",
    name: "M Reverb",
    shortLabel: "MR",
    version: "v1.2.3",
  },
  {
    category: "Delay",
    enabled: false,
    id: "delay",
    name: "M Delay",
    shortLabel: "MD",
    version: "v1.0.1",
  },
  {
    category: "Filter",
    enabled: true,
    id: "filter",
    name: "M Filter",
    shortLabel: "MF",
    version: "v1.1.0",
  },
  {
    category: "Modulation",
    enabled: false,
    id: "chorus",
    name: "M Chorus",
    shortLabel: "CH",
    version: "v1.0.0",
  },
]

export function PluginsWorkspace({ body, title }: PluginsWorkspaceProps) {
  void body
  const [plugins, setPlugins] = useState(initialPlugins)

  return (
    <section className="app-mock-screen" aria-label="Workspace Plugins">
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-copy">
          <strong>{title}</strong>
        </div>
        <div className="app-mock-toolbar-actions">
          <button type="button">IMPORT</button>
          <button type="button">PLUGIN FOLDER</button>
        </div>
      </header>

      <div className="app-plugin-list" aria-label="Lista de plugins">
        {plugins.map((plugin) => (
          <article className="app-plugin-row" key={plugin.id}>
            <div className="app-plugin-badge" aria-hidden="true">
              {plugin.shortLabel}
            </div>
            <div className="app-plugin-copy">
              <strong>{plugin.name}</strong>
              <span>
                {plugin.version} - {plugin.category}
              </span>
            </div>
            <label className="app-plugin-toggle">
              <input
                checked={plugin.enabled}
                onChange={() =>
                  setPlugins((current) =>
                    current.map((currentPlugin) =>
                      currentPlugin.id === plugin.id
                        ? { ...currentPlugin, enabled: !currentPlugin.enabled }
                        : currentPlugin,
                    ),
                  )
                }
                type="checkbox"
              />
              <span />
            </label>
            <span className="app-plugin-arrow" aria-hidden="true">
              {">"}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
