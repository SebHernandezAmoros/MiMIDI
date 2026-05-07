import LabApp from "../lab/LabApp"

type EditWorkspaceProps = {
  body: string
  title: string
}

export function EditWorkspace({ body, title }: EditWorkspaceProps) {
  void body

  return (
    <section className="app-mock-screen" aria-label="Workspace Edit">
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-copy">
          <strong>{title}</strong>
        </div>
        <div className="app-mock-toolbar-controls" aria-label="Controles del timeline">
          <select aria-label="Vista del timeline" defaultValue="notes">
            <option value="notes">NOTAS</option>
            <option value="tracks">TRACKS</option>
          </select>
          <select aria-label="Rango del timeline" defaultValue="1bar">
            <option value="1bar">1 BAR</option>
            <option value="2bars">2 BARS</option>
            <option value="4bars">4 BARS</option>
          </select>
          <button aria-label="Buscar en timeline" type="button">
            BUSCAR
          </button>
        </div>
      </header>
      <div className="app-edit-lab">
        <LabApp mode="edit-only" />
      </div>
    </section>
  )
}
