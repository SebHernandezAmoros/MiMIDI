import type { MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import type { ProjectTrack } from "../../engine/project/projectModel"

type LabProjectPanelProps = {
  noteCount: number
  onAddTrack: () => void
  onProjectNameChange: (name: string) => void
  onRemoveActiveTrack: () => void
  onSwitchActiveTrack: (trackId: string) => void
  onTrackNameChange: (name: string) => void
  onTrackInstrumentChange: (instrumentId: MathematicalInstrumentId) => void
  primaryTrackId: string
  primaryTrackInstrumentId: MathematicalInstrumentId
  primaryTrackName: string
  projectMessage: string
  projectName: string
  trackCount: number
  tracks: ProjectTrack[]
  instrumentOptions: { id: MathematicalInstrumentId; name: string }[]
}

export function LabProjectPanel({
  noteCount,
  onAddTrack,
  onProjectNameChange,
  onRemoveActiveTrack,
  onSwitchActiveTrack,
  onTrackNameChange,
  onTrackInstrumentChange,
  primaryTrackId,
  primaryTrackInstrumentId,
  primaryTrackName,
  projectMessage,
  projectName,
  trackCount,
  tracks,
  instrumentOptions,
}: LabProjectPanelProps) {
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
    </>
  )
}
