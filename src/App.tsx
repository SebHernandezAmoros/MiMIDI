import type { ChangeEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
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
import {
  createPianoPreviewNotes,
  previewOctaveOptions,
  transposeNote,
  type MusicalNote,
  type Octave,
} from "./engine/midi/notes"
import {
  appendNoteToTrack,
  appendNotesToTrack,
  appendTrack,
  clearAllTrackNotes,
  createDefaultProject,
  duplicateNoteInTrack,
  parseImportedProject,
  type MusicalProject,
  removeTrack,
  removeNoteFromTrack,
  resetProject,
  renameProject,
  renameTrack,
  updateNoteInTrack,
  updateTrackInstrument,
} from "./engine/project/projectModel"
import { loadStoredProject, saveProject } from "./engine/project/projectStorage"
import { LabActions } from "./features/lab/LabActions"
import { LabNoteEditor } from "./features/lab/LabNoteEditor"
import { LabProjectPanel } from "./features/lab/LabProjectPanel"
import { LabSoundControls } from "./features/lab/LabSoundControls"
import { MidiEventLog } from "./features/midi-events/MidiEventLog"
import { RecordedNoteList } from "./features/midi-events/RecordedNoteList"
import {
  PianoPreview,
  type PianoInteractionMode,
} from "./features/piano/PianoPreview"
import { TimelinePreview } from "./features/timeline/TimelinePreview"
import { useProjectHistory } from "./features/history/useProjectHistory"
import { usePlaybackTransport } from "./features/transport/usePlaybackTransport"

const HISTORY_LIMIT = 20

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

function areProjectsEquivalent(
  firstProject: MusicalProject,
  secondProject: MusicalProject,
) {
  return JSON.stringify(firstProject) === JSON.stringify(secondProject)
}

function App() {
  const [volume, setVolume] = useState(0.8)
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("major")
  const [pianoMode, setPianoMode] = useState<PianoInteractionMode>("note")
  const [previewOctave, setPreviewOctave] = useState<Octave>(4)
  const [timelineSnapEnabled, setTimelineSnapEnabled] = useState(false)
  const [timelineSnapStep, setTimelineSnapStep] = useState(0.1)
  const [isTimelineDragging, setIsTimelineDragging] = useState(false)
  const [activeTrackId, setActiveTrackId] = useState(getInitialActiveTrackId)
  const [projectMessage, setProjectMessage] = useState(getInitialProjectMessage)
  const [selectedRecordedNoteId, setSelectedRecordedNoteId] = useState<string | null>(
    null,
  )
  const [midiEvents, setMidiEvents] = useState<MidiNoteEvent[]>([])
  const {
    state: project,
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    applyUpdate,
    applyTransientUpdate,
    commitTransientUpdate,
    undo,
    redo,
    replaceState,
  } = useProjectHistory<MusicalProject>(getInitialProject(), {
    isEqual: areProjectsEquivalent,
    limit: HISTORY_LIMIT,
  })
  const activeNoteEventsRef = useRef(new Map<MusicalNote, ActiveNoteCapture>())
  const undoActionRef = useRef<() => void>(() => {})
  const redoActionRef = useRef<() => void>(() => {})
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const playbackTransport = usePlaybackTransport()

  const primaryTrack =
    project.tracks.find((track) => track.id === activeTrackId) ?? project.tracks[0]
  const selectedInstrument = findMathematicalInstrument(primaryTrack.instrumentId)
  const visibleNotes = useMemo(() => createPianoPreviewNotes(previewOctave), [previewOctave])
  const allRecordedNotes = project.tracks.flatMap((track) => track.notes)
  const playOptions = createPlayOptions(selectedInstrument)
  const noteCount = primaryTrack.notes.length
  const selectedRecordedNote =
    primaryTrack.notes.find((note) => note.id === selectedRecordedNoteId) ?? null
  const selectedNoteHistoryStatus = useMemo(() => {
    if (!selectedRecordedNoteId || !selectedRecordedNote) {
      return null
    }

    const latestSnapshot = undoStack.at(-1)

    if (!latestSnapshot) {
      return "sin-cambios"
    }

    const snapshotTrack = latestSnapshot.tracks.find((track) => track.id === primaryTrack.id)
    const snapshotNote = snapshotTrack?.notes.find((note) => note.id === selectedRecordedNoteId)

    if (!snapshotNote) {
      return "modificada"
    }

    return snapshotNote.startTime === selectedRecordedNote.startTime &&
      snapshotNote.duration === selectedRecordedNote.duration
      ? "sin-cambios"
      : "modificada"
  }, [primaryTrack.id, selectedRecordedNote, selectedRecordedNoteId, undoStack])
  const shortcutHint = useMemo(() => {
    const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac")
    const mod = isMac ? "Cmd" : "Ctrl"

    return `${mod}+Z / ${mod}+Y`
  }, [])

  useEffect(() => {
    saveProject(project)
  }, [project])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return
      }

      if (event.key.toLowerCase() === "y") {
        event.preventDefault()
        redoActionRef.current()
        return
      }

      if (event.key.toLowerCase() === "z") {
        event.preventDefault()
        undoActionRef.current()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  function updateVolume(nextVolume: number) {
    setVolume(nextVolume)
    setMasterVolume(nextVolume)
  }

  function updatePreviewOctave(nextOctave: Octave) {
    const nextVisibleNotes = createPianoPreviewNotes(nextOctave)

    setPreviewOctave(nextOctave)

    if (!nextVisibleNotes.includes(selectedNote)) {
      const fallbackNote = `A${nextOctave}` as MusicalNote

      setSelectedNote(
        nextVisibleNotes.includes(fallbackNote) ? fallbackNote : nextVisibleNotes[0],
      )
    }
  }

  function getCurrentRecordTime() {
    const now = performance.now()

    startedAtRef.current ??= now

    return (now - startedAtRef.current) / 1000
  }

  function recordNotesToActiveTrack(notes: MusicalNote[], duration: number) {
    const startTime = getCurrentRecordTime()

    applyUpdate((currentProject) =>
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
    applyUpdate((currentProject) => {
      const nextProject = appendTrack(currentProject)
      const nextTrack = nextProject.tracks.at(-1)

      if (nextTrack) {
        setActiveTrackId(nextTrack.id)
        setProjectMessage(`Pista agregada: ${nextTrack.name}.`)
      }

      return nextProject
    })
  }

  function switchActiveTrack(trackId: string) {
    setActiveTrackId(trackId)
    setSelectedRecordedNoteId(null)
  }

  function removeActiveTrack() {
    if (project.tracks.length <= 1) {
      setProjectMessage("Debe existir al menos una pista.")
      return
    }

    const currentIndex = project.tracks.findIndex((track) => track.id === primaryTrack.id)
    const fallbackTrackId =
      project.tracks[currentIndex - 1]?.id ?? project.tracks[currentIndex + 1]?.id

    applyUpdate((currentProject) => removeTrack(currentProject, primaryTrack.id))
    setActiveTrackId(fallbackTrackId ?? "track-1")
    setSelectedRecordedNoteId(null)
    setProjectMessage(`Pista eliminada: ${primaryTrack.name}.`)
  }

  function updateProjectName(name: string) {
    applyUpdate((currentProject) =>
      renameProject(currentProject, name.trim() || "MiMIDI Project"),
    )
  }

  function updateTrackName(name: string) {
    applyUpdate((currentProject) =>
      renameTrack(currentProject, primaryTrack.id, name.trim() || "Track 1"),
    )
  }

  function updateTrackInstrumentId(instrumentId: MathematicalInstrumentId) {
    applyUpdate((currentProject) =>
      updateTrackInstrument(currentProject, primaryTrack.id, instrumentId),
    )
  }

  function removeRecordedNote(noteId: string) {
    applyUpdate((currentProject) =>
      removeNoteFromTrack(currentProject, primaryTrack.id, noteId),
    )
    if (selectedRecordedNoteId === noteId) {
      setSelectedRecordedNoteId(null)
    }
    setProjectMessage(`Nota eliminada de ${primaryTrack.name}.`)
  }

  function updateRecordedNote(
    noteId: string,
    patch: Partial<{ startTime: number; duration: number }>,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const quantize = (value: number) =>
      timelineSnapEnabled ? Math.round(value / timelineSnapStep) * timelineSnapStep : value
    const safePatch: Partial<{ startTime: number; duration: number }> = {}

    if (typeof patch.startTime === "number") {
      safePatch.startTime = Math.max(0, quantize(patch.startTime))
    }

    if (typeof patch.duration === "number") {
      safePatch.duration = Math.max(0.01, quantize(patch.duration))
    }

    if (historyMode === "transient") {
      applyTransientUpdate((currentProject) =>
        updateNoteInTrack(currentProject, primaryTrack.id, noteId, safePatch),
      )
      return
    }

    commitTransientUpdate((currentProject) =>
      updateNoteInTrack(currentProject, primaryTrack.id, noteId, safePatch),
    )
  }

  function duplicateSelectedRecordedNote() {
    if (!selectedRecordedNote) {
      return
    }

    applyUpdate((currentProject) =>
      duplicateNoteInTrack(
        currentProject,
        primaryTrack.id,
        selectedRecordedNote.id,
        timelineSnapEnabled ? timelineSnapStep : 0.05,
      ),
    )
    setProjectMessage(`Nota duplicada en ${primaryTrack.name}.`)
  }

  function undoProjectEdit() {
    const previousProject = undo()

    if (!previousProject) {
      setProjectMessage("No hay cambios anteriores para deshacer.")
      return
    }

    setSelectedRecordedNoteId(null)
    setActiveTrackId(
      previousProject.tracks.find((track) => track.id === activeTrackId)?.id ??
        previousProject.tracks[0]?.id ??
        "track-1",
    )
    setProjectMessage("Deshacer aplicado.")
  }

  function redoProjectEdit() {
    const nextProject = redo()

    if (!nextProject) {
      setProjectMessage("No hay cambios posteriores para rehacer.")
      return
    }

    setSelectedRecordedNoteId(null)
    setActiveTrackId(
      nextProject.tracks.find((track) => track.id === activeTrackId)?.id ??
        nextProject.tracks[0]?.id ??
        "track-1",
    )
    setProjectMessage("Rehacer aplicado.")
  }

  useEffect(() => {
    undoActionRef.current = undoProjectEdit
    redoActionRef.current = redoProjectEdit
  })

  function revertSelectedNoteToLastCommit() {
    if (!selectedRecordedNoteId) {
      return
    }

    const candidateIndex = [...undoStack]
      .map((snapshot) => ({ snapshot }))
      .reverse()
      .find(({ snapshot }) => {
        const snapshotTrack = snapshot.tracks.find((track) => track.id === primaryTrack.id)
        const snapshotNote = snapshotTrack?.notes.find(
          (note) => note.id === selectedRecordedNoteId,
        )

        return (
          snapshotNote &&
          selectedRecordedNote &&
          (snapshotNote.startTime !== selectedRecordedNote.startTime ||
            snapshotNote.duration !== selectedRecordedNote.duration)
        )
      })

    if (!candidateIndex) {
      setProjectMessage("No hay un commit anterior para esta nota.")
      return
    }

    const snapshotTrack = candidateIndex.snapshot.tracks.find(
      (track) => track.id === primaryTrack.id,
    )
    const snapshotNote = snapshotTrack?.notes.find(
      (note) => note.id === selectedRecordedNoteId,
    )

    if (!snapshotNote) {
      setProjectMessage("No se encontro version anterior para esta nota.")
      return
    }

    applyUpdate((currentProject) =>
      updateNoteInTrack(currentProject, primaryTrack.id, selectedRecordedNoteId, {
        startTime: snapshotNote.startTime,
        duration: snapshotNote.duration,
      }),
    )
    setProjectMessage(`Nota revertida en ${primaryTrack.name}.`)
  }

  function updateSelectedNoteStartTime(value: number) {
    if (!selectedRecordedNote) {
      return
    }

    updateRecordedNote(selectedRecordedNote.id, {
      startTime: Number.isFinite(value) ? value : 0,
    })
  }

  function updateSelectedNoteDuration(value: number) {
    if (!selectedRecordedNote) {
      return
    }

    updateRecordedNote(selectedRecordedNote.id, {
      duration: Number.isFinite(value) ? value : 0.01,
    })
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
      replaceState(importedProject)
      setActiveTrackId(importedProject.tracks[0]?.id ?? "track-1")
      setSelectedRecordedNoteId(null)
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
    applyUpdate((currentProject) => clearAllTrackNotes(currentProject))
    setSelectedRecordedNoteId(null)
    setProjectMessage("Notas limpiadas. Pistas y nombre conservados.")
  }

  function restartProject() {
    playbackTransport.stop()
    activeNoteEventsRef.current.clear()
    startedAtRef.current = null
    setMidiEvents([])
    applyUpdate((currentProject) => resetProject(currentProject))
    setActiveTrackId("track-1")
    setSelectedRecordedNoteId(null)
    setProjectMessage("Proyecto reiniciado desde cero.")
  }

  function selectRecordedNote(noteId: string) {
    setSelectedRecordedNoteId(noteId)
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
        applyUpdate((currentProject) =>
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

        <LabProjectPanel
          instrumentOptions={mathematicalInstruments}
          noteCount={noteCount}
          onAddTrack={addTrack}
          onProjectNameChange={updateProjectName}
          onRemoveActiveTrack={removeActiveTrack}
          onSwitchActiveTrack={switchActiveTrack}
          onTrackInstrumentChange={updateTrackInstrumentId}
          onTrackNameChange={updateTrackName}
          primaryTrackId={primaryTrack.id}
          primaryTrackInstrumentId={primaryTrack.instrumentId}
          primaryTrackName={primaryTrack.name}
          projectMessage={projectMessage}
          projectName={project.name}
          trackCount={project.tracks.length}
          tracks={project.tracks}
        />

        <LabSoundControls
          availableNotes={visibleNotes}
          onChordTypeChange={setSelectedChordType}
          onNoteChange={setSelectedNote}
          onPreviewOctaveChange={updatePreviewOctave}
          onPianoModeChange={setPianoMode}
          onVolumeChange={updateVolume}
          pianoMode={pianoMode}
          previewOctave={previewOctave}
          previewOctaveOptions={previewOctaveOptions}
          selectedChordType={selectedChordType}
          selectedNote={selectedNote}
          volume={volume}
        />

        <PianoPreview
          getPlayableNotes={getPianoPlayableNotes}
          interactionMode={pianoMode}
          notes={visibleNotes}
          onNoteOff={(note) => registerMidiEvent("note-off", note)}
          onNoteOn={(note) => registerMidiEvent("note-on", note)}
          onSelectNote={setSelectedNote}
          playOptions={playOptions}
          selectedNote={selectedNote}
        />

        <LabActions
          canPlayRecording={allRecordedNotes.length > 0}
          isPlaying={playbackTransport.isPlaying}
          onClearSession={clearSession}
          onExportProject={exportProject}
          onImportProject={openImportDialog}
          onPlayRecording={playRecording}
          onPlayTestChord={playTestChord}
          onPlayTestNote={playTestNote}
          onRestartProject={restartProject}
          onStopPlayback={playbackTransport.stop}
        />

        <MidiEventLog events={midiEvents} />
        <RecordedNoteList
          notes={primaryTrack.notes}
          onRemoveNote={removeRecordedNote}
          onSelectNote={selectRecordedNote}
          selectedNoteId={selectedRecordedNoteId}
        />
        <LabNoteEditor
          canRedo={canRedo}
          canUndo={canUndo}
          historyLimit={HISTORY_LIMIT}
          isTimelineDragging={isTimelineDragging}
          onDuplicateSelectedNote={duplicateSelectedRecordedNote}
          onRedo={redoProjectEdit}
          onRevertSelectedNote={revertSelectedNoteToLastCommit}
          onSelectedNoteDurationChange={updateSelectedNoteDuration}
          onSelectedNoteStartTimeChange={updateSelectedNoteStartTime}
          onTimelineSnapStepChange={setTimelineSnapStep}
          onToggleTimelineSnap={setTimelineSnapEnabled}
          onUndo={undoProjectEdit}
          redoCount={redoStack.length}
          selectedNoteHistoryStatus={selectedNoteHistoryStatus}
          selectedRecordedNote={selectedRecordedNote}
          shortcutHint={shortcutHint}
          timelineSnapEnabled={timelineSnapEnabled}
          timelineSnapStep={timelineSnapStep}
          undoCount={undoStack.length}
        />
        <TimelinePreview
          notes={primaryTrack.notes}
          onRemoveSelectedNote={removeRecordedNote}
          onDragStateChange={setIsTimelineDragging}
          onSelectNote={selectRecordedNote}
          onUpdateNote={updateRecordedNote}
          selectedNoteId={selectedRecordedNoteId}
        />
      </section>
    </main>
  )
}

export default App
