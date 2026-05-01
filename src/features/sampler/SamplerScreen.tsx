export function SamplerScreen() {
  return (
    <section className="app-view-screen" aria-label="Pantalla Sampler">
      <div className="app-view-intro">
        <h2>Sampler</h2>
        <p>
          Vista separada del core matematico para captura, gestion y disparo de
          samples cuando el modulo se retome.
        </p>
      </div>
      <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Sampler">
        <h2>Sampler workspace</h2>
        <p>
          Queda nacido como contenedor propio para no mezclar su desarrollo con
          el flujo del laboratorio matematico.
        </p>
      </section>
    </section>
  )
}
