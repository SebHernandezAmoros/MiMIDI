import { EditWorkspace } from "./EditWorkspace"

export function EditScreen() {
  return (
    <section className="app-view-screen" aria-label="Pantalla Edit">
      <div className="app-view-intro">
        <h2>Edit</h2>
        <p>
          Primera pantalla recomendada para la migracion desde el laboratorio.
          Su frontera natural es la edicion temporal del proyecto.
        </p>
      </div>
      <EditWorkspace />
    </section>
  )
}
