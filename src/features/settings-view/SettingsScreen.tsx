import { AppDialog } from "../../app/components/AppDialog"
import type { AppLanguage } from "../../app/appI18n"
import type { AppViewMessages } from "../../app/appI18n"

type SettingsScreenProps = {
  activeLanguage: AppLanguage
  copy: AppViewMessages
  darkMode: boolean
  masterVolume: number
  onDarkModeChange: (v: boolean) => void
  onLanguageChange: (language: AppLanguage) => void
  onMasterVolumeChange: (v: number) => void
  onOpenLab: () => void
  settingsOpen: boolean
  onSettingsClose: () => void
  showKeyLabels: boolean
  onShowKeyLabelsChange: (v: boolean) => void
}

export function SettingsScreen({
  activeLanguage,
  copy,
  darkMode,
  masterVolume,
  onDarkModeChange,
  onLanguageChange,
  onMasterVolumeChange,
  onOpenLab,
  settingsOpen,
  onSettingsClose,
  showKeyLabels,
  onShowKeyLabelsChange,
}: SettingsScreenProps) {

  return (
    <>
    <section className="app-mock-screen" aria-label="Workspace Settings">
      <header className="app-mock-toolbar">
        <label className="app-settings-toolbar-dark-toggle" aria-label="Modo oscuro">
          <span>Modo oscuro</span>
          <button
            aria-pressed={darkMode}
            className={darkMode ? "app-settings-toggle app-settings-toggle-on" : "app-settings-toggle"}
            onClick={() => onDarkModeChange(!darkMode)}
            type="button"
          >
            <span />
          </button>
        </label>
      </header>

      <div className="app-settings-groups">
        <section className="app-settings-group" aria-label="Idioma">
          <span className="app-settings-group-title">IDIOMA</span>
          <label className="app-settings-row app-settings-row-select" htmlFor="settings-language">
            <span className="app-settings-row-icon">L</span>
            <span className="app-settings-row-label">Language</span>
            <select
              id="settings-language"
              value={activeLanguage}
              onChange={(event) => onLanguageChange(event.target.value as AppLanguage)}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
        </section>

        <section className="app-settings-group" aria-label="Tema">
          <span className="app-settings-group-title">TEMA</span>
          <div className="app-settings-row app-settings-row-static">
            <span className="app-settings-row-icon">S</span>
            <span className="app-settings-row-label">Modo Oscuro</span>
            <button
              aria-label="Modo Oscuro"
              className={
                darkMode
                  ? "app-settings-toggle app-settings-toggle-on"
                  : "app-settings-toggle"
              }
              onClick={() => onDarkModeChange(!darkMode)}
              type="button"
            >
              <span />
            </button>
          </div>
        </section>

        <section className="app-settings-group" aria-label="Piano">
          <span className="app-settings-group-title">PIANO</span>
          <div className="app-settings-row app-settings-row-static">
            <span className="app-settings-row-icon">K</span>
            <span className="app-settings-row-label">Mostrar etiquetas de teclas</span>
            <button
              aria-label="Mostrar etiquetas de teclas"
              className={showKeyLabels ? "app-settings-toggle app-settings-toggle-on" : "app-settings-toggle"}
              onClick={() => onShowKeyLabelsChange(!showKeyLabels)}
              type="button"
            >
              <span />
            </button>
          </div>
        </section>

        <section className="app-settings-group" aria-label="Audio">
          <span className="app-settings-group-title">AUDIO</span>
          <label className="app-settings-row app-settings-row-volume" htmlFor="settings-master-volume">
            <span className="app-settings-row-icon">V</span>
            <span className="app-settings-row-label">Volumen maestro</span>
            <span className="app-settings-row-value">{Math.round(masterVolume * 100)}%</span>
          </label>
          <div className="app-settings-volume-slider-row">
            <input
              className="app-settings-volume-slider"
              id="settings-master-volume"
              max={1}
              min={0}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              step={0.01}
              type="range"
              value={masterVolume}
            />
          </div>
          <button className="app-settings-row" type="button">
            <span className="app-settings-row-icon">A</span>
            <span className="app-settings-row-label">Salida de Audio</span>
            <span className="app-settings-row-value">Dispositivo</span>
            <span className="app-settings-row-arrow" aria-hidden="true">
              {">"}
            </span>
          </button>
        </section>

        <section className="app-settings-group" aria-label="MIDI">
          <span className="app-settings-group-title">MIDI</span>
          <button className="app-settings-row" type="button">
            <span className="app-settings-row-icon">M</span>
            <span className="app-settings-row-label">MIDI Dispositivo</span>
            <span className="app-settings-row-value">No conectado</span>
            <span className="app-settings-row-arrow" aria-hidden="true">
              {">"}
            </span>
          </button>
        </section>

        <section className="app-settings-group" aria-label="Laboratorio">
          <span className="app-settings-group-title">LAB</span>
          <button className="app-settings-row" onClick={onOpenLab} type="button">
            <span className="app-settings-row-icon">L</span>
            <span className="app-settings-row-label">Ir al laboratorio</span>
            <span className="app-settings-row-arrow" aria-hidden="true">
              {">"}
            </span>
          </button>
        </section>
      </div>
    </section>

    <AppDialog
      description="Opciones adicionales de configuración."
      onClose={onSettingsClose}
      open={settingsOpen}
      title="Opciones — Ajustes"
    />
    </>
  )
}
