import { AppShell } from "./AppShell"

type AppHomeProps = {
  onOpenLab: () => void
}

export function AppHome({ onOpenLab }: AppHomeProps) {
  return (
    <AppShell
      subtitle="Base inicial del futuro modo app horizontal. El laboratorio queda separado para no seguir apelotonando la pantalla principal."
      title="MiMIDI"
      toolbar={
        <button onClick={onOpenLab} type="button">
          Abrir laboratorio
        </button>
      }
    >
      <section className="app-home-grid" aria-label="Estado del modo app">
        <article className="app-home-card">
          <h2>Modo app horizontal</h2>
          <p>
            Esta ruta queda reservada para la futura experiencia principal, con
            shell horizontal y vistas separadas inspiradas en una app de
            escritorio clasica.
          </p>
        </article>
        <article className="app-home-card">
          <h2>Laboratorio aislado</h2>
          <p>
            El laboratorio actual sigue disponible en <code>/lab</code> para
            mantener el flujo existente mientras seguimos sacando coordinacion de
            <code> App.tsx</code>.
          </p>
        </article>
        <article className="app-home-card">
          <h2>Siguiente migracion</h2>
          <p>
            El siguiente paso tecnico recomendado es crear vistas reales como
            <code> Edit</code>, <code>Project</code> y <code>Perform</code>
            encima de este shell, antes de crecer mas el sistema de plugins.
          </p>
        </article>
      </section>
    </AppShell>
  )
}
