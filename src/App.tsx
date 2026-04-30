import type { ChangeEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import "./App.css"
import { exportProjectAudio as exportProjectAudioUseCase } from "./application/use-cases/exportProjectAudio"
import { playNote, playNotes } from "./application/use-cases/playNote"
import { setMasterVolume, type ADSREnvelope } from "./engine/audio/audioEngine"
import {
  createPlayOptions,
  findMathematicalInstrument,
  getInstrumentCategoryDescription,
  getInstrumentCategoryLabel,
  mathematicalInstruments,
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "./engine/audio/mathematicalInstruments"
import {
  createMidiRecordedNote,
  createMidiNoteEvent,
  isSmcPadRecordedNote,
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
  getTrackVolumeAutomationValue,
  isTrackAudible,
  parseImportedProject,
  type MusicalProject,
  removeTrack,
  removeNoteFromTrack,
  resetProject,
  renameProject,
  renameTrack,
  updateNoteInTrack,
  updateTrackEnvelope,
  updateTrackInstrument,
  updateTrackMuted,
  updateTrackPan,
  updateTrackSolo,
  updateTrackVolumeAutomation,
  updateTrackVolume,
  type TrackVolumeAutomation,
} from "./engine/project/projectModel"
import { loadStoredProject, saveProject } from "./engine/project/projectStorage"
import { LabActions } from "./features/lab/LabActions"
import { LabNoteEditor } from "./features/lab/LabNoteEditor"
import { LabProjectPanel } from "./features/lab/LabProjectPanel"
import { LabSoundControls } from "./features/lab/LabSoundControls"
import {
  getSmcPadSoundDescriptor,
  playSmcPadHit,
  type SmcPadSoundId,
} from "./application/use-cases/playSmcPadHit"
import { MidiEventLog } from "./features/midi-events/MidiEventLog"
import { RecordedNoteList } from "./features/midi-events/RecordedNoteList"
import {
  PianoPreview,
  type PianoInteractionMode,
} from "./features/piano/PianoPreview"
import { MiniSmcPad } from "./features/smc-pad/MiniSmcPad"
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
  envelope: ADSREnvelope
  event: MidiNoteEvent
  instrumentId: MathematicalInstrumentId
  pan: number
  trackId: string
  volume: number
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

function getPerformanceTimestamp() {
  return performance.now()
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
  const [isExportingAudio, setIsExportingAudio] = useState(false)
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
  const activeInstrumentCategory = selectedInstrument.category
  const instrumentCategories = useMemo(
    () =>
      [...new Set(mathematicalInstruments.map((instrument) => instrument.category))].sort(
        (firstCategory, secondCategory) => {
          if (firstCategory === secondCategory) {
            return 0
          }

          return firstCategory === "base" ? -1 : 1
        },
      ),
    [],
  )
  const visibleInstruments = mathematicalInstruments.filter(
    (instrument) => instrument.category === activeInstrumentCategory,
  )
  const visibleNotes = useMemo(() => createPianoPreviewNotes(previewOctave), [previewOctave])
  const allRecordedNotes = project.tracks.flatMap((track) => track.notes)
  const noteCount = primaryTrack.notes.length
  const isPrimaryTrackAudible = isTrackAudible(primaryTrack, project.tracks)
  const selectedRecordedNote =
    primaryTrack.notes.find((note) => note.id === selectedRecordedNoteId) ?? null
  let selectedNoteHistoryStatus: "modificada" | "sin-cambios" | null = null

  if (selectedRecordedNoteId && selectedRecordedNote) {
    const latestSnapshot = undoStack.at(-1)

    if (!latestSnapshot) {
      selectedNoteHistoryStatus = "sin-cambios"
    } else {
      const snapshotTrack = latestSnapshot.tracks.find((track) => track.id === primaryTrack.id)
      const snapshotNote = snapshotTrack?.notes.find(
        (note) => note.id === selectedRecordedNoteId,
      )

      selectedNoteHistoryStatus =
        !snapshotNote ||
        snapshotNote.startTime !== selectedRecordedNote.startTime ||
        snapshotNote.duration !== selectedRecordedNote.duration
          ? "modificada"
          : "sin-cambios"
    }
  }
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
    const now = getPerformanceTimestamp()

    startedAtRef.current ??= now

    return (now - startedAtRef.current) / 1000
  }

  function getTrackAutomationVolumeAtTime(time: number) {
    return getTrackVolumeAutomationValue(primaryTrack.volumeAutomation, time)
  }

  function getTrackLivePlaybackState(time: number) {
    return {
      pan: primaryTrack.pan,
      volume: primaryTrack.volume * getTrackAutomationVolumeAtTime(time),
    }
  }

  function getTrackPreviewPlayOptions(time: number) {
    const livePlaybackState = getTrackLivePlaybackState(time)

    return {
      ...createPlayOptions(
        selectedInstrument,
        isPrimaryTrackAudible ? livePlaybackState.volume : 0,
        primaryTrack.envelope,
      ),
      pan: livePlaybackState.pan,
    }
  }

  const basePreviewPlayOptions = {
    ...createPlayOptions(
      selectedInstrument,
      isPrimaryTrackAudible ? primaryTrack.volume : 0,
      primaryTrack.envelope,
    ),
    pan: primaryTrack.pan,
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
            {
              playbackEnvelope: primaryTrack.envelope,
              playbackPan: primaryTrack.pan,
              playbackTrackId: primaryTrack.id,
              playbackVolume: primaryTrack.volume,
            },
          ),
        ),
      ),
    )
  }

  function playTestNote() {
    playNote(selectedNote, 0.75, getTrackPreviewPlayOptions(getCurrentRecordTime()))
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
    const previewPlayOptions = getTrackPreviewPlayOptions(getCurrentRecordTime())

    playNotes(chordNotes, 1.15, {
      ...previewPlayOptions,
      volume: (previewPlayOptions.volume ?? 0) * 0.72,
    })
    recordNotesToActiveTrack(chordNotes, 1.15)
    setProjectMessage(`Acorde ${selectedChordType} grabado en ${primaryTrack.name}.`)
  }

  function playRecording() {
    playbackTransport.play(allRecordedNotes, {
      tracks: project.tracks,
    })
  }

  function triggerSmcPad(soundId: SmcPadSoundId) {
    const sound = getSmcPadSoundDescriptor(soundId)
    const startTime = getCurrentRecordTime()
    const livePlaybackState = getTrackLivePlaybackState(startTime)

    playSmcPadHit(
      soundId,
      isPrimaryTrackAudible ? livePlaybackState.volume : 0,
      livePlaybackState.pan,
    )

    applyUpdate((currentProject) =>
      appendNoteToTrack(
        currentProject,
        primaryTrack.id,
        createMidiRecordedNote(
          createMidiNoteEvent("note-on", sound.note, startTime, 1),
          startTime + sound.duration,
          primaryTrack.instrumentId,
          {
            playbackEnvelope: primaryTrack.envelope,
            playbackPan: primaryTrack.pan,
            playbackVolume: primaryTrack.volume,
            playbackSource: "smc-pad",
            playbackTrackId: primaryTrack.id,
            smcPadSoundId: sound.id,
          },
        ),
      ),
    )
    setProjectMessage(`${sound.label} grabado en ${primaryTrack.name}.`)
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

  function updateTrackInstrumentCategory(category: MathematicalInstrument["category"]) {
    const nextInstrument = mathematicalInstruments.find(
      (instrument) => instrument.category === category,
    )

    if (!nextInstrument) {
      return
    }

    updateTrackInstrumentId(nextInstrument.id)
  }

  function updatePrimaryTrackEnvelope(parameter: keyof ADSREnvelope, value: number) {
    if (!Number.isFinite(value)) {
      return
    }

    const nextValue =
      parameter === "sustain"
        ? Math.min(Math.max(value, 0), 1)
        : Math.min(Math.max(value, 0.001), 2)

    applyUpdate((currentProject) =>
      updateTrackEnvelope(currentProject, primaryTrack.id, {
        [parameter]: nextValue,
      }),
    )
  }

  function updatePrimaryTrackVolume(value: number) {
    if (!Number.isFinite(value)) {
      return
    }

    const nextVolume = Math.min(Math.max(value, 0), 1.5)

    applyUpdate((currentProject) =>
      updateTrackVolume(currentProject, primaryTrack.id, nextVolume),
    )
  }

  function updatePrimaryTrackPan(value: number) {
    if (!Number.isFinite(value)) {
      return
    }

    applyUpdate((currentProject) =>
      updateTrackPan(currentProject, primaryTrack.id, value),
    )
  }

  function togglePrimaryTrackMuted() {
    applyUpdate((currentProject) =>
      updateTrackMuted(currentProject, primaryTrack.id, !primaryTrack.muted),
    )
  }

  function togglePrimaryTrackSolo() {
    applyUpdate((currentProject) =>
      updateTrackSolo(currentProject, primaryTrack.id, !primaryTrack.solo),
    )
  }

  function updatePrimaryTrackVolumeAutomation(automation: TrackVolumeAutomation) {
    applyUpdate((currentProject) =>
      updateTrackVolumeAutomation(currentProject, primaryTrack.id, automation),
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
    const noteToUpdate = primaryTrack.notes.find((note) => note.id === noteId)

    if (!noteToUpdate) {
      return
    }

    if (typeof patch.duration === "number" && isSmcPadRecordedNote(noteToUpdate)) {
      if (historyMode === "commit") {
        setProjectMessage("Los golpes SMC Pad se pueden mover, pero no redimensionar.")
      }
      return
    }

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

    if (isSmcPadRecordedNote(selectedRecordedNote)) {
      setProjectMessage("Los golpes SMC Pad se pueden mover, pero no redimensionar.")
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

  async function exportProjectAudio() {
    if (allRecordedNotes.length === 0 || isExportingAudio) {
      return
    }

    if (typeof OfflineAudioContext === "undefined") {
      setProjectMessage("Este navegador no soporta exportacion offline de audio.")
      return
    }

    setIsExportingAudio(true)

    try {
      const { blob, duration, fileName } = await exportProjectAudioUseCase(project, {
        bitDepth: 32,
        float: true,
        masterVolume: volume,
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      setProjectMessage(`Audio exportado a WAV (${duration.toFixed(2)}s).`)
    } catch {
      setProjectMessage("No se pudo exportar el audio del proyecto.")
    } finally {
      setIsExportingAudio(false)
    }
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
        envelope: primaryTrack.envelope,
        event: midiEvent,
        instrumentId: primaryTrack.instrumentId,
        pan: primaryTrack.pan,
        trackId: primaryTrack.id,
        volume: primaryTrack.volume,
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
              {
                playbackEnvelope: activeNoteCapture.envelope,
                playbackPan: activeNoteCapture.pan,
                playbackTrackId: activeNoteCapture.trackId,
                playbackVolume: activeNoteCapture.volume,
              },
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
          activeInstrumentCategory={activeInstrumentCategory}
          envelopeHelpText="Ajusta ADSR de la pista activa. Los cambios afectan las notas nuevas y quedan guardados con la grabacion."
          envelope={primaryTrack.envelope}
          instrumentCategoryDescription={getInstrumentCategoryDescription(
            activeInstrumentCategory,
          )}
          instrumentCategories={instrumentCategories}
          instrumentOptions={visibleInstruments.map((instrument) => ({
            id: instrument.id,
            name: `${instrument.name} (${getInstrumentCategoryLabel(instrument.category)})`,
          }))}
          noteCount={noteCount}
          onAddTrack={addTrack}
          onInstrumentCategoryChange={updateTrackInstrumentCategory}
          onProjectNameChange={updateProjectName}
          onRemoveActiveTrack={removeActiveTrack}
          onSwitchActiveTrack={switchActiveTrack}
          onTrackEnvelopeChange={updatePrimaryTrackEnvelope}
          onTrackInstrumentChange={updateTrackInstrumentId}
          onTrackMutedToggle={togglePrimaryTrackMuted}
          onTrackNameChange={updateTrackName}
          onTrackPanChange={updatePrimaryTrackPan}
          onTrackSoloToggle={togglePrimaryTrackSolo}
          onTrackVolumeAutomationChange={updatePrimaryTrackVolumeAutomation}
          onTrackVolumeChange={updatePrimaryTrackVolume}
          pan={primaryTrack.pan}
          primaryTrackId={primaryTrack.id}
          primaryTrackInstrumentId={primaryTrack.instrumentId}
          primaryTrackMuted={primaryTrack.muted}
          primaryTrackName={primaryTrack.name}
          primaryTrackSolo={primaryTrack.solo}
          projectMessage={projectMessage}
          projectName={project.name}
          trackCount={project.tracks.length}
          tracks={project.tracks}
          volumeAutomation={primaryTrack.volumeAutomation}
          volume={primaryTrack.volume}
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
          playOptions={basePreviewPlayOptions}
          resolvePlayOptions={() => getTrackPreviewPlayOptions(getCurrentRecordTime())}
          selectedNote={selectedNote}
        />

        <MiniSmcPad onTrigger={triggerSmcPad} />

        <LabActions
          canExportAudio={allRecordedNotes.length > 0}
          canPlayRecording={allRecordedNotes.length > 0}
          isExportingAudio={isExportingAudio}
          isPlaying={playbackTransport.isPlaying}
          onClearSession={clearSession}
          onExportAudio={exportProjectAudio}
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
