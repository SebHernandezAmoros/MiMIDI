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
import { availableNotes, transposeNote, type MusicalNote } from "./engine/midi/notes"
import {
  appendNoteToTrack,
  appendNotesToTrack,
  appendTrack,
  clearAllTrackNotes,
  createDefaultProject,
  parseImportedProject,
  removeNoteFromTrack,
  renameProject,
  renameTrack,
  updateTrackInstrument,
} from "./engine/project/projectModel"
import { loadStoredProject, saveProject } from "./engine/project/projectStorage"
import { MidiEventLog } from "./features/midi-events/MidiEventLog"
import { RecordedNoteList } from "./features/midi-events/RecordedNoteList"
import {
  PianoPreview,
  type PianoInteractionMode,
} from "./features/piano/PianoPreview"
import { TimelinePreview } from "./features/timeline/TimelinePreview"
import { usePlaybackTransport } from "./features/transport/usePlaybackTransport"

const chordIntervals = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  power: [0, 7, 12],
} as const

type ChordType = keyof typeof chordIntervals
type ActiveNoteCapture = {
  event: MidiNoteEvent
  instrumentId: MathematicalInstrumentId
  trackId: string
}

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

function getInitialActiveTrackId() {
  return getInitialProject().tracks[0]?.id ?? "track-1"
}

function App() {
  const [volume, setVolume] = useState(0.8)
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("major")
  const [pianoMode, setPianoMode] = useState<PianoInteractionMode>("note")
  const [activeTrackId, setActiveTrackId] = useState(getInitialActiveTrackId)
  const [projectMessage, setProjectMessage] = useState(getInitialProjectMessage)
  const [midiEvents, setMidiEvents] = useState<MidiNoteEvent[]>([])
  const [project, setProject] = useState(getInitialProject)
  const activeNoteEventsRef = useRef(new Map<MusicalNote, ActiveNoteCapture>())
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const playbackTransport = usePlaybackTransport()

  const primaryTrack =
    project.tracks.find((track) => track.id === activeTrackId) ?? project.tracks[0]
  const selectedInstrument = findMathematicalInstrument(primaryTrack.instrumentId)
  const allRecordedNotes = project.tracks.flatMap((track) => track.notes)
  const playOptions = createPlayOptions(selectedInstrument)
  const noteCount = primaryTrack.notes.length

  useEffect(() => {
    saveProject(project)
  }, [project])

  function updateVolume(nextVolume: number) {
    setVolume(nextVolume)
    setMasterVolume(nextVolume)
  }

  function getCurrentRecordTime() {
    const now = performance.now()

    startedAtRef.current ??= now

    return (now - startedAtRef.current) / 1000
  }

  function recordNotesToActiveTrack(notes: MusicalNote[], duration: number) {
    const startTime = getCurrentRecordTime()

    setProject((currentProject) =>
      appendNotesToTrack(
        currentProject,
        primaryTrack.id,
        notes.map((note) =>
          createMidiRecordedNote(
            createMidiNoteEvent("note-on", note, startTime, 1),
            startTime + duration,
            primaryTrack.instrumentId,
          ),
        ),
      ),
    )
  }

  function playTestNote() {
    playNote(selectedNote, 0.75, playOptions)
    recordNotesToActiveTrack([selectedNote], 0.75)
  }

  function buildChordNotes(rootNote: MusicalNote) {
    return chordIntervals[selectedChordType].map((interval) =>
      transposeNote(rootNote, interval),
    )
  }

  function getPianoPlayableNotes(rootNote: MusicalNote) {
    return pianoMode === "chord" ? buildChordNotes(rootNote) : [rootNote]
  }

  function playTestChord() {
    const chordNotes = buildChordNotes(selectedNote)

    playNotes(chordNotes, 1.15, createPlayOptions(selectedInstrument, 0.72))
    recordNotesToActiveTrack(chordNotes, 1.15)
    setProjectMessage(`Acorde ${selectedChordType} grabado en ${primaryTrack.name}.`)
  }

  function playRecording() {
    playbackTransport.play(allRecordedNotes, playOptions)
  }

  function addTrack() {
    setProject((currentProject) => {
      const nextProject = appendTrack(currentProject)
      const nextTrack = nextProject.tracks.at(-1)

      if (nextTrack) {
        setActiveTrackId(nextTrack.id)
        setProjectMessage(`Pista agregada: ${nextTrack.name}.`)
      }

      return nextProject
    })
  }

  function updateProjectName(name: string) {
    setProject((currentProject) =>
      renameProject(currentProject, name.trim() || "MiMIDI Project"),
    )
  }

  function updateTrackName(name: string) {
    setProject((currentProject) =>
      renameTrack(currentProject, primaryTrack.id, name.trim() || "Track 1"),
    )
  }

  function updateTrackInstrumentId(instrumentId: MathematicalInstrumentId) {
    setProject((currentProject) =>
      updateTrackInstrument(currentProject, primaryTrack.id, instrumentId),
    )
  }

  function removeRecordedNote(noteId: string) {
    setProject((currentProject) =>
      removeNoteFromTrack(currentProject, primaryTrack.id, noteId),
    )
    setProjectMessage(`Nota eliminada de ${primaryTrack.name}.`)
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
      setActiveTrackId(importedProject.tracks[0]?.id ?? "track-1")
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
    setProject((currentProject) => clearAllTrackNotes(currentProject))
    setProjectMessage("Sesion limpiada.")
  }

  function registerMidiEvent(type: MidiNoteEventType, note: MusicalNote) {
    const eventTime = getCurrentRecordTime()
    const midiEvent = createMidiNoteEvent(type, note, eventTime)

    if (type === "note-on") {
      activeNoteEventsRef.current.set(note, {
        event: midiEvent,
        instrumentId: primaryTrack.instrumentId,
        trackId: primaryTrack.id,
      })
    }

    if (type === "note-off") {
      const activeNoteCapture = activeNoteEventsRef.current.get(note)

      if (activeNoteCapture) {
        setProject((currentProject) =>
          appendNoteToTrack(
            currentProject,
            activeNoteCapture.trackId,
            createMidiRecordedNote(
              activeNoteCapture.event,
              midiEvent.time,
              activeNoteCapture.instrumentId,
            ),
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
          <div>
            <span className="project-label">Pistas</span>
            <strong>{project.tracks.length}</strong>
          </div>
        </div>

        {projectMessage ? <p className="project-message">{projectMessage}</p> : null}

        <div className="project-editors">
          <div className="control-group">
            <label htmlFor="project-name">Nombre del proyecto</label>
            <input
              id="project-name"
              type="text"
              value={project.name}
              onChange={(event) => updateProjectName(event.target.value)}
            />
          </div>

          <div className="control-group">
            <label htmlFor="track-name">Nombre de la pista</label>
            <input
              id="track-name"
              type="text"
              value={primaryTrack.name}
              onChange={(event) => updateTrackName(event.target.value)}
            />
          </div>
        </div>

        <div className="track-controls">
          <div className="control-group">
            <label htmlFor="active-track">Pista activa</label>
            <select
              id="active-track"
              value={primaryTrack.id}
              onChange={(event) => setActiveTrackId(event.target.value)}
            >
              {project.tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={addTrack}>Nueva pista</button>
        </div>

        <div className="control-group">
          <label htmlFor="instrument">Instrumento matematico</label>
          <select
            id="instrument"
            value={primaryTrack.instrumentId}
            onChange={(event) =>
              updateTrackInstrumentId(event.target.value as MathematicalInstrumentId)
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
          <label>Modo del piano</label>
          <div className="mode-switch" aria-label="Modo del piano">
            <button
              className={pianoMode === "note" ? "mode-switch-active" : ""}
              onClick={() => setPianoMode("note")}
              type="button"
            >
              Nota
            </button>
            <button
              className={pianoMode === "chord" ? "mode-switch-active" : ""}
              onClick={() => setPianoMode("chord")}
              type="button"
            >
              Acorde
            </button>
          </div>
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
          <label htmlFor="chord-type">Tipo de acorde</label>
          <select
            id="chord-type"
            value={selectedChordType}
            onChange={(event) => setSelectedChordType(event.target.value as ChordType)}
          >
            <option value="major">Mayor</option>
            <option value="minor">Menor</option>
            <option value="power">Power</option>
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
          getPlayableNotes={getPianoPlayableNotes}
          interactionMode={pianoMode}
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
            disabled={allRecordedNotes.length === 0 || playbackTransport.isPlaying}
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
        <RecordedNoteList notes={primaryTrack.notes} onRemoveNote={removeRecordedNote} />
        <TimelinePreview notes={primaryTrack.notes} />
      </section>
    </main>
  )
}

export default App
