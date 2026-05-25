import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { resolveAppMessages, type AppLanguage } from "../../../app/appI18n"
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
  language?: AppLanguage
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
  language,
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
  const tp = resolveAppMessages(language ?? "es").lab.perform

  return (
    <>
      {/* Grupo 1: Transporte (grabar / reproducir) */}
      <div className="perform-mode-transport" aria-label={tp.transportControls}>
        <button
          aria-label={isRecording ? tp.stopRecording : tp.startRecording}
          className={`perform-mode-transport-button ${
            isRecording ? "perform-mode-transport-button-active" : "perform-mode-transport-record"
          }`}
          data-tutorial="record-button"
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
          aria-label={isPlaying ? tp.stopPlayback : tp.playRecording}
          className={`perform-mode-transport-button ${
            isPlaying ? "perform-mode-transport-button-active" : "perform-mode-transport-play"
          }`}
          data-tutorial="play-button"
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

      {/* Grupo 2: Qué tocas — pista, instrumento y octava */}
      <div className="ui-pad-pager" data-tutorial="track-selector">
        <button
          aria-label={tp.previousTrack}
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
          aria-label={tp.nextTrack}
          className="ui-icon-btn"
          disabled={trackNextDisabled}
          onClick={onSelectNextTrack}
          type="button"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <button
        className="ui-pill-btn"
        data-tutorial="instrument-button"
        onClick={onInstrumentDialogOpen}
        style={{ maxWidth: "8.5rem", overflow: "hidden", textOverflow: "ellipsis" }}
        title={selectedInstrumentName}
        type="button"
      >
        {selectedInstrumentName.toUpperCase()}
      </button>

      <div className="ui-counter" aria-label={tp.octaveControl} data-tutorial="octave-control">
        <button
          aria-label={tp.octaveDown}
          className="ui-counter-btn"
          onClick={onOctaveDown}
          type="button"
        >
          −
        </button>
        <span className="ui-counter-value">{octave}</span>
        <button
          aria-label={tp.octaveUp}
          className="ui-counter-btn"
          onClick={onOctaveUp}
          type="button"
        >
          +
        </button>
      </div>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Grupo 3: Cómo tocas — modo de nota y arpegiador */}
      <div className="ui-toggle-group" role="group" aria-label={tp.pianoMode} data-tutorial="piano-mode-toggle">
        <button
          aria-pressed={pianoMode === "note"}
          onClick={() => onPianoModeChange("note")}
          type="button"
        >
          {tp.modeNote}
        </button>
        <button
          aria-pressed={pianoMode === "chord"}
          onClick={() => onPianoModeChange("chord")}
          type="button"
        >
          {tp.modeChord}
        </button>
      </div>

      <label className="perform-mode-arp-toggle" aria-label={tp.arpLabel} data-tutorial="piano-arp-toggle">
        <input
          checked={isArpEnabled}
          className="ui-checkbox"
          onChange={onArpToggle}
          type="checkbox"
        />
        <span>ARP</span>
      </label>

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Grupo 4: Estructural — añadir y eliminar pistas */}
      <button className="ui-pill-btn" data-tutorial="add-track-button" onClick={onAddTrack} type="button">
        {tp.addTrack}
      </button>

      <button
        aria-label={tp.removeActiveTrack}
        className="ui-icon-btn"
        data-tutorial="remove-track-button"
        disabled={removeTrackDisabled}
        onClick={onConfirmRemoveTrack}
        type="button"
      >
        <Trash2 size={18} />
      </button>

      <PerformInstrumentDialog
        activeCategory={activeInstrumentCategory}
        instrumentCategories={instrumentCategories}
        instruments={visibleInstruments}
        language={language}
        onCategoryChange={onInstrumentCategoryChange}
        onClose={onCloseInstrumentDialog}
        onInstrumentSelect={onInstrumentSelect}
        open={isInstrumentDialogOpen}
        selectedInstrumentId={selectedInstrumentId}
      />
    </>
  )
}
