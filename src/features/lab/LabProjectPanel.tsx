import type { ADSREnvelope } from "../../engine/audio/audioTypes"
import type {
  MathematicalInstrument,
  MathematicalInstrumentId,
} from "../../engine/audio/mathematicalInstruments"
import type {
  ProjectTrack,
  TrackVolumeAutomation,
} from "../../engine/project/projectModel"
import type { RegisteredPluginSummary } from "../../engine/plugins/pluginRegistry"

type LabProjectPanelProps = {
  activeInstrumentCategory: MathematicalInstrument["category"]
  envelopeHelpText: string
  envelope: ADSREnvelope
  historyCount: number
  instrumentCategoryDescription: string
  instrumentCategories: MathematicalInstrument["category"][]
  noteCount: number
  noteTimelineDuration: number
  onAddTrack: () => void
  onInstrumentCategoryChange: (
    category: MathematicalInstrument["category"],
  ) => void
  onPluginEnabledChange: (pluginId: string, enabled: boolean) => void
  onProjectNameChange: (name: string) => void
  onProjectTrackTimelineDurationChange: (duration: number) => void
  onResetProjectTrackTimelineDuration: () => void
  onResetTrackNoteTimelineDuration: () => void
  onRemoveActiveTrack: () => void
  onSwitchActiveTrack: (trackId: string) => void
  onTrackEnvelopeChange: (parameter: keyof ADSREnvelope, value: number) => void
  onTrackMutedToggle: () => void
  onTrackNameChange: (name: string) => void
  onTrackNoteTimelineDurationChange: (duration: number) => void
  onTrackPanChange: (pan: number) => void
  onTrackSoloToggle: () => void
  onTrackVolumeAutomationChange: (automation: TrackVolumeAutomation) => void
  onTrackInstrumentChange: (instrumentId: MathematicalInstrumentId) => void
  onTrackVolumeChange: (volume: number) => void
  pan: number
  primaryTrackId: string
  primaryTrackInstrumentId: MathematicalInstrumentId
  primaryTrackMuted: boolean
  primaryTrackName: string
  primaryTrackSolo: boolean
  projectMessage: string
  projectName: string
  projectTrackTimelineDuration: number
  plugins: RegisteredPluginSummary[]
  trackCount: number
  tracks: ProjectTrack[]
  volumeAutomation: TrackVolumeAutomation
  volume: number
  instrumentOptions: {
    id: MathematicalInstrumentId
    name: string
  }[]
}

export function LabProjectPanel({
  activeInstrumentCategory,
  envelopeHelpText,
  envelope,
  historyCount,
  instrumentCategoryDescription,
  instrumentCategories,
  noteCount,
  noteTimelineDuration,
  onAddTrack,
  onInstrumentCategoryChange,
  onPluginEnabledChange,
  onProjectNameChange,
  onProjectTrackTimelineDurationChange,
  onResetProjectTrackTimelineDuration,
  onResetTrackNoteTimelineDuration,
  onRemoveActiveTrack,
  onSwitchActiveTrack,
  onTrackEnvelopeChange,
  onTrackMutedToggle,
  onTrackNameChange,
  onTrackNoteTimelineDurationChange,
  onTrackPanChange,
  onTrackSoloToggle,
  onTrackVolumeAutomationChange,
  onTrackInstrumentChange,
  onTrackVolumeChange,
  pan,
  primaryTrackId,
  primaryTrackInstrumentId,
  primaryTrackMuted,
  primaryTrackName,
  primaryTrackSolo,
  projectMessage,
  projectName,
  projectTrackTimelineDuration,
  plugins,
  trackCount,
  tracks,
  volumeAutomation,
  volume,
  instrumentOptions,
}: LabProjectPanelProps) {
  const automationStartPoint = volumeAutomation.points[0] ?? { time: 0, value: 1 }
  const automationEndPoint =
    volumeAutomation.points[1] ?? volumeAutomation.points[0] ?? { time: 4, value: 1 }

  function updateAutomationPatch(patch: Partial<TrackVolumeAutomation>) {
    onTrackVolumeAutomationChange({
      ...volumeAutomation,
      ...patch,
    })
  }

  function updateAutomationPoints(startValue: number, endTime: number, endValue: number) {
    onTrackVolumeAutomationChange({
      ...volumeAutomation,
      points: [
        { time: 0, value: startValue },
        { time: Math.max(endTime, 0.1), value: endValue },
      ],
    })
  }

  return (
    <>
      <div className="project-summary" aria-label="Proyecto actual">
        <div>
          <span className="project-label">Proyecto</span>
          <strong>{projectName}</strong>
        </div>
        <div>
          <span className="project-label">Pista</span>
          <strong>{primaryTrackName}</strong>
        </div>
        <div>
          <span className="project-label">Notas</span>
          <strong>{noteCount}</strong>
        </div>
        <div>
          <span className="project-label">Pistas</span>
          <strong>{trackCount}</strong>
        </div>
        <div>
          <span className="project-label">Historial: {historyCount}</span>
        </div>
      </div>

      {projectMessage ? <p className="project-message">{projectMessage}</p> : null}

      <div className="project-editors">
        <div className="control-group">
          <label htmlFor="project-name">Nombre del proyecto</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="track-name">Nombre de la pista</label>
          <input
            id="track-name"
            type="text"
            value={primaryTrackName}
            onChange={(event) => onTrackNameChange(event.target.value)}
          />
        </div>
      </div>

      <section className="track-mix" aria-label="Duracion del timeline de tracks">
        <div className="track-mix-header">
          <h2>Duracion del timeline</h2>
          <button onClick={onResetProjectTrackTimelineDuration} type="button">
            Ajustar al contenido
          </button>
        </div>
        <p className="project-message">
          Define cuanto espacio visible tiene el timeline de tracks. Si el contenido
          crece mas, el rango se expande automaticamente.
        </p>
        <div className="track-mix-grid">
          <div className="control-group">
            <label htmlFor="project-track-timeline-duration">Duracion timeline (s)</label>
            <input
              id="project-track-timeline-duration"
              max="9999"
              min="1"
              step="0.1"
              type="number"
              value={projectTrackTimelineDuration}
              onChange={(event) =>
                onProjectTrackTimelineDurationChange(Number(event.target.value))
              }
            />
            <span className="project-label">{projectTrackTimelineDuration.toFixed(1)}s</span>
          </div>
        </div>
      </section>

      <section className="track-mix" aria-label="Duracion del timeline de notas">
        <div className="track-mix-header">
          <h2>Duracion de notas</h2>
          <button onClick={onResetTrackNoteTimelineDuration} type="button">
            Ajustar notas al contenido
          </button>
        </div>
        <div className="track-mix-grid">
          <div className="control-group">
            <label htmlFor="track-note-timeline-duration">Duracion timeline notas (s)</label>
            <input
              id="track-note-timeline-duration"
              max="9999"
              min="1"
              step="0.1"
              type="number"
              value={noteTimelineDuration}
              onChange={(event) =>
                onTrackNoteTimelineDurationChange(Number(event.target.value))
              }
            />
            <span className="project-label">{noteTimelineDuration.toFixed(1)}s</span>
          </div>
        </div>
      </section>

      <div className="track-controls">
        <div className="control-group">
          <label htmlFor="active-track">Pista activa</label>
          <select
            id="active-track"
            value={primaryTrackId}
            onChange={(event) => onSwitchActiveTrack(event.target.value)}
          >
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={onAddTrack} type="button">
          Nueva pista
        </button>
        <button onClick={onRemoveActiveTrack} type="button">
          Eliminar pista
        </button>
      </div>

      <div className="control-group">
        <label>Categoria de instrumento</label>
        <div className="mode-switch" aria-label="Categoria de instrumento">
          {instrumentCategories.map((category) => (
            <button
              className={category === activeInstrumentCategory ? "mode-switch-active" : ""}
              key={category}
              onClick={() => onInstrumentCategoryChange(category)}
              type="button"
            >
              {category === "advanced" ? "Avanzado" : "Base"}
            </button>
          ))}
        </div>
        <span className="project-label">{instrumentCategoryDescription}</span>
      </div>

      <div className="control-group">
        <label htmlFor="instrument">Instrumento matematico</label>
        <select
          id="instrument"
          value={primaryTrackInstrumentId}
          onChange={(event) =>
            onTrackInstrumentChange(event.target.value as MathematicalInstrumentId)
          }
        >
          {instrumentOptions.map((instrument) => (
            <option key={instrument.id} value={instrument.id}>
              {instrument.name}
            </option>
          ))}
        </select>
      </div>

      <section className="track-mix" aria-label="Plugins internos">
        <div className="track-mix-header">
          <h2>Plugins internos</h2>
        </div>
        <p className="project-message">
          Activa o desactiva extensiones internas del catalogo. Si apagas un
          plugin, las pistas que usen sus instrumentos vuelven a un fallback del
          core para que el proyecto siga estable.
        </p>
        <div className="track-envelope-grid">
          {plugins.map((plugin) => (
            <div className="control-group" key={plugin.id}>
              <label
                className="timeline-snap-toggle"
                htmlFor={`plugin-enabled-${plugin.id}`}
              >
                <input
                  checked={plugin.enabled}
                  id={`plugin-enabled-${plugin.id}`}
                  onChange={(event) =>
                    onPluginEnabledChange(plugin.id, event.target.checked)
                  }
                  type="checkbox"
                />
                Activar {plugin.name}
              </label>
              <span className="project-label">
                v{plugin.version} · {plugin.instrumentCount} instrumento
                {plugin.instrumentCount === 1 ? "" : "s"}
              </span>
              <span className="project-message">{plugin.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="track-mix" aria-label="Mezcla por pista">
        <div className="track-mix-header">
          <h2>Mezcla por pista</h2>
          <div className="track-mix-toggles">
            <button
              className={primaryTrackMuted ? "mode-switch-active" : ""}
              onClick={onTrackMutedToggle}
              type="button"
            >
              Mute
            </button>
            <button
              className={primaryTrackSolo ? "mode-switch-active" : ""}
              onClick={onTrackSoloToggle}
              type="button"
            >
              Solo
            </button>
          </div>
        </div>
        <p className="project-message">
          Mute silencia la pista. Solo deja audible esta pista frente al resto.
        </p>
        <div className="track-mix-grid">
          <div className="control-group">
            <label htmlFor="track-volume">Volumen por pista</label>
            <input
              id="track-volume"
              max="1.5"
              min="0"
              step="0.01"
              type="number"
              value={volume}
              onChange={(event) => onTrackVolumeChange(Number(event.target.value))}
            />
          </div>
          <div className="control-group">
            <label htmlFor="track-pan">Pan por pista</label>
            <input
              id="track-pan"
              max="1"
              min="-1"
              step="0.01"
              type="range"
              value={pan}
              onChange={(event) => onTrackPanChange(Number(event.target.value))}
            />
            <span className="project-label">
              {pan < 0 ? `Izq ${Math.abs(pan).toFixed(2)}` : pan > 0 ? `Der ${pan.toFixed(2)}` : "Centro"}
            </span>
          </div>
        </div>
      </section>

      <section className="track-automation" aria-label="Automatizacion basica por pista">
        <div className="track-mix-header">
          <h2>Automatizacion base de volumen</h2>
          <label className="timeline-snap-toggle" htmlFor="track-volume-automation-enabled">
            <input
              checked={volumeAutomation.enabled}
              id="track-volume-automation-enabled"
              onChange={(event) =>
                updateAutomationPatch({ enabled: event.target.checked })
              }
              type="checkbox"
            />
            Activar automatizacion
          </label>
        </div>
        <p className="project-message">
          Usa dos puntos minimos para que la pista suba o baje volumen durante la interpretacion y la reproduccion grabada.
        </p>
        <div className="track-envelope-grid">
          <div className="control-group">
            <label htmlFor="track-automation-start-volume">Volumen inicial</label>
            <input
              id="track-automation-start-volume"
              max="1.5"
              min="0"
              step="0.01"
              type="number"
              value={automationStartPoint.value}
              onChange={(event) =>
                updateAutomationPoints(
                  Number(event.target.value),
                  automationEndPoint.time,
                  automationEndPoint.value,
                )
              }
            />
          </div>
          <div className="control-group">
            <label htmlFor="track-automation-end-time">Tiempo final</label>
            <input
              id="track-automation-end-time"
              max="120"
              min="0.1"
              step="0.1"
              type="number"
              value={automationEndPoint.time}
              onChange={(event) =>
                updateAutomationPoints(
                  automationStartPoint.value,
                  Number(event.target.value),
                  automationEndPoint.value,
                )
              }
            />
          </div>
          <div className="control-group">
            <label htmlFor="track-automation-end-volume">Volumen final</label>
            <input
              id="track-automation-end-volume"
              max="1.5"
              min="0"
              step="0.01"
              type="number"
              value={automationEndPoint.value}
              onChange={(event) =>
                updateAutomationPoints(
                  automationStartPoint.value,
                  automationEndPoint.time,
                  Number(event.target.value),
                )
              }
            />
          </div>
        </div>
      </section>

      <section className="track-envelope" aria-label="Envolvente por pista">
        <h2>Envolvente por pista</h2>
        <p className="project-message">{envelopeHelpText}</p>
        <div className="track-envelope-grid">
          <div className="control-group">
            <label htmlFor="track-attack">Attack</label>
            <input
              id="track-attack"
              max="1"
              min="0.001"
              step="0.001"
              type="number"
              value={envelope.attack}
              onChange={(event) =>
                onTrackEnvelopeChange("attack", Number(event.target.value))
              }
            />
          </div>
          <div className="control-group">
            <label htmlFor="track-decay">Decay</label>
            <input
              id="track-decay"
              max="2"
              min="0.001"
              step="0.001"
              type="number"
              value={envelope.decay}
              onChange={(event) =>
                onTrackEnvelopeChange("decay", Number(event.target.value))
              }
            />
          </div>
          <div className="control-group">
            <label htmlFor="track-sustain">Sustain</label>
            <input
              id="track-sustain"
              max="1"
              min="0"
              step="0.01"
              type="number"
              value={envelope.sustain}
              onChange={(event) =>
                onTrackEnvelopeChange("sustain", Number(event.target.value))
              }
            />
          </div>
          <div className="control-group">
            <label htmlFor="track-release">Release</label>
            <input
              id="track-release"
              max="2"
              min="0.001"
              step="0.001"
              type="number"
              value={envelope.release}
              onChange={(event) =>
                onTrackEnvelopeChange("release", Number(event.target.value))
              }
            />
          </div>
        </div>
      </section>
    </>
  )
}
