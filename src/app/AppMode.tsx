import { AppShell } from "./AppShell"
import {
  resolveAppMessages,
  type AppLanguage,
} from "./appI18n"
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
  activeLanguage: AppLanguage
  activeView?: AppViewId
}

function resolveScreen(activeView: AppViewId, activeLanguage: AppLanguage) {
  const messages = resolveAppMessages(activeLanguage)
  const viewCopy = messages.views[activeView]

  switch (activeView) {
    case "perform":
      return <PerformScreen copy={viewCopy} />
    case "project":
      return <ProjectScreen copy={viewCopy} />
    case "plugins":
      return <PluginsScreen copy={viewCopy} />
    case "settings":
      return <SettingsScreen copy={viewCopy} />
    case "sampler":
      return <SamplerScreen copy={viewCopy} />
    case "edit":
    default:
      return <EditScreen copy={viewCopy} />
  }
}

export function AppMode({
  activeLanguage,
  activeView = defaultAppView,
}: AppModeProps) {
  const messages = resolveAppMessages(activeLanguage)
  const activeDefinition =
    appViewDefinitions.find((view) => view.id === activeView) ?? appViewDefinitions[0]

  return (
    <AppShell
      subtitle={messages.appMode.subtitle}
      title={messages.appMode.title}
      toolbar={
        <>
          <label className="app-language-switch" htmlFor="app-language">
            <span>{messages.appMode.languageLabel}</span>
            <select
              id="app-language"
              onChange={(event) =>
                navigateTo(`/?view=${activeDefinition.id}&lang=${event.target.value}`)
              }
              value={activeLanguage}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
          <button onClick={() => navigateTo(`/lab?lang=${activeLanguage}`)} type="button">
            {messages.appMode.openLab}
          </button>
        </>
      }
    >
      <nav className="app-mode-nav" aria-label={messages.appMode.navigationAriaLabel}>
        {appViewDefinitions.map((view) => (
          <button
            className={view.id === activeDefinition.id ? "mode-switch-active" : ""}
            key={view.id}
            onClick={() => navigateTo(`/?view=${view.id}&lang=${activeLanguage}`)}
            type="button"
          >
            {messages.views[view.id].label}
          </button>
        ))}
      </nav>

      <section
        className="app-mode-summary"
        aria-label={messages.appMode.activeViewSummaryAriaLabel}
      >
        <strong>{messages.views[activeDefinition.id].label}</strong>
        <span>{messages.views[activeDefinition.id].description}</span>
      </section>

      {resolveScreen(activeDefinition.id, activeLanguage)}
    </AppShell>
  )
}
