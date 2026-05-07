import { AppDialog } from "../../../app/components/AppDialog"
import {
  getInstrumentCategoryDescription,
  getInstrumentCategoryLabel,
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "../../../engine/audio/mathematicalInstruments"

type PerformInstrumentDialogProps = {
  activeCategory: MathematicalInstrument["category"]
  instrumentCategories: MathematicalInstrument["category"][]
  instruments: MathematicalInstrument[]
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
      actions={
        <button onClick={onClose} type="button">
          Cerrar
        </button>
      }
      description="Selecciona primero el tipo de instrumento y luego el sonido disponible."
      onClose={onClose}
      open={open}
      title="Instrumentos"
    >
      <div className="perform-instrument-dialog-layout">
        <section className="perform-instrument-dialog-panel">
          <span className="perform-instrument-dialog-title">Tipo</span>
          <div className="perform-instrument-dialog-list">
            {instrumentCategories.map((category) => (
              <button
                className={category === activeCategory ? "mode-switch-active" : ""}
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
        </section>

        <section className="perform-instrument-dialog-panel">
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
                {instrument.name}
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppDialog>
  )
}
