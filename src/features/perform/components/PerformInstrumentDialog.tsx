import { AppDialog } from "../../../app/components/AppDialog"
import { resolveAppMessages, type AppLanguage } from "../../../app/appI18n"
import {
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "../../../engine/audio/mathematicalInstruments"

type InstrumentDialogItem = MathematicalInstrument & { sourceLabel: string }

type PerformInstrumentDialogProps = {
  activeCategory: MathematicalInstrument["category"]
  instrumentCategories: MathematicalInstrument["category"][]
  instruments: InstrumentDialogItem[]
  language?: AppLanguage
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
  language,
  open,
  selectedInstrumentId,
  onCategoryChange,
  onClose,
  onInstrumentSelect,
}: PerformInstrumentDialogProps) {
  const tp = resolveAppMessages(language ?? "es").lab.perform

  function getCategoryLabel(category: MathematicalInstrument["category"]) {
    return category === "advanced" ? tp.categoryAdvanced : tp.categoryBase
  }

  function getCategoryDescription(category: MathematicalInstrument["category"]) {
    return category === "advanced" ? tp.categoryAdvancedDesc : tp.categoryBaseDesc
  }

  return (
    <AppDialog
      description={tp.instrumentDialogDesc}
      onClose={onClose}
      open={open}
      title={tp.instrumentDialogTitle}
    >
      <div className="perform-instrument-dialog-v">
        <div className="perform-instrument-dialog-section">
          <span className="perform-instrument-dialog-title">{tp.instrumentType}</span>
          <div className="perform-instrument-dialog-tabs">
            {instrumentCategories.map((category) => (
              <button
                className={`ui-pill-btn${category === activeCategory ? " ui-pill-btn-active" : ""}`}
                key={category}
                onClick={() => onCategoryChange(category)}
                type="button"
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
          <p className="perform-instrument-dialog-note">
            {getCategoryDescription(activeCategory)}
          </p>
        </div>

        <div className="perform-instrument-dialog-section">
          <span className="perform-instrument-dialog-title">{tp.instrumentList}</span>
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
