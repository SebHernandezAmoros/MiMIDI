import { AppDialog } from "../../../app/components/AppDialog"
import {
  getInstrumentCategoryDescription,
  getInstrumentCategoryLabel,
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "../../../engine/audio/mathematicalInstruments"

type InstrumentDialogItem = MathematicalInstrument & { sourceLabel: string }

type PerformInstrumentDialogProps = {
  activeCategory: MathematicalInstrument["category"]
  instrumentCategories: MathematicalInstrument["category"][]
  instruments: InstrumentDialogItem[]
  open: boolean
  selectedInstrumentId: MathematicalInstrumentId
  onCategoryChange: (category: MathematicalInstrument["category"]) => void
  onClose: () => void
  onInstrumentSelect: (instrumentId: MathematicalInstrumentId) => void
}

export function PerformInstrumentDialog({
  activeCategory,
  instrumentCategories,
  instruments,
  open,
  selectedInstrumentId,
  onCategoryChange,
  onClose,
  onInstrumentSelect,
}: PerformInstrumentDialogProps) {
  return (
    <AppDialog
      description="Selecciona el tipo y el instrumento."
      onClose={onClose}
      open={open}
      title="Instrumentos"
    >
      <div className="perform-instrument-dialog-v">
        <div className="perform-instrument-dialog-section">
          <span className="perform-instrument-dialog-title">Tipo</span>
          <div className="perform-instrument-dialog-tabs">
            {instrumentCategories.map((category) => (
              <button
                className={`ui-pill-btn${category === activeCategory ? " ui-pill-btn-active" : ""}`}
                key={category}
                onClick={() => onCategoryChange(category)}
                type="button"
              >
                {getInstrumentCategoryLabel(category)}
              </button>
            ))}
          </div>
          <p className="perform-instrument-dialog-note">
            {getInstrumentCategoryDescription(activeCategory)}
          </p>
        </div>

        <div className="perform-instrument-dialog-section">
          <span className="perform-instrument-dialog-title">Instrumentos</span>
          <div className="perform-instrument-dialog-list perform-instrument-dialog-list-scroll">
            {instruments.map((instrument) => (
              <button
                className={instrument.id === selectedInstrumentId ? "mode-switch-active" : ""}
                key={instrument.id}
                onClick={() => {
                  onInstrumentSelect(instrument.id)
                  onClose()
                }}
                type="button"
              >
                <span className="instrument-dialog-name">{instrument.name}</span>
                <span className="instrument-dialog-source">{instrument.sourceLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppDialog>
  )
}
