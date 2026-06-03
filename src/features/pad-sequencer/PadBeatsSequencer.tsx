import "./PadBeatsSequencer.css"
import type { SmcPadSoundDescriptor } from "../../application/use-cases/playSmcPadHit"
import type { StepCount } from "../step-sequencer/useMelodicSequencer"

type Props = {
  sounds: SmcPadSoundDescriptor[]
  grid: boolean[][]
  stepCount: StepCount
  activeStep: number | null
  onToggleStep: (row: number, col: number) => void
}

export function PadBeatsSequencer({ sounds, grid, stepCount, activeStep, onToggleStep }: Props) {
  return (
    <div className="pbs-grid">
      {sounds.map((sound, rowIdx) => (
        <div className="pbs-row" key={sound.id}>
          <span className={`pbs-sound-label pbs-sound-${sound.id}`}>
            {sound.label}
          </span>
          {Array.from({ length: stepCount }, (_, colIdx) => {
            const isActive = grid[rowIdx]?.[colIdx] ?? false
            const isCursor = activeStep === colIdx
            const isBeatStart = colIdx > 0 && colIdx % 4 === 0
            return (
              <button
                key={colIdx}
                aria-label={`${sound.label} paso ${colIdx + 1}`}
                aria-pressed={isActive}
                className={[
                  "pbs-cell",
                  isActive ? "pbs-cell-on" : "",
                  isCursor ? "pbs-cell-cursor" : "",
                  isActive && isCursor ? "pbs-cell-on-cursor" : "",
                  isBeatStart ? "pbs-cell-beat-start" : "",
                ].filter(Boolean).join(" ")}
                onPointerDown={() => onToggleStep(rowIdx, colIdx)}
                type="button"
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
