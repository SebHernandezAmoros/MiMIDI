import { PerformWorkspace } from "./PerformWorkspace"

export function PerformScreen() {
  return (
    <section className="app-view-screen" aria-label="Pantalla Perform">
      <div className="app-view-intro">
        <h2>Perform</h2>
        <p>
          Vista pensada para interpretar, probar timbres y grabar tomas sin la
          densidad de la pantalla de edicion.
        </p>
      </div>
      <PerformWorkspace />
    </section>
  )
}
