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
  void copy

  return (
    <>
    <section className="app-mock-screen" aria-label="Workspace Settings">
      <header className="app-mock-toolbar">
        <label className="app-settings-toolbar-dark-toggle">
          <span>Modo oscuro</span>
          <label className="ui-toggle" aria-label="Modo oscuro">
            <input
              checked={darkMode}
              onChange={() => onDarkModeChange(!darkMode)}
              type="checkbox"
            />
            <span />
          </label>
        </label>
      </header>

      <div className="app-settings-groups">
        <section className="ui-list-section" aria-label="Idioma">
          <span className="ui-list-section-title">IDIOMA</span>
          <label className="ui-list-row" style={{ cursor: "default" }} htmlFor="settings-language">
            <span className="ui-list-icon">L</span>
            <span className="ui-list-label">Language</span>
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

        <section className="ui-list-section" aria-label="Tema">
          <span className="ui-list-section-title">TEMA</span>
          <div className="ui-list-row ui-list-row-static">
            <span className="ui-list-icon">S</span>
            <span className="ui-list-label">Modo Oscuro</span>
            <label className="ui-toggle" aria-label="Modo Oscuro">
              <input
                checked={darkMode}
                onChange={() => onDarkModeChange(!darkMode)}
                type="checkbox"
              />
              <span />
            </label>
          </div>
        </section>

        <section className="ui-list-section" aria-label="Piano">
          <span className="ui-list-section-title">PIANO</span>
          <div className="ui-list-row ui-list-row-static">
            <span className="ui-list-icon">K</span>
            <span className="ui-list-label">Mostrar etiquetas de teclas</span>
            <label className="ui-toggle" aria-label="Mostrar etiquetas de teclas">
              <input
                checked={showKeyLabels}
                onChange={() => onShowKeyLabelsChange(!showKeyLabels)}
                type="checkbox"
              />
              <span />
            </label>
          </div>
        </section>

        <section className="ui-list-section" aria-label="Audio">
          <span className="ui-list-section-title">AUDIO</span>
          <label className="ui-list-row" style={{ cursor: "default" }} htmlFor="settings-master-volume">
            <span className="ui-list-icon">V</span>
            <span className="ui-list-label">Volumen maestro</span>
            <span className="ui-list-value">{Math.round(masterVolume * 100)}%</span>
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
          <button className="ui-list-row" type="button">
            <span className="ui-list-icon">A</span>
            <span className="ui-list-label">Salida de Audio</span>
            <span className="ui-list-value">Dispositivo</span>
            <span className="ui-list-arrow" aria-hidden="true">›</span>
          </button>
        </section>

        <section className="ui-list-section" aria-label="MIDI">
          <span className="ui-list-section-title">MIDI</span>
          <button className="ui-list-row" type="button">
            <span className="ui-list-icon">M</span>
            <span className="ui-list-label">MIDI Dispositivo</span>
            <span className="ui-list-value">No conectado</span>
            <span className="ui-list-arrow" aria-hidden="true">›</span>
          </button>
        </section>

        <section className="ui-list-section" aria-label="Laboratorio">
          <span className="ui-list-section-title">LAB</span>
          <button className="ui-list-row" onClick={onOpenLab} type="button">
            <span className="ui-list-icon">L</span>
            <span className="ui-list-label">Ir al laboratorio</span>
            <span className="ui-list-arrow" aria-hidden="true">›</span>
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
