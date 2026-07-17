import type { CSSProperties } from "react"
import { useRef, useState } from "react"
import type {
  ActiveNoteId,
  PlayNoteOptions,
} from "../../application/use-cases/playNote"
import { playNote, startNote, stopNote } from "../../application/use-cases/playNote"
import type { MusicalNote } from "../../engine/midi/notes"
import "./PianoPreview.css"

export type PianoInteractionMode = "note" | "chord"

type PianoPreviewProps = {
  notes: MusicalNote[]
  selectedNote: MusicalNote
  playOptions: PlayNoteOptions
  resolvePlayOptions?: () => PlayNoteOptions
  interactionMode?: PianoInteractionMode
  getPlayableNotes?: (note: MusicalNote) => MusicalNote[]
  onSelectNote: (note: MusicalNote) => void
  directPlaybackEnabled?: boolean
  onNoteOff?: (note: MusicalNote) => void
  onNoteOn?: (note: MusicalNote) => void
  onTriggerNoteOff?: (note: MusicalNote) => void
  onTriggerNoteOn?: (note: MusicalNote) => void
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
  resolvePlayOptions,
  interactionMode = "note",
  getPlayableNotes,
  onSelectNote,
  directPlaybackEnabled = true,
  onNoteOff,
  onNoteOn,
  onTriggerNoteOff,
  onTriggerNoteOn,
}: PianoPreviewProps) {
  const [activeNotes, setActiveNotes] = useState<MusicalNote[]>([])
  const activeNotesRef = useRef(new Map<MusicalNote, ActiveNoteId[]>())
  const naturalNotes = getNaturalNotes(notes)
  const sharpNotes = notes.filter(isSharp)

  function resolvePlayableNotes(note: MusicalNote) {
    if (interactionMode === "chord") {
      return getPlayableNotes?.(note) ?? [note]
    }

    return [note]
  }

  function playPianoNoteOnce(note: MusicalNote) {
    onSelectNote(note)
    onTriggerNoteOn?.(note)

    if (!directPlaybackEnabled) {
      window.setTimeout(() => {
        onTriggerNoteOff?.(note)
      }, 0)
      return
    }

    const playableNotes = resolvePlayableNotes(note)
    const nextPlayOptions = resolvePlayOptions?.() ?? playOptions

    playableNotes.forEach((playableNote) => {
      playNote(playableNote, 0.75, nextPlayOptions)
    })
  }

  function startPianoNote(note: MusicalNote) {
    if (activeNotesRef.current.has(note)) {
      return
    }

    onSelectNote(note)
    onTriggerNoteOn?.(note)

    if (!directPlaybackEnabled) {
      activeNotesRef.current.set(note, [])
      setActiveNotes((currentNotes) => Array.from(new Set([...currentNotes, note])))
      return
    }

    const playableNotes = resolvePlayableNotes(note)
    const nextPlayOptions = resolvePlayOptions?.() ?? playOptions
    const activeNoteIds = playableNotes.map((playableNote) => {
      onNoteOn?.(playableNote)

      return startNote(playableNote, nextPlayOptions)
    })

    activeNotesRef.current.set(note, activeNoteIds)
    setActiveNotes((currentNotes) =>
      Array.from(new Set([...currentNotes, ...playableNotes])),
    )
  }

  function stopPianoNote(note: MusicalNote) {
    const activeNoteIds = activeNotesRef.current.get(note)

    if (!activeNoteIds) {
      return
    }

    const playableNotes = resolvePlayableNotes(note)
    onTriggerNoteOff?.(note)

    if (!directPlaybackEnabled) {
      activeNotesRef.current.delete(note)
      setActiveNotes((currentNotes) => currentNotes.filter((currentNote) => currentNote !== note))
      return
    }

    playableNotes.forEach((playableNote, index) => {
      onNoteOff?.(playableNote)
      stopNote(activeNoteIds[index])
    })

    activeNotesRef.current.delete(note)
    setActiveNotes((currentNotes) =>
      currentNotes.filter((currentNote) => !playableNotes.includes(currentNote)),
    )
  }

  function renderPianoKey(note: MusicalNote, className: string) {
    const isActive = activeNotes.includes(note)
    const keyClassName = [
      "piano-key",
      className,
      note === selectedNote ? "piano-key-selected" : "",
      isActive ? "piano-key-active" : "",
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <button
        className={keyClassName}
        data-e2e={`piano-key-${note}`}
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
        <span className="piano-key-label">{note}</span>
      </button>
    )
  }

  return (
    <div
      className="piano-preview"
      style={{ "--natural-key-count": naturalNotes.length } as PianoStyle}
      aria-label="Piano de prueba"
      data-tutorial="piano-keys"
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
