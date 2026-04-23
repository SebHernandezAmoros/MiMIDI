import type { CSSProperties } from "react"
import { useRef, useState } from "react"
import type {
  ActiveNoteId,
  PlayNoteOptions,
} from "../../application/use-cases/playNote"
import { playNote, startNote, stopNote } from "../../application/use-cases/playNote"
import type { MusicalNote } from "../../engine/midi/notes"
import "./PianoPreview.css"

type PianoPreviewProps = {
  notes: MusicalNote[]
  selectedNote: MusicalNote
  playOptions: PlayNoteOptions
  onSelectNote: (note: MusicalNote) => void
  onNoteOff?: (note: MusicalNote) => void
  onNoteOn?: (note: MusicalNote) => void
}

type PianoStyle = CSSProperties & {
  "--natural-key-count"?: number
  "--sharp-key-position"?: number
}

function isSharp(note: MusicalNote) {
  return note.includes("#")
}

function getNaturalNotes(notes: MusicalNote[]) {
  return notes.filter((note) => !isSharp(note))
}

function getSharpNotePosition(note: MusicalNote, naturalNotes: MusicalNote[]) {
  const naturalName = note.split("#")[0]
  const naturalIndex = naturalNotes.findIndex((naturalNote) =>
    naturalNote.startsWith(naturalName),
  )

  return naturalIndex + 1
}

export function PianoPreview({
  notes,
  selectedNote,
  playOptions,
  onSelectNote,
  onNoteOff,
  onNoteOn,
}: PianoPreviewProps) {
  const [activeNotes, setActiveNotes] = useState<MusicalNote[]>([])
  const activeNotesRef = useRef(new Map<MusicalNote, ActiveNoteId>())
  const naturalNotes = getNaturalNotes(notes)
  const sharpNotes = notes.filter(isSharp)

  function playPianoNoteOnce(note: MusicalNote) {
    onSelectNote(note)
    playNote(note, 0.75, playOptions)
  }

  function startPianoNote(note: MusicalNote) {
    if (activeNotesRef.current.has(note)) {
      return
    }

    onSelectNote(note)
    onNoteOn?.(note)
    activeNotesRef.current.set(note, startNote(note, playOptions))
    setActiveNotes((currentNotes) => [...currentNotes, note])
  }

  function stopPianoNote(note: MusicalNote) {
    const activeNoteId = activeNotesRef.current.get(note)

    if (!activeNoteId) {
      return
    }

    onNoteOff?.(note)
    stopNote(activeNoteId)
    activeNotesRef.current.delete(note)
    setActiveNotes((currentNotes) =>
      currentNotes.filter((currentNote) => currentNote !== note),
    )
  }

  function renderPianoKey(note: MusicalNote, className: string) {
    const isActive = activeNotes.includes(note)
    const keyClassName = [
      "piano-key",
      className,
      note === selectedNote || isActive ? "piano-key-selected" : "",
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <button
        className={keyClassName}
        key={note}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            playPianoNoteOnce(note)
          }
        }}
        onPointerCancel={() => stopPianoNote(note)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          startPianoNote(note)
        }}
        onPointerLeave={() => stopPianoNote(note)}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId)
          stopPianoNote(note)
        }}
        type="button"
      >
        {note}
      </button>
    )
  }

  return (
    <div
      className="piano-preview"
      style={{ "--natural-key-count": naturalNotes.length } as PianoStyle}
      aria-label="Piano de prueba"
    >
      <div className="piano-natural-keys">
        {naturalNotes.map((note) => renderPianoKey(note, "piano-key-natural"))}
      </div>

      <div className="piano-sharp-keys" aria-hidden={false}>
        {sharpNotes.map((note) => (
          <div
            className="piano-sharp-key-slot"
            key={note}
            style={
              {
                "--sharp-key-position": getSharpNotePosition(note, naturalNotes),
              } as PianoStyle
            }
          >
            {renderPianoKey(note, "piano-key-sharp")}
          </div>
        ))}
      </div>
    </div>
  )
}
