import { ProjectWorkspace } from "./ProjectWorkspace"

export function ProjectScreen() {
  return (
    <section className="app-view-screen" aria-label="Pantalla Project">
      <div className="app-view-intro">
        <h2>Project</h2>
        <p>
          Vista para gestionar el proyecto como unidad: pistas, mezcla,
          exportacion y estado general.
        </p>
      </div>
      <ProjectWorkspace />
    </section>
  )
}
