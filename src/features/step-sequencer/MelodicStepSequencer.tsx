import "./MelodicStepSequencer.css"
import type { MusicalNote } from "../../engine/midi/notes"
import type { StepCount } from "./useMelodicSequencer"

type Props = {
  notes: MusicalNote[]
  grid: boolean[][]
  stepCount: StepCount
  activeStep: number | null
  onToggleStep: (row: number, col: number) => void
}

function isSharp(note: MusicalNote): boolean {
  return note.includes("#")
}

function getKeyLabel(note: MusicalNote): string {
  // Mostrar octava solo en C (como Ableton): "C4", "C5"
  // El resto: solo el nombre sin número: "B", "A#", "G#"…
  const match = note.match(/^([A-G]#?)(\d)$/)
  if (!match) return note
  const [, name, oct] = match
  return name === "C" ? `C${oct}` : name
}

export function MelodicStepSequencer({ notes, grid, stepCount, activeStep, onToggleStep }: Props) {
  // notes llega de bajo a alto (C4…C5), mostramos de alto a bajo
  const displayNotes = [...notes].reverse()

  return (
    <div className="mss-grid" data-tutorial="steps-grid">
      {displayNotes.map((note, rowIdx) => {
        const sharp = isSharp(note)
        return (
          <div className="mss-row" key={note}>
            <span className={`mss-key-label ${sharp ? "mss-key-sharp" : "mss-key-natural"}`}>
              {getKeyLabel(note)}
            </span>
            {Array.from({ length: stepCount }, (_, colIdx) => {
              const isActive = grid[rowIdx]?.[colIdx] ?? false
              const isCursor = activeStep === colIdx
              const isBeatStart = colIdx > 0 && colIdx % 4 === 0
              return (
                <button
                  key={colIdx}
                  aria-label={`${note} paso ${colIdx + 1}`}
                  aria-pressed={isActive}
                  className={[
                    "mss-cell",
                    isActive ? "mss-cell-on" : "",
                    isCursor ? "mss-cell-cursor" : "",
                    isActive && isCursor ? "mss-cell-on-cursor" : "",
                    isBeatStart ? "mss-cell-beat-start" : "",
                  ].filter(Boolean).join(" ")}
                  onPointerDown={() => onToggleStep(rowIdx, colIdx)}
                  type="button"
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
