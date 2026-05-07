import type {
  MathematicalInstrument,
  MathematicalInstrumentId,
} from "../../../engine/audio/mathematicalInstruments"
import { PerformInstrumentDialog } from "./PerformInstrumentDialog"

type PerformResponsiveToolbarProps = {
  activeInstrumentCategory: MathematicalInstrument["category"]
  allRecordedNotesCount: number
  instrumentCategories: MathematicalInstrument["category"][]
  isInstrumentDialogOpen: boolean
  isPlaying: boolean
  isRecording: boolean
  onAddTrack: () => void
  onCloseInstrumentDialog: () => void
  onConfirmRemoveTrack: () => void
  onInstrumentCategoryChange: (category: MathematicalInstrument["category"]) => void
  onInstrumentDialogOpen: () => void
  onInstrumentSelect: (instrumentId: MathematicalInstrumentId) => void
  onOctaveDown: () => void
  onOctaveUp: () => void
  onPlayToggle: () => void
  onRecordToggle: () => void
  onSelectNextTrack: () => void
  onSelectPreviousTrack: () => void
  octave: number
  primaryTrackName: string
  removeTrackDisabled: boolean
  selectedInstrumentId: MathematicalInstrumentId
  selectedInstrumentName: string
  trackNextDisabled: boolean
  trackPreviousDisabled: boolean
  visibleInstruments: MathematicalInstrument[]
}

export function PerformResponsiveToolbar({
  activeInstrumentCategory,
  allRecordedNotesCount,
  instrumentCategories,
  isInstrumentDialogOpen,
  isPlaying,
  isRecording,
  onAddTrack,
  onCloseInstrumentDialog,
  onConfirmRemoveTrack,
  onInstrumentCategoryChange,
  onInstrumentDialogOpen,
  onInstrumentSelect,
  onOctaveDown,
  onOctaveUp,
  onPlayToggle,
  onRecordToggle,
  onSelectNextTrack,
  onSelectPreviousTrack,
  octave,
  primaryTrackName,
  removeTrackDisabled,
  selectedInstrumentId,
  selectedInstrumentName,
  trackNextDisabled,
  trackPreviousDisabled,
  visibleInstruments,
}: PerformResponsiveToolbarProps) {
  return (
    <>
      <div className="perform-mode-toolbar">
        <div className="perform-mode-transport" aria-label="Controles de grabacion">
          <button
            aria-label={isRecording ? "Detener grabacion" : "Iniciar grabacion"}
            className={`perform-mode-transport-button ${
              isRecording ? "perform-mode-transport-button-active" : "perform-mode-transport-record"
            }`}
            onClick={onRecordToggle}
            type="button"
          >
            <span aria-hidden="true" className="perform-mode-transport-icon">
              <span
                className={
                  isRecording
                    ? "perform-mode-transport-glyph perform-mode-transport-glyph-stop"
                    : "perform-mode-transport-glyph perform-mode-transport-glyph-record"
                }
              >
                {isRecording ? "\u25A0" : "\u25CF"}
              </span>
            </span>
          </button>

          <button
            aria-label={isPlaying ? "Detener reproduccion" : "Reproducir grabacion"}
            className={`perform-mode-transport-button ${
              isPlaying ? "perform-mode-transport-button-active" : "perform-mode-transport-play"
            }`}
            disabled={isRecording || (!allRecordedNotesCount && !isPlaying)}
            onClick={onPlayToggle}
            type="button"
          >
            <span aria-hidden="true" className="perform-mode-transport-icon">
              <span
                className={
                  isPlaying
                    ? "perform-mode-transport-glyph perform-mode-transport-glyph-stop"
                    : "perform-mode-transport-glyph perform-mode-transport-glyph-play"
                }
              >
                {isPlaying ? "\u25A0" : "\u25B6"}
              </span>
            </span>
          </button>
        </div>

        <div className="perform-mode-track-strip perform-mode-track-strip-primary">
          <button
            aria-label="Pista anterior"
            disabled={trackPreviousDisabled}
            onClick={onSelectPreviousTrack}
            type="button"
          >
            {"<"}
          </button>
          <div className="perform-mode-track-display perform-mode-track-display-compact">
            <strong>{primaryTrackName.toUpperCase()}</strong>
          </div>
          <button
            aria-label="Pista siguiente"
            disabled={trackNextDisabled}
            onClick={onSelectNextTrack}
            type="button"
          >
            {">"}
          </button>
        </div>

        <div className="perform-mode-track-actions">
          <button
            className="perform-mode-instrument-button"
            onClick={onInstrumentDialogOpen}
            type="button"
          >
            {selectedInstrumentName.toUpperCase()}
          </button>
          <button className="perform-mode-add-track" onClick={onAddTrack} type="button">
            + TRACK
          </button>
          <button
            aria-label="Eliminar pista activa"
            className="perform-mode-remove-track"
            disabled={removeTrackDisabled}
            onClick={onConfirmRemoveTrack}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M8.75 5.5h6.5M10 4h4m-7 2.2h10m-8.8 2.1.55 8.1a1 1 0 0 0 1 .93h4.5a1 1 0 0 0 1-.93l.55-8.1M10.75 10.1v4.9m2.5-4.9v4.9"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>

        <div className="perform-mode-octave-cluster" aria-label="Octava visible activa">
          <span className="perform-mode-octave-label">OCT</span>
          <div className="perform-mode-octave-controls">
            <button aria-label="Bajar octava" onClick={onOctaveDown} type="button">
              -
            </button>
            <strong>{octave}</strong>
            <button aria-label="Subir octava" onClick={onOctaveUp} type="button">
              +
            </button>
          </div>
        </div>
      </div>

      <PerformInstrumentDialog
        activeCategory={activeInstrumentCategory}
        instrumentCategories={instrumentCategories}
        instruments={visibleInstruments}
        onCategoryChange={onInstrumentCategoryChange}
        onClose={onCloseInstrumentDialog}
        onInstrumentSelect={onInstrumentSelect}
        open={isInstrumentDialogOpen}
        selectedInstrumentId={selectedInstrumentId}
      />
    </>
  )
}
