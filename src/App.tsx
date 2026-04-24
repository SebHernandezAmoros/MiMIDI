import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"
import "./App.css"
import { playNote, playNotes } from "./application/use-cases/playNote"
import { setMasterVolume } from "./engine/audio/audioEngine"
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
} from "./engine/midi/events"
import { availableNotes, type MusicalNote } from "./engine/midi/notes"
import {
  appendNoteToTrack,
  clearTrackNotes,
  createDefaultProject,
  parseImportedProject,
} from "./engine/project/projectModel"
import { loadStoredProject, saveProject } from "./engine/project/projectStorage"
import { MidiEventLog } from "./features/midi-events/MidiEventLog"
import { RecordedNoteList } from "./features/midi-events/RecordedNoteList"
import { PianoPreview } from "./features/piano/PianoPreview"
import { TimelinePreview } from "./features/timeline/TimelinePreview"
import { usePlaybackTransport } from "./features/transport/usePlaybackTransport"

const testChord: MusicalNote[] = ["C4", "E4", "G4"]

function getInitialProject() {
  return loadStoredProject() ?? createDefaultProject()
}

function getInitialProjectMessage() {
  const storedProject = loadStoredProject()

  if (!storedProject) {
    return ""
  }

  return storedProject.tracks.some((track) => track.notes.length > 0)
    ? `Proyecto restaurado: ${storedProject.name}.`
    : ""
}

function App() {
  const [volume, setVolume] = useState(0.8)
  const [instrumentId, setInstrumentId] =
    useState<MathematicalInstrumentId>("pure-sine")
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [projectMessage, setProjectMessage] = useState(getInitialProjectMessage)
  const [midiEvents, setMidiEvents] = useState<MidiNoteEvent[]>([])
  const [project, setProject] = useState(getInitialProject)
  const activeNoteEventsRef = useRef(new Map<MusicalNote, MidiNoteEvent>())
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const playbackTransport = usePlaybackTransport()

  const selectedInstrument = findMathematicalInstrument(instrumentId)
  const primaryTrack = project.tracks[0]
  const playOptions = createPlayOptions(selectedInstrument)
  const noteCount = primaryTrack.notes.length

  useEffect(() => {
    saveProject(project)
  }, [project])

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

  function playRecording() {
    playbackTransport.play(primaryTrack.notes, playOptions)
  }

  function exportProject() {
    const projectJson = JSON.stringify(project, null, 2)
    const blob = new Blob([projectJson], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`
    link.click()
    window.URL.revokeObjectURL(url)
    setProjectMessage("Proyecto exportado a JSON.")
  }

  function openImportDialog() {
    importInputRef.current?.click()
  }

  async function importProjectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const projectJson = await file.text()
      const importedProject = parseImportedProject(projectJson)

      playbackTransport.stop()
      activeNoteEventsRef.current.clear()
      startedAtRef.current = null
      setMidiEvents([])
      setProject(importedProject)
      setProjectMessage(`Proyecto importado: ${importedProject.name}.`)
    } catch {
      setProjectMessage("No se pudo importar el JSON del proyecto.")
    } finally {
      event.target.value = ""
    }
  }

  function clearSession() {
    playbackTransport.stop()
    activeNoteEventsRef.current.clear()
    startedAtRef.current = null
    setMidiEvents([])
    setProject((currentProject) => clearTrackNotes(currentProject, primaryTrack.id))
    setProjectMessage("Sesion limpiada.")
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
        setProject((currentProject) =>
          appendNoteToTrack(
            currentProject,
            primaryTrack.id,
            createMidiRecordedNote(noteOnEvent, midiEvent.time),
          ),
        )
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
        <input
          accept=".json,application/json"
          hidden
          onChange={importProjectFile}
          ref={importInputRef}
          type="file"
        />

        <div className="project-summary" aria-label="Proyecto actual">
          <div>
            <span className="project-label">Proyecto</span>
            <strong>{project.name}</strong>
          </div>
          <div>
            <span className="project-label">Pista</span>
            <strong>{primaryTrack.name}</strong>
          </div>
          <div>
            <span className="project-label">Notas</span>
            <strong>{noteCount}</strong>
          </div>
        </div>

        {projectMessage ? <p className="project-message">{projectMessage}</p> : null}

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
          <button
            disabled={primaryTrack.notes.length === 0 || playbackTransport.isPlaying}
            onClick={playRecording}
          >
            {playbackTransport.isPlaying
              ? "Reproduciendo"
              : "Reproducir grabacion"}
          </button>
          <button onClick={playbackTransport.stop}>Detener</button>
          <button onClick={clearSession}>Limpiar</button>
          <button onClick={openImportDialog}>Importar JSON</button>
          <button onClick={exportProject}>Exportar JSON</button>
        </div>

        <MidiEventLog events={midiEvents} />
        <RecordedNoteList notes={primaryTrack.notes} />
        <TimelinePreview notes={primaryTrack.notes} />
      </section>
    </main>
  )
}

export default App
