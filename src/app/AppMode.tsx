import { AppShell } from "./AppShell"
import {
  appViewDefinitions,
  defaultAppView,
  type AppViewId,
} from "./appNavigation"
import { navigateTo } from "./navigation"
import { EditScreen } from "../features/edit/EditScreen"
import { PerformScreen } from "../features/perform/PerformScreen"
import { PluginsScreen } from "../features/plugins-view/PluginsScreen"
import { ProjectScreen } from "../features/project-view/ProjectScreen"
import { SamplerScreen } from "../features/sampler/SamplerScreen"
import { SettingsScreen } from "../features/settings-view/SettingsScreen"

type AppModeProps = {
  activeView?: AppViewId
}

function resolveScreen(activeView: AppViewId) {
  switch (activeView) {
    case "perform":
      return <PerformScreen />
    case "project":
      return <ProjectScreen />
    case "plugins":
      return <PluginsScreen />
    case "settings":
      return <SettingsScreen />
    case "sampler":
      return <SamplerScreen />
    case "edit":
    default:
      return <EditScreen />
  }
}

export function AppMode({ activeView = defaultAppView }: AppModeProps) {
  const activeDefinition =
    appViewDefinitions.find((view) => view.id === activeView) ?? appViewDefinitions[0]

  return (
    <AppShell
      subtitle="Shell horizontal inicial para el futuro modo app. Aqui ya nacen las vistas principales aunque su contenido siga en migracion."
      title="MiMIDI"
      toolbar={
        <button onClick={() => navigateTo("/lab")} type="button">
          Ir al laboratorio
        </button>
      }
    >
      <nav className="app-mode-nav" aria-label="Navegacion principal del modo app">
        {appViewDefinitions.map((view) => (
          <button
            className={view.id === activeDefinition.id ? "mode-switch-active" : ""}
            key={view.id}
            onClick={() => navigateTo(`/?view=${view.id}`)}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </nav>

      <section className="app-mode-summary" aria-label="Resumen de la vista activa">
        <strong>{activeDefinition.label}</strong>
        <span>{activeDefinition.description}</span>
      </section>

      {resolveScreen(activeDefinition.id)}
    </AppShell>
  )
}
