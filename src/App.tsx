import { useRef, useState } from "react"
import "./App.css"
import type { PlaybackHandle } from "./application/use-cases/playRecordedNotes"
import { playRecordedNotes } from "./application/use-cases/playRecordedNotes"
import { playNote, playNotes } from "./application/use-cases/playNote"
import { setMasterVolume, stopAllVoices } from "./engine/audio/audioEngine"
import {
  createPlayOptions,
  findMathematicalInstrument,
  mathematicalInstruments,
  type MathematicalInstrumentId,
} from "./engine/audio/mathematicalInstruments"
import {
  createMidiRecordedNote,
  createMidiNoteEvent,
  type MidiNoteEvent,
  type MidiNoteEventType,
  type MidiRecordedNote,
} from "./engine/midi/events"
import { availableNotes, type MusicalNote } from "./engine/midi/notes"
import { MidiEventLog } from "./features/midi-events/MidiEventLog"
import { RecordedNoteList } from "./features/midi-events/RecordedNoteList"
import { PianoPreview } from "./features/piano/PianoPreview"
import { TimelinePreview } from "./features/timeline/TimelinePreview"

const testChord: MusicalNote[] = ["C4", "E4", "G4"]

function App() {
  const [volume, setVolume] = useState(0.8)
  const [instrumentId, setInstrumentId] =
    useState<MathematicalInstrumentId>("pure-sine")
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [midiEvents, setMidiEvents] = useState<MidiNoteEvent[]>([])
  const [recordedNotes, setRecordedNotes] = useState<MidiRecordedNote[]>([])
  const activeNoteEventsRef = useRef(new Map<MusicalNote, MidiNoteEvent>())
  const playbackHandleRef = useRef<PlaybackHandle | null>(null)
  const startedAtRef = useRef<number | null>(null)

  const selectedInstrument = findMathematicalInstrument(instrumentId)
  const playOptions = createPlayOptions(selectedInstrument)

  function updateVolume(nextVolume: number) {
    setVolume(nextVolume)
    setMasterVolume(nextVolume)
  }

  function playTestNote() {
    playNote(selectedNote, 0.75, playOptions)
  }

  function playTestChord() {
    playNotes(testChord, 1.15, createPlayOptions(selectedInstrument, 0.72))
  }

  function stopPlayback() {
    playbackHandleRef.current?.cancel()
    playbackHandleRef.current = null
    stopAllVoices()
  }

  function playRecording() {
    if (recordedNotes.length === 0) {
      return
    }

    stopPlayback()
    playbackHandleRef.current = playRecordedNotes(recordedNotes, playOptions)
  }

  function clearSession() {
    stopPlayback()
    activeNoteEventsRef.current.clear()
    startedAtRef.current = null
    setMidiEvents([])
    setRecordedNotes([])
  }

  function registerMidiEvent(type: MidiNoteEventType, note: MusicalNote) {
    const now = performance.now()

    startedAtRef.current ??= now

    const eventTime = (now - startedAtRef.current) / 1000
    const midiEvent = createMidiNoteEvent(type, note, eventTime)

    if (type === "note-on") {
      activeNoteEventsRef.current.set(note, midiEvent)
    }

    if (type === "note-off") {
      const noteOnEvent = activeNoteEventsRef.current.get(note)

      if (noteOnEvent) {
        setRecordedNotes((currentNotes) => [
          createMidiRecordedNote(noteOnEvent, midiEvent.time),
          ...currentNotes,
        ])
        activeNoteEventsRef.current.delete(note)
      }
    }

    setMidiEvents((currentEvents) => [midiEvent, ...currentEvents].slice(0, 12))
  }

  return (
    <main>
      <h1>MiMIDI</h1>
      <p>Core musical experimental basado en instrumentos matematicos.</p>

      <section className="audio-lab" aria-label="Core de audio">
        <div className="control-group">
          <label htmlFor="instrument">Instrumento matematico</label>
          <select
            id="instrument"
            value={instrumentId}
            onChange={(event) =>
              setInstrumentId(event.target.value as MathematicalInstrumentId)
            }
          >
            {mathematicalInstruments.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="note">Nota musical</label>
          <select
            id="note"
            value={selectedNote}
            onChange={(event) =>
              setSelectedNote(event.target.value as MusicalNote)
            }
          >
            {availableNotes.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="volume">Volumen maestro</label>
          <input
            id="volume"
            max="1"
            min="0"
            step="0.01"
            type="range"
            value={volume}
            onChange={(event) => updateVolume(Number(event.target.value))}
          />
        </div>

        <PianoPreview
          notes={availableNotes}
          onNoteOff={(note) => registerMidiEvent("note-off", note)}
          onNoteOn={(note) => registerMidiEvent("note-on", note)}
          onSelectNote={setSelectedNote}
          playOptions={playOptions}
          selectedNote={selectedNote}
        />

        <div className="actions">
          <button onClick={playTestNote}>Tocar nota</button>
          <button onClick={playTestChord}>Tocar acorde</button>
          <button onClick={playRecording}>Reproducir grabacion</button>
          <button onClick={stopPlayback}>Detener</button>
          <button onClick={clearSession}>Limpiar</button>
        </div>

        <MidiEventLog events={midiEvents} />
        <RecordedNoteList notes={recordedNotes} />
        <TimelinePreview notes={recordedNotes} />
      </section>
    </main>
  )
}

export default App
