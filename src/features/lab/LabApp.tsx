import type { ChangeEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import "../../App.css"
import {
  startArpeggiatorPlayback,
  type ArpeggiatorHandle,
} from "../../application/use-cases/arpeggiatorPlayback"
import { exportProjectAudio as exportProjectAudioUseCase } from "../../application/use-cases/exportProjectAudio"
import { playNote, playNotes } from "../../application/use-cases/playNote"
import { setMasterVolume, type ADSREnvelope } from "../../engine/audio/audioEngine"
import {
  createPlayOptions,
  getInstrumentCategoryDescription,
  getInstrumentCategoryLabel,
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "../../engine/audio/mathematicalInstruments"
import { useLabInstrumentCatalog } from "./useLabInstrumentCatalog"
import {
  createArpeggiatorSteps,
  defaultArpeggiatorSettings,
  type ArpeggiatorMode,
  type ArpeggiatorRate,
  type ArpeggiatorSettings,
  type ArpeggiatorStep,
} from "../../engine/midi/arpeggiator"
import {
  createMidiRecordedNote,
  createMidiNoteEvent,
  isSmcPadRecordedNote,
  type MidiNoteEvent,
  type MidiNoteEventType,
} from "../../engine/midi/events"
import {
  createPianoPreviewNotes,
  previewOctaveOptions,
  transposeNote,
  type MusicalNote,
  type Octave,
} from "../../engine/midi/notes"
import {
  appendNoteToTrack,
  appendTrack,
  clearAllTrackNotes,
  compactTrackNotesStart,
  createDefaultProject,
  duplicateNoteInTrack,
  getTrackNoteTimelineContentLength,
  getTrackNoteTimelineLength,
  getProjectTrackTimelineLength,
  getTracksTimelineLength,
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
  updateProjectPluginEnabled,
  updateProjectTrackTimelineDuration,
  updateTrackEnvelope,
  updateTrackInstrument,
  updateTrackMuted,
  updateTrackNoteTimelineDuration,
  updateTrackPan,
  updateTrackSolo,
  updateTrackTimelineClip,
  updateTrackVolumeAutomation,
  updateTrackVolume,
  type TrackVolumeAutomation,
} from "../../engine/project/projectModel"
import { loadStoredProject, saveProject } from "../../engine/project/projectStorage"
import {
  findRegisteredPluginByInstrumentId,
  getRegisteredPluginSummaries,
} from "../../engine/plugins/pluginRegistry"
import { LabActions } from "./LabActions"
import { LabNoteEditor } from "./LabNoteEditor"
import { LabProjectPanel } from "./LabProjectPanel"
import { LabSoundControls } from "./LabSoundControls"
import { useLabRecordingSession } from "./useLabRecordingSession"
import {
  getSmcPadSoundDescriptor,
  playSmcPadHit,
  type SmcPadSoundId,
} from "../../application/use-cases/playSmcPadHit"
import { MidiEventLog } from "../midi-events/MidiEventLog"
import { RecordedNoteList } from "../midi-events/RecordedNoteList"
import {
  PianoPreview,
  type PianoInteractionMode,
} from "../piano/PianoPreview"
import { MiniSmcPad } from "../smc-pad/MiniSmcPad"
import { TrackTimelinePreview } from "../timeline/TrackTimelinePreview"
import { TimelinePreview } from "../timeline/TimelinePreview"
import { useProjectHistory } from "../history/useProjectHistory"
import { usePlaybackTransport } from "../transport/usePlaybackTransport"

const HISTORY_LIMIT = 20

const chordIntervals = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  power: [0, 7, 12],
} as const

type ChordType = keyof typeof chordIntervals

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

function LabApp() {
  const [volume, setVolume] = useState(0.8)
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("major")
  const [pianoMode, setPianoMode] = useState<PianoInteractionMode>("note")
  const [arpeggiatorSettings, setArpeggiatorSettings] = useState<ArpeggiatorSettings>(
    defaultArpeggiatorSettings,
  )
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
  const undoActionRef = useRef<() => void>(() => {})
  const redoActionRef = useRef<() => void>(() => {})
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const activeArpeggiatorHandleRef = useRef<ArpeggiatorHandle | null>(null)
  const activeArpeggiatorTriggerKeyRef = useRef<string | null>(null)
  const playbackTransport = usePlaybackTransport()

  const primaryTrack =
    project.tracks.find((track) => track.id === activeTrackId) ?? project.tracks[0]
  const {
    activeInstrumentCategory,
    availableInstruments,
    instrumentCategories,
    selectedInstrument,
    visibleInstruments,
  } = useLabInstrumentCatalog(primaryTrack.instrumentId, project.pluginStates)
  const registeredPlugins = useMemo(
    () => getRegisteredPluginSummaries(project.pluginStates),
    [project.pluginStates],
  )
  const visibleInstrumentOptions = useMemo(
    () =>
      visibleInstruments.map((instrument) => {
        const plugin = findRegisteredPluginByInstrumentId(
          instrument.id,
          project.pluginStates,
        )
        const sourceLabel = plugin ? plugin.name : "Core"

        return {
          id: instrument.id,
          name: `${instrument.name} (${getInstrumentCategoryLabel(instrument.category)} · ${sourceLabel})`,
        }
      }),
    [project.pluginStates, visibleInstruments],
  )
  const visibleNotes = useMemo(() => createPianoPreviewNotes(previewOctave), [previewOctave])
  const allRecordedNotes = project.tracks.flatMap((track) => track.notes)
  const projectTrackTimelineLength = getProjectTrackTimelineLength(project)
  const primaryTrackNoteTimelineLength = getTrackNoteTimelineLength(primaryTrack)
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

  function stopArpeggiator(resetTriggerKey = true) {
    activeArpeggiatorHandleRef.current?.stop()
    activeArpeggiatorHandleRef.current = null

    if (resetTriggerKey) {
      activeArpeggiatorTriggerKeyRef.current = null
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
  const {
    getCurrentRecordTime,
    recordNotesAtTime,
    recordNotesToActiveTrack,
    recordingState,
    registerMidiEvent,
    resetRecordingSession,
    startRecording,
    stopRecording,
  } = useLabRecordingSession({
    getPerformanceTimestamp,
    getTrackAutomationVolumeAtTime,
    onProjectUpdate: applyUpdate,
    onStopArpeggiator: () => stopArpeggiator(),
    onStopPlayback: playbackTransport.stop,
    onUpdateMessage: setProjectMessage,
    primaryTrack,
  })

  function playTestNote() {
    if (arpeggiatorSettings.enabled) {
      triggerArpeggiatorPattern([selectedNote])
      return
    }

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

    if (arpeggiatorSettings.enabled) {
      triggerArpeggiatorPattern(chordNotes)
      return
    }

    const previewPlayOptions = getTrackPreviewPlayOptions(getCurrentRecordTime())

    playNotes(chordNotes, 1.15, {
      ...previewPlayOptions,
      volume: (previewPlayOptions.volume ?? 0) * 0.72,
    })
    recordNotesToActiveTrack(chordNotes, 1.15)
    setProjectMessage(`Acorde ${selectedChordType} grabado en ${primaryTrack.name}.`)
  }

  function buildArpeggiatorTriggerKey(sourceNotes: MusicalNote[]) {
    return sourceNotes.join("|")
  }

  function getArpeggiatorPreviewStepCount(steps: ArpeggiatorStep[]) {
    if (steps.length === 0) {
      return 0
    }

    if (arpeggiatorSettings.mode === "chord") {
      return Math.max(2, arpeggiatorSettings.octaveRange)
    }

    return steps.length
  }

  function playAndRecordStepNotes(notes: MusicalNote[], duration: number) {
    const interactionTime = getCurrentRecordTime()

    playNotes(notes, duration, getTrackPreviewPlayOptions(interactionTime))
    recordNotesAtTime(notes, duration, interactionTime)
  }

  function startArpeggiatorForNotes(
    sourceNotes: MusicalNote[],
    options: { maxSteps?: number } = {},
  ) {
    if (!arpeggiatorSettings.enabled || sourceNotes.length === 0) {
      return
    }

    stopArpeggiator(false)
    activeArpeggiatorTriggerKeyRef.current = buildArpeggiatorTriggerKey(sourceNotes)
    activeArpeggiatorHandleRef.current = startArpeggiatorPlayback({
      maxSteps: options.maxSteps,
      onStep: (notes, noteDuration) => {
        if (!isPrimaryTrackAudible) {
          return
        }

        playAndRecordStepNotes(notes, noteDuration)
      },
      settings: arpeggiatorSettings,
      sourceNotes,
    })
  }

  function triggerArpeggiatorPattern(sourceNotes: MusicalNote[]) {
    const steps = createArpeggiatorSteps(sourceNotes, arpeggiatorSettings)
    const maxSteps = getArpeggiatorPreviewStepCount(steps)

    if (maxSteps === 0) {
      return
    }

    startArpeggiatorForNotes(sourceNotes, { maxSteps })
    setProjectMessage(`Arpegio ${arpeggiatorSettings.mode} grabado en ${primaryTrack.name}.`)
  }

  function playRecording() {
    playbackTransport.play(project)
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

    if (recordingState === "recording") {
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
    stopArpeggiator()
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
    const nextInstrument = availableInstruments.find(
      (instrument) => instrument.category === category,
    )

    if (!nextInstrument) {
      return
    }

    updateTrackInstrumentId(nextInstrument.id)
  }

  function updatePluginEnabled(pluginId: string, enabled: boolean) {
    const pluginName =
      registeredPlugins.find((plugin) => plugin.id === pluginId)?.name ?? pluginId

    applyUpdate((currentProject) =>
      updateProjectPluginEnabled(currentProject, pluginId, enabled),
    )
    setProjectMessage(
      enabled
        ? `Plugin activado: ${pluginName}.`
        : `Plugin desactivado: ${pluginName}.`,
    )
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

  function updateTrackStartTime(
    trackId: string,
    startTime: number,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const quantize = (value: number) =>
      timelineSnapEnabled ? Math.round(value / timelineSnapStep) * timelineSnapStep : value
    const safeStartTime = Math.max(0, quantize(startTime))

    if (historyMode === "transient") {
      applyTransientUpdate((currentProject) =>
        updateTrackTimelineClip(currentProject, trackId, {
          startTime: safeStartTime,
        }),
      )
      return
    }

    commitTransientUpdate((currentProject) =>
      updateTrackTimelineClip(currentProject, trackId, {
        startTime: safeStartTime,
      }),
    )
  }

  function updateProjectTrackTimelineDurationValue(value: number) {
    if (!Number.isFinite(value)) {
      return
    }

    applyUpdate((currentProject) =>
      updateProjectTrackTimelineDuration(currentProject, value),
    )
  }

  function resetProjectTrackTimelineDuration() {
    applyUpdate((currentProject) =>
      updateProjectTrackTimelineDuration(
        currentProject,
        getTracksTimelineLength(currentProject.tracks),
      ),
    )
    setProjectMessage("Duracion del timeline ajustada al contenido.")
  }

  function updatePrimaryTrackNoteTimelineDurationValue(value: number) {
    if (!Number.isFinite(value)) {
      return
    }

    applyUpdate((currentProject) =>
      updateTrackNoteTimelineDuration(currentProject, primaryTrack.id, value),
    )
  }

  function resetPrimaryTrackNoteTimelineDuration() {
    applyUpdate((currentProject) =>
      updateTrackNoteTimelineDuration(currentProject, primaryTrack.id, (() => {
        const currentTrack =
          currentProject.tracks.find((track) => track.id === primaryTrack.id) ?? primaryTrack

        return getTrackNoteTimelineContentLength(currentTrack)
      })()),
    )
    setProjectMessage(
      `Duracion del timeline de notas ajustada al contenido de ${primaryTrack.name}.`,
    )
  }

  function compactPrimaryTrackNoteTimelineStart() {
    if (primaryTrack.notes.length === 0) {
      setProjectMessage(`No hay notas en ${primaryTrack.name} para compactar.`)
      return
    }

    const earliestStartTime = primaryTrack.notes.reduce(
      (minimumStartTime, note) => Math.min(minimumStartTime, note.startTime),
      Number.POSITIVE_INFINITY,
    )

    if (!Number.isFinite(earliestStartTime) || earliestStartTime <= 0) {
      setProjectMessage(`Las notas de ${primaryTrack.name} ya empiezan en 0s.`)
      return
    }

    applyUpdate((currentProject) =>
      compactTrackNotesStart(currentProject, primaryTrack.id),
    )
    setProjectMessage(`Inicio del timeline de notas compactado en ${primaryTrack.name}.`)
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
      stopArpeggiator()
      resetRecordingSession()
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
    stopArpeggiator()
    resetRecordingSession()
    setMidiEvents([])
    applyUpdate((currentProject) => clearAllTrackNotes(currentProject))
    setSelectedRecordedNoteId(null)
    setProjectMessage("Notas limpiadas. Pistas y nombre conservados.")
  }

  function restartProject() {
    playbackTransport.stop()
    stopArpeggiator()
    resetRecordingSession()
    setMidiEvents([])
    applyUpdate((currentProject) => resetProject(currentProject))
    setActiveTrackId("track-1")
    setSelectedRecordedNoteId(null)
    setProjectMessage("Proyecto reiniciado desde cero.")
  }

  function selectRecordedNote(noteId: string) {
    setSelectedRecordedNoteId(noteId)
  }

  function handleMidiEvent(type: MidiNoteEventType, note: MusicalNote) {
    const midiEvent = registerMidiEvent(type, note)

    setMidiEvents((currentEvents) => [midiEvent, ...currentEvents].slice(0, 12))
  }

  function handleArpeggiatorEnabledChange(enabled: boolean) {
    if (!enabled) {
      stopArpeggiator()
    }

    setArpeggiatorSettings((currentSettings) => ({
      ...currentSettings,
      enabled,
    }))
  }

  function handleArpeggiatorModeChange(mode: ArpeggiatorMode) {
    setArpeggiatorSettings((currentSettings) => ({
      ...currentSettings,
      mode,
    }))
  }

  function handleArpeggiatorRateChange(rate: ArpeggiatorRate) {
    setArpeggiatorSettings((currentSettings) => ({
      ...currentSettings,
      rate,
    }))
  }

  function handleArpeggiatorGateChange(gate: number) {
    setArpeggiatorSettings((currentSettings) => ({
      ...currentSettings,
      gate: Math.min(Math.max(gate, 0.2), 1),
    }))
  }

  function handleArpeggiatorOctaveRangeChange(octaveRange: number) {
    setArpeggiatorSettings((currentSettings) => ({
      ...currentSettings,
      octaveRange: Math.min(Math.max(octaveRange, 1), 3),
    }))
  }

  function handleArpeggiatorLatchChange(latch: boolean) {
    if (!latch) {
      activeArpeggiatorTriggerKeyRef.current = null
    }

    setArpeggiatorSettings((currentSettings) => ({
      ...currentSettings,
      latch,
    }))
  }

  function handlePianoTriggerStart(rootNote: MusicalNote) {
    if (!arpeggiatorSettings.enabled) {
      return
    }

    const sourceNotes = getPianoPlayableNotes(rootNote)
    const triggerKey = buildArpeggiatorTriggerKey(sourceNotes)

    if (arpeggiatorSettings.latch && activeArpeggiatorTriggerKeyRef.current === triggerKey) {
      stopArpeggiator()
      setProjectMessage("Latch del arpegiador detenido.")
      return
    }

    startArpeggiatorForNotes(sourceNotes)
    setProjectMessage(`Arpegiador ${arpeggiatorSettings.mode} activo en ${primaryTrack.name}.`)
  }

  function handlePianoTriggerEnd(rootNote: MusicalNote) {
    if (!arpeggiatorSettings.enabled || arpeggiatorSettings.latch) {
      return
    }

    const sourceNotes = getPianoPlayableNotes(rootNote)
    const triggerKey = buildArpeggiatorTriggerKey(sourceNotes)

    if (activeArpeggiatorTriggerKeyRef.current === triggerKey) {
      stopArpeggiator()
    }
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
          instrumentOptions={visibleInstrumentOptions}
          noteCount={noteCount}
          onAddTrack={addTrack}
          onInstrumentCategoryChange={updateTrackInstrumentCategory}
          onPluginEnabledChange={updatePluginEnabled}
          onProjectNameChange={updateProjectName}
          onProjectTrackTimelineDurationChange={updateProjectTrackTimelineDurationValue}
          onResetProjectTrackTimelineDuration={resetProjectTrackTimelineDuration}
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
          projectTrackTimelineDuration={project.trackTimelineDuration}
          plugins={registeredPlugins}
          trackCount={project.tracks.length}
          tracks={project.tracks}
          volumeAutomation={primaryTrack.volumeAutomation}
          volume={primaryTrack.volume}
        />

        <LabSoundControls
          arpeggiatorSettings={arpeggiatorSettings}
          availableNotes={visibleNotes}
          onArpeggiatorEnabledChange={handleArpeggiatorEnabledChange}
          onArpeggiatorGateChange={handleArpeggiatorGateChange}
          onArpeggiatorLatchChange={handleArpeggiatorLatchChange}
          onArpeggiatorModeChange={handleArpeggiatorModeChange}
          onArpeggiatorOctaveRangeChange={handleArpeggiatorOctaveRangeChange}
          onArpeggiatorRateChange={handleArpeggiatorRateChange}
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
          directPlaybackEnabled={!arpeggiatorSettings.enabled}
          interactionMode={pianoMode}
          notes={visibleNotes}
          onNoteOff={
            arpeggiatorSettings.enabled
              ? undefined
              : (note) => handleMidiEvent("note-off", note)
          }
          onNoteOn={
            arpeggiatorSettings.enabled
              ? undefined
              : (note) => handleMidiEvent("note-on", note)
          }
          onSelectNote={setSelectedNote}
          onTriggerNoteOff={handlePianoTriggerEnd}
          onTriggerNoteOn={handlePianoTriggerStart}
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
          isRecording={recordingState === "recording"}
          onPlayRecording={playRecording}
          onPlayTestChord={playTestChord}
          onPlayTestNote={playTestNote}
          onRestartProject={restartProject}
          onStartRecording={startRecording}
          onStopRecording={() => stopRecording()}
          onStopPlayback={playbackTransport.stop}
        />

        <MidiEventLog events={midiEvents} />
        <section className="timeline-workspace" aria-label="Workspace de timeline">
          <TrackTimelinePreview
            activeTrackId={primaryTrack.id}
            onSelectTrack={switchActiveTrack}
            onDragStateChange={setIsTimelineDragging}
            onUpdateTrackStartTime={updateTrackStartTime}
            timelineLength={projectTrackTimelineLength}
            tracks={project.tracks}
          />
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
            noteTimelineDuration={primaryTrack.noteTimelineDuration}
            onCompactNoteTimelineStart={compactPrimaryTrackNoteTimelineStart}
            onDuplicateSelectedNote={duplicateSelectedRecordedNote}
            onNoteTimelineDurationChange={updatePrimaryTrackNoteTimelineDurationValue}
            onRedo={redoProjectEdit}
            onResetNoteTimelineDuration={resetPrimaryTrackNoteTimelineDuration}
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
            timelineLength={primaryTrackNoteTimelineLength}
          />
        </section>
      </section>
    </main>
  )
}

export default LabApp
