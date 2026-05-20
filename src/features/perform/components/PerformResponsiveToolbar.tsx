import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import type {
  MathematicalInstrument,
  MathematicalInstrumentId,
} from "../../../engine/audio/mathematicalInstruments"
import type { PianoInteractionMode } from "../../piano/PianoPreview"
import { PerformInstrumentDialog } from "./PerformInstrumentDialog"

type PerformResponsiveToolbarProps = {
  activeInstrumentCategory: MathematicalInstrument["category"]
  allRecordedNotesCount: number
  instrumentCategories: MathematicalInstrument["category"][]
  isArpEnabled: boolean
  isInstrumentDialogOpen: boolean
  isPlaying: boolean
  isRecording: boolean
  onAddTrack: () => void
  onArpToggle: () => void
  onCloseInstrumentDialog: () => void
  onConfirmRemoveTrack: () => void
  onInstrumentCategoryChange: (category: MathematicalInstrument["category"]) => void
  onInstrumentDialogOpen: () => void
  onInstrumentSelect: (instrumentId: MathematicalInstrumentId) => void
  onOctaveDown: () => void
  onOctaveUp: () => void
  onPianoModeChange: (mode: PianoInteractionMode) => void
  onPlayToggle: () => void
  onRecordToggle: () => void
  onSelectNextTrack: () => void
  onSelectPreviousTrack: () => void
  octave: number
  pianoMode: PianoInteractionMode
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
  isArpEnabled,
  isInstrumentDialogOpen,
  isPlaying,
  isRecording,
  onAddTrack,
  onArpToggle,
  onCloseInstrumentDialog,
  onConfirmRemoveTrack,
  onInstrumentCategoryChange,
  onInstrumentDialogOpen,
  onInstrumentSelect,
  onOctaveDown,
  onOctaveUp,
  onPianoModeChange,
  onPlayToggle,
  onRecordToggle,
  onSelectNextTrack,
  onSelectPreviousTrack,
  octave,
  pianoMode,
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
      {/* Record + Play */}
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
              {isRecording ? "■" : "●"}
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
              {isPlaying ? "■" : "▶"}
            </span>
          </span>
        </button>
      </div>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* ARP toggle */}
      <label className="perform-mode-arp-toggle" aria-label="Arpegiador">
        <input
          checked={isArpEnabled}
          className="ui-checkbox"
          onChange={onArpToggle}
          type="checkbox"
        />
        <span>ARP</span>
      </label>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* NOTA / ACO mode */}
      <div className="edit-view-switch" role="group" aria-label="Modo del piano">
        <button
          aria-pressed={pianoMode === "note"}
          onClick={() => onPianoModeChange("note")}
          type="button"
        >
          NOTA
        </button>
        <button
          aria-pressed={pianoMode === "chord"}
          onClick={() => onPianoModeChange("chord")}
          type="button"
        >
          ACO
        </button>
      </div>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Track navigation */}
      <div className="ui-pad-pager">
        <button
          aria-label="Pista anterior"
          className="ui-icon-btn"
          disabled={trackPreviousDisabled}
          onClick={onSelectPreviousTrack}
          type="button"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="ui-pad-pager-label" style={{ minWidth: "5rem" }}>
          {primaryTrackName.toUpperCase()}
        </span>
        <button
          aria-label="Pista siguiente"
          className="ui-icon-btn"
          disabled={trackNextDisabled}
          onClick={onSelectNextTrack}
          type="button"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Instrument selector */}
      <button
        className="ui-pill-btn"
        onClick={onInstrumentDialogOpen}
        style={{ maxWidth: "8.5rem", overflow: "hidden", textOverflow: "ellipsis" }}
        title={selectedInstrumentName}
        type="button"
      >
        {selectedInstrumentName.toUpperCase()}
      </button>

      {/* Add track */}
      <button className="ui-pill-btn" onClick={onAddTrack} type="button">
        + Track
      </button>

      {/* Remove track */}
      <button
        aria-label="Eliminar pista activa"
        className="ui-icon-btn"
        disabled={removeTrackDisabled}
        onClick={onConfirmRemoveTrack}
        type="button"
      >
        <Trash2 size={18} />
      </button>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Octave counter */}
      <div className="ui-counter" aria-label="Octava visible activa">
        <button
          aria-label="Bajar octava"
          className="ui-counter-btn"
          onClick={onOctaveDown}
          type="button"
        >
          −
        </button>
        <span className="ui-counter-value">{octave}</span>
        <button
          aria-label="Subir octava"
          className="ui-counter-btn"
          onClick={onOctaveUp}
          type="button"
        >
          +
        </button>
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
