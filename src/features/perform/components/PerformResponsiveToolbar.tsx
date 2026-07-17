import { ChevronLeft, ChevronRight, Layers, SquarePlus, Trash2 } from "lucide-react"
import { resolveAppMessages, type AppLanguage } from "../../../app/appI18n"
import type {
  MathematicalInstrument,
  MathematicalInstrumentId,
} from "../../../engine/audio/mathematicalInstruments"
import type { PianoInteractionMode } from "../../piano/PianoPreview"
import type { StepCount } from "../../step-sequencer/useMelodicSequencer"
import { PerformInstrumentDialog } from "./PerformInstrumentDialog"

export type PianoViewMode = "keys" | "steps"

type PerformResponsiveToolbarProps = {
  activeInstrumentCategory: MathematicalInstrument["category"]
  allRecordedNotesCount: number
  instrumentCategories: MathematicalInstrument["category"][]
  isInstrumentDialogOpen: boolean
  isPlaying: boolean
  isRecording: boolean
  language?: AppLanguage
  onAddTrack: () => void
  onCloseInstrumentDialog: () => void
  onConfirmRemoveTrack: () => void
  onInstrumentCategoryChange: (category: MathematicalInstrument["category"]) => void
  onInstrumentDialogOpen: () => void
  onInstrumentSelect: (instrumentId: MathematicalInstrumentId) => void
  onOctaveDown: () => void
  onOctaveUp: () => void
  onPianoModeChange: (mode: PianoInteractionMode) => void
  onPianoViewModeChange: (mode: PianoViewMode) => void
  onPlayToggle: () => void
  onRecordToggle?: () => void
  onSelectNextTrack: () => void
  onSelectPreviousTrack: () => void
  onBakeStepsToTrack: () => void
  onStepClear: () => void
  onStepCountChange: (count: StepCount) => void
  octave: number
  pianoMode: PianoInteractionMode
  pianoViewMode: PianoViewMode
  primaryTrackName: string
  removeTrackDisabled: boolean
  selectedInstrumentId: MathematicalInstrumentId
  selectedInstrumentName: string
  stepCount: StepCount
  trackNextDisabled: boolean
  trackPreviousDisabled: boolean
  visibleInstruments: (MathematicalInstrument & { sourceLabel: string })[]
}

export function PerformResponsiveToolbar({
  activeInstrumentCategory,
  allRecordedNotesCount,
  instrumentCategories,
  isInstrumentDialogOpen,
  isPlaying,
  isRecording,
  language,
  onAddTrack,
  onBakeStepsToTrack,
  onCloseInstrumentDialog,
  onConfirmRemoveTrack,
  onInstrumentCategoryChange,
  onInstrumentDialogOpen,
  onInstrumentSelect,
  onOctaveDown,
  onOctaveUp,
  onPianoViewModeChange,
  onPlayToggle,
  onRecordToggle,
  onSelectNextTrack,
  onSelectPreviousTrack,
  onStepClear,
  octave,
  pianoViewMode,
  primaryTrackName,
  removeTrackDisabled,
  selectedInstrumentId,
  selectedInstrumentName,
  trackNextDisabled,
  trackPreviousDisabled,
  visibleInstruments,
}: PerformResponsiveToolbarProps) {
  const tp = resolveAppMessages(language ?? "es").lab.perform
  const isStepsMode = pianoViewMode === "steps"

  return (
    <>
      {/* Grupo 1: Transporte (grabar / reproducir) */}
      <div className="perform-mode-transport" aria-label={tp.transportControls}>
        {!isStepsMode && onRecordToggle && (
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
        )}

        {isStepsMode && (
          <button
            aria-label="Enviar patrón al timeline"
            className="perform-mode-transport-button perform-mode-transport-record"
            onClick={onBakeStepsToTrack}
            title="Enviar patrón al timeline"
            type="button"
          >
            <span aria-hidden="true" className="perform-mode-transport-icon">
              <Layers size={16} className="perform-mode-transport-glyph-record" />
            </span>
          </button>
        )}

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

      {/* Modo de entrada: Keys / Steps */}
      <div className="ui-toggle-group" role="group" aria-label="Modo de entrada" data-tutorial="piano-view-mode-toggle">
        <button
          aria-pressed={!isStepsMode}
          data-tutorial="piano-view-mode-keys-btn"
          onClick={() => onPianoViewModeChange("keys")}
          type="button"
        >
          {tp.modeKeys ?? "Keys"}
        </button>
        <button
          aria-pressed={isStepsMode}
          data-tutorial="piano-view-mode-steps-btn"
          onClick={() => onPianoViewModeChange("steps")}
          type="button"
        >
          {tp.modeSteps ?? "Steps"}
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

      {!isStepsMode && (
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
      )}

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Grupo 3: Cómo tocas — condicional según modo de vista */}
      {isStepsMode && (
        <button
          className="ui-pill-btn"
          onClick={onStepClear}
          type="button"
        >
          CLEAR
        </button>
      )}

      <span aria-hidden="true" className="perform-mode-transport-divider" />

      {/* Grupo 4: Estructural — añadir y eliminar pistas */}
      {isStepsMode ? (
        <button
          aria-label={tp.addStepsTrack ?? "Añadir pista de pasos"}
          className="ui-icon-btn"
          data-tutorial="add-track-button"
          onClick={onAddTrack}
          title={tp.addStepsTrack ?? "Añadir pista de pasos"}
          type="button"
        >
          <SquarePlus size={18} />
        </button>
      ) : (
        <button className="ui-pill-btn" data-tutorial="add-track-button" onClick={onAddTrack} type="button">
          {tp.addTrack}
        </button>
      )}

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
