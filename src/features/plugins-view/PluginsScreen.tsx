import { PluginsWorkspace } from "./PluginsWorkspace"

export function PluginsScreen() {
  return (
    <section className="app-view-screen" aria-label="Pantalla Plugins">
      <div className="app-view-intro">
        <h2>Plugins</h2>
        <p>
          Vista futura para gestionar plugins con una interfaz mas limpia y
          menos apelotonada que la monovista actual.
        </p>
      </div>
      <PluginsWorkspace />
    </section>
  )
}
