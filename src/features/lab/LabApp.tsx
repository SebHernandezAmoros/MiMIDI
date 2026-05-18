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
  appendPadTrack,
  appendTrack,
  createProjectTrack,
  updatePadSoundSetting,
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
  type ProjectTrackType,
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
  updateMidiTrackStartTime,
  updateTrackVolumeAutomation,
  updateTrackVolume,
  type TrackVolumeAutomation,
  removeSamplerMix,
  renameSamplerMix,
  updateSamplerMixStartTime,
  getMidiTracks,
  getSamplerTracks,
} from "../../engine/project/projectModel"
import { Play, Square, Trash2, Undo2, Redo2, Copy, RotateCcw, ChevronsLeft, Upload, Folder, VolumeX, Minus, Plus, Lock, Unlock, ChevronLeft, ChevronRight } from "lucide-react"
import { loadStoredProject, saveProject } from "../../engine/project/projectStorage"
import { playSamplerMixes } from "../../application/use-cases/playSamplerMixes"
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
  PAD_SOUND_DEFAULTS,
  smcPadSounds,
  type SmcPadSoundId,
  type PadSoundParams,
} from "../../application/use-cases/playSmcPadHit"
import { MidiEventLog } from "../midi-events/MidiEventLog"
import {
  PianoPreview,
  type PianoInteractionMode,
} from "../piano/PianoPreview"
import { MiniSmcPad } from "../smc-pad/MiniSmcPad"
import { TrackTimelinePreview } from "../timeline/TrackTimelinePreview"
import { TimelinePreview } from "../timeline/TimelinePreview"
import { useProjectHistory } from "../history/useProjectHistory"
import { usePlaybackTransport } from "../transport/usePlaybackTransport"
import { AppDialog } from "../../app/components/AppDialog"
import { PerformResponsiveToolbar } from "../perform/components/PerformResponsiveToolbar"

const HISTORY_LIMIT = 20

const chordIntervals = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  power: [0, 7, 12],
} as const

type ChordType = keyof typeof chordIntervals

const PAD_ACCENT_MAP: Partial<Record<SmcPadSoundId, string>> = {
  kick: "ui-smc-btn-kick",
  snare: "ui-smc-btn-snare",
  hat: "ui-smc-btn-hat",
  "open-hat": "ui-smc-btn-hat",
  clap: "ui-smc-btn-clap",
  sub: "ui-smc-btn-kick",
}

function getPadBtnClass(id: SmcPadSoundId): string {
  return PAD_ACCENT_MAP[id] ?? "ui-smc-btn-perc"
}

function getInitialProject() {
  return loadStoredProject() ?? createDefaultProject()
}

function getInitialProjectMessage() {
  const storedProject = loadStoredProject()

  if (!storedProject) {
    return ""
  }

  return getMidiTracks(storedProject.timeline).some((track) => track.notes.length > 0)
    ? `Proyecto restaurado: ${storedProject.name}.`
    : ""
}

function getInitialActiveTrackId(mode: LabAppMode) {
  const project = getInitialProject()
  const tracks = getMidiTracks(project.timeline)
  const targetType: ProjectTrackType = mode === "sampler-only" ? "percussion" : "melodic"
  return tracks.find((t) => t.trackType === targetType)?.id
    ?? tracks[0]?.id
    ?? "track-1"
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

type LabAppMode = "full" | "edit-only" | "project-only" | "perform-only" | "plugins-only" | "sampler-only"

type LabAppProps = {
  mode?: LabAppMode
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

const EMPTY_MIDI_TRACK = createProjectTrack(0)

function LabApp({ mode = "full", settingsOpen = false, onSettingsClose }: LabAppProps) {
  const [volume, setVolume] = useState(0.8)
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("major")
  const [pianoMode, setPianoMode] = useState<PianoInteractionMode>("note")
  const [arpeggiatorSettings, setArpeggiatorSettings] = useState<ArpeggiatorSettings>(
    defaultArpeggiatorSettings,
  )
  const [previewOctave, setPreviewOctave] = useState<Octave>(4)
  const [timelineView, setTimelineView] = useState<"notes" | "tracks">("notes")
  const [timelineSnapEnabled, setTimelineSnapEnabled] = useState(false)
  const [timelineSnapStep, setTimelineSnapStep] = useState(0.1)
  const [isTimelineDragging, setIsTimelineDragging] = useState(false)
  const [activeTrackId, setActiveTrackId] = useState(() => getInitialActiveTrackId(mode))
  const [projectMessage, setProjectMessage] = useState(getInitialProjectMessage)
  const [selectedRecordedNoteId, setSelectedRecordedNoteId] = useState<string | null>(
    null,
  )
  const [midiEvents, setMidiEvents] = useState<MidiNoteEvent[]>([])
  const [isExportingAudio, setIsExportingAudio] = useState(false)
  const [activeSamplerPadId, setActiveSamplerPadId] = useState<SmcPadSoundId | null>(null)
  const [padPage, setPadPage] = useState(0)
  const [configSoundId, setConfigSoundId] = useState<SmcPadSoundId | null>(null)
  const [isTrackRemovalConfirmOpen, setIsTrackRemovalConfirmOpen] = useState(false)
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false)
  const [isInstrumentDialogOpen, setIsInstrumentDialogOpen] = useState(false)
  const [instrumentDialogCategory, setInstrumentDialogCategory] = useState<
    MathematicalInstrument["category"]
  >("base")
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
  const samplerMixPlaybackRef = useRef<{ cancel: () => void } | null>(null)
  const [absolutePlayheadTime, setAbsolutePlayheadTime] = useState<number | null>(null)
  const [isMixOnlyPlaying, setIsMixOnlyPlaying] = useState(false)
  const mixOnlyStartRef = useRef<{ startedAt: number; duration: number } | null>(null)
  const [selectedMixId, setSelectedMixId] = useState<string | null>(null)
  const [isMixDeleteConfirmOpen, setIsMixDeleteConfirmOpen] = useState(false)
  const midiTracks = getMidiTracks(project.timeline)
  const hasNoTracks = midiTracks.length === 0

  useEffect(() => {
    if (hasNoTracks && timelineView === "notes") {
      setTimelineView("tracks")
    }
  }, [hasNoTracks, timelineView])

  useEffect(() => {
    const tracks = getMidiTracks(project.timeline)
    if (tracks.length > 0 && !tracks.some((t) => t.id === activeTrackId)) {
      setActiveTrackId(tracks[0].id)
    }
  }, [project.timeline, activeTrackId])

  useEffect(() => {
    if (!playbackTransport.isPlaying || !playbackTransport.playbackInfo) {
      setAbsolutePlayheadTime(null)
      return
    }

    const { startedAt, contentStart } = playbackTransport.playbackInfo
    let rafId: number

    function tick() {
      setAbsolutePlayheadTime(contentStart + (performance.now() - startedAt) / 1000)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [playbackTransport.isPlaying, playbackTransport.playbackInfo])

  useEffect(() => {
    if (!isMixOnlyPlaying || !mixOnlyStartRef.current) return
    const { startedAt, duration } = mixOnlyStartRef.current
    let rafId: number
    function tick() {
      const elapsed = (performance.now() - startedAt) / 1000
      if (elapsed >= duration) {
        setAbsolutePlayheadTime(null)
        setIsMixOnlyPlaying(false)
        mixOnlyStartRef.current = null
        return
      }
      setAbsolutePlayheadTime(elapsed)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isMixOnlyPlaying])

  const melodicTracks = midiTracks.filter((t) => t.trackType === "melodic")
  const percussionTracks = midiTracks.filter((t) => t.trackType === "percussion")
  const primaryTrack = (() => {
    if (mode === "sampler-only") {
      return percussionTracks.find((t) => t.id === activeTrackId)
        ?? percussionTracks[0]
        ?? midiTracks[0]
        ?? EMPTY_MIDI_TRACK
    }
    return midiTracks.find((t) => t.id === activeTrackId)
      ?? melodicTracks[0]
      ?? midiTracks[0]
      ?? EMPTY_MIDI_TRACK
  })()
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
  const dialogVisibleInstruments = useMemo(
    () =>
      availableInstruments
        .filter((instrument) => instrument.category === instrumentDialogCategory)
        .map((instrument) => {
          const plugin = findRegisteredPluginByInstrumentId(instrument.id, project.pluginStates)
          return { ...instrument, sourceLabel: plugin ? plugin.name : "Core" }
        }),
    [availableInstruments, instrumentDialogCategory, project.pluginStates],
  )
  const visibleNotes = useMemo(() => createPianoPreviewNotes(previewOctave), [previewOctave])
  const allRecordedNotes = midiTracks.flatMap((track) => track.notes)
  const projectTrackTimelineLength = getProjectTrackTimelineLength(project)
  const primaryTrackNoteTimelineLength = getTrackNoteTimelineLength(primaryTrack)
  const noteCount = primaryTrack.notes.length
  const isPrimaryTrackAudible = isTrackAudible(primaryTrack, midiTracks)
  const selectedRecordedNote =
    primaryTrack.notes.find((note) => note.id === selectedRecordedNoteId) ?? null

  let selectedNoteHistoryStatus: "modificada" | "sin-cambios" | null = null
  if (selectedRecordedNoteId && selectedRecordedNote) {
    const latestSnapshot = undoStack.at(-1)
    if (!latestSnapshot) {
      selectedNoteHistoryStatus = "sin-cambios"
    } else {
      const snapshotTrack = getMidiTracks(latestSnapshot.timeline).find((t) => t.id === primaryTrack.id)
      const snapshotNote = snapshotTrack?.notes.find((n) => n.id === selectedRecordedNoteId)
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

  useEffect(() => {
    if (!isTrackRemovalConfirmOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTrackRemovalConfirmOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isTrackRemovalConfirmOpen])

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

  function stepPreviewOctave(direction: -1 | 1) {
    const currentIndex = previewOctaveOptions.findIndex((octave) => octave === previewOctave)
    const safeIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = Math.min(
      Math.max(safeIndex + direction, 0),
      previewOctaveOptions.length - 1,
    )

    updatePreviewOctave(previewOctaveOptions[nextIndex])
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

  function playAll(notesProject: MusicalProject) {
    const startedAt = performance.now()
    samplerMixPlaybackRef.current?.cancel()
    const samplerTracks = getSamplerTracks(notesProject.timeline)
    samplerMixPlaybackRef.current = playSamplerMixes(samplerTracks, startedAt)
    const hasMidi = getMidiTracks(notesProject.timeline).some(t => t.notes.length > 0)
    if (hasMidi) {
      playbackTransport.play(notesProject)
    } else if (samplerTracks.length > 0) {
      const maxEnd = Math.max(
        ...samplerTracks.map(m => {
          const secondsPerStep = 60 / m.pattern.bpm / 4
          return m.startTime + m.pattern.stepsPerBar * secondsPerStep
        }),
      )
      mixOnlyStartRef.current = { startedAt, duration: maxEnd }
      setIsMixOnlyPlaying(true)
    }
  }

  function stopAll() {
    playbackTransport.stop()
    samplerMixPlaybackRef.current?.cancel()
    samplerMixPlaybackRef.current = null
    setIsMixOnlyPlaying(false)
    mixOnlyStartRef.current = null
    setAbsolutePlayheadTime(null)
  }

  function triggerSmcPad(soundId: SmcPadSoundId, velocity = 1) {
    const sound = getSmcPadSoundDescriptor(soundId)
    const startTime = getCurrentRecordTime()
    const livePlaybackState = getTrackLivePlaybackState(startTime)

    playSmcPadHit(
      soundId,
      isPrimaryTrackAudible ? livePlaybackState.volume : 0,
      livePlaybackState.pan,
      { ...PAD_SOUND_DEFAULTS[soundId], ...project.padSoundSettings[soundId], volume: velocity },
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
      const nextTrack = getMidiTracks(nextProject.timeline).at(-1)

      if (nextTrack) {
        setActiveTrackId(nextTrack.id)
        setProjectMessage(`Pista agregada: ${nextTrack.name}.`)
      }

      return nextProject
    })
  }

  function addPadTrack() {
    applyUpdate((currentProject) => {
      const nextProject = appendPadTrack(currentProject)
      const nextTrack = getMidiTracks(nextProject.timeline).at(-1)

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
    setSelectedMixId(null)
  }

  function switchTrackByOffset(offset: -1 | 1) {
    const currentIndex = midiTracks.findIndex((track) => track.id === primaryTrack.id)

    if (currentIndex < 0) {
      return
    }

    const nextTrack = midiTracks[currentIndex + offset]

    if (!nextTrack) {
      return
    }

    switchActiveTrack(nextTrack.id)
  }

  function removeActiveTrack() {
    if (hasNoTracks) return

    const isLastMidiTrack = midiTracks.length === 1
    const trackName = primaryTrack.name
    const currentIndex = midiTracks.findIndex((track) => track.id === primaryTrack.id)
    const fallbackTrackId =
      midiTracks[currentIndex - 1]?.id ?? midiTracks[currentIndex + 1]?.id

    applyUpdate((currentProject) => {
      const withoutTrack = removeTrack(currentProject, primaryTrack.id)
      if (!isLastMidiTrack) return withoutTrack
      // Last midi track removed — insert a fresh Track 1 before any sampler tracks
      return { ...withoutTrack, timeline: [createProjectTrack(1), ...withoutTrack.timeline] }
    })
    setActiveTrackId(isLastMidiTrack ? "track-1" : (fallbackTrackId ?? ""))
    setSelectedRecordedNoteId(null)
    setProjectMessage(
      isLastMidiTrack
        ? `${trackName} eliminada. Pista vacia lista para grabar.`
        : `Pista eliminada: ${trackName}.`,
    )
  }

  function confirmRemoveActiveTrack() {
    if (hasNoTracks) return
    setIsTrackRemovalConfirmOpen(true)
  }

  function cancelRemoveActiveTrack() {
    setIsTrackRemovalConfirmOpen(false)
  }

  function acceptRemoveActiveTrack() {
    setIsTrackRemovalConfirmOpen(false)
    removeActiveTrack()
  }

  function openInstrumentDialog() {
    setInstrumentDialogCategory(activeInstrumentCategory)
    setIsInstrumentDialogOpen(true)
  }

  function closeInstrumentDialog() {
    setIsInstrumentDialogOpen(false)
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
        updateMidiTrackStartTime(currentProject, trackId, safeStartTime),
      )
      return
    }

    commitTransientUpdate((currentProject) =>
      updateMidiTrackStartTime(currentProject, trackId, safeStartTime),
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
        getTracksTimelineLength(currentProject.timeline),
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
          getMidiTracks(currentProject.timeline).find((track) => track.id === primaryTrack.id) ?? primaryTrack

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
      getMidiTracks(previousProject.timeline).find((track) => track.id === activeTrackId)?.id ??
        getMidiTracks(previousProject.timeline)[0]?.id ??
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
      getMidiTracks(nextProject.timeline).find((track) => track.id === activeTrackId)?.id ??
        getMidiTracks(nextProject.timeline)[0]?.id ??
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
        const snapshotTrack = getMidiTracks(snapshot.timeline).find((track) => track.id === primaryTrack.id)
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

    const snapshotTrack = getMidiTracks(candidateIndex.snapshot.timeline).find(
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
      setActiveTrackId(getMidiTracks(importedProject.timeline)[0]?.id ?? "track-1")
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

  const editNotesToPlay = timelineView === "notes"
    ? { ...project, timeline: [primaryTrack, ...getSamplerTracks(project.timeline)] }
    : project

  const editSettingsDuration = timelineView === "notes"
    ? primaryTrack.noteTimelineDuration
    : project.trackTimelineDuration

  const editWorkspace = (
    <section className="timeline-workspace" aria-label="Workspace de timeline">
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-controls">
          <div className="edit-view-switch" role="group" aria-label="Vista del timeline">
            <button
              aria-pressed={timelineView === "notes"}
              disabled={hasNoTracks}
              onClick={() => setTimelineView("notes")}
              title={hasNoTracks ? "Agrega una pista MIDI para editar notas" : undefined}
              type="button"
            >
              NOTAS
            </button>
            <button
              aria-pressed={timelineView === "tracks"}
              onClick={() => setTimelineView("tracks")}
              type="button"
            >
              TRACKS
            </button>
          </div>
          {timelineView === "notes" && !(mode === "edit-only" && selectedRecordedNote) && (
            <select
              aria-label="Seleccionar pista"
              className="ui-select"
              value={primaryTrack.id}
              onChange={(e) => switchActiveTrack(e.target.value)}
            >
              {midiTracks.map((track) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          )}
          {timelineView === "tracks" && (() => {
            const activeMix = selectedMixId
              ? getSamplerTracks(project.timeline).find((m) => m.id === selectedMixId)
              : null
            return activeMix ? (
              <input
                aria-label="Nombre del mix"
                className="edit-note-input edit-track-name-input"
                defaultValue={activeMix.name}
                key={activeMix.id}
                onBlur={(e) => {
                  const name = e.target.value.trim()
                  if (name) applyUpdate((p) => renameSamplerMix(p, activeMix.id, name))
                }}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
                type="text"
              />
            ) : hasNoTracks ? (
              <button
                className="ui-icon-btn"
                onClick={addTrack}
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem", borderRadius: "999px" }}
                title="Agregar pista MIDI"
                type="button"
              >
                + Pista MIDI
              </button>
            ) : (
              <input
                aria-label="Nombre de la pista activa"
                className="edit-note-input edit-track-name-input"
                defaultValue={primaryTrack.name}
                key={primaryTrack.id}
                onBlur={(e) => updateTrackName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
                type="text"
              />
            )
          })()}
          {mode === "edit-only" && timelineView === "notes" && selectedRecordedNote && (
            <>
              <span className="edit-note-chip">{selectedRecordedNote.note}</span>
              <input
                aria-label="Inicio (s)"
                className="edit-note-input"
                min="0"
                step="0.01"
                type="number"
                value={selectedRecordedNote.startTime.toFixed(2)}
                onChange={(e) => updateSelectedNoteStartTime(Number(e.target.value))}
              />
              <input
                aria-label="Duracion (s)"
                className="edit-note-input"
                disabled={isSmcPadRecordedNote(selectedRecordedNote)}
                min="0.01"
                step="0.01"
                type="number"
                value={selectedRecordedNote.duration.toFixed(2)}
                onChange={(e) => updateSelectedNoteDuration(Number(e.target.value))}
              />
              <button
                className="ui-icon-btn"
                onClick={duplicateSelectedRecordedNote}
                title="Duplicar nota"
                type="button"
              >
                <Copy size={15} />
              </button>
              <button
                className="ui-icon-btn"
                onClick={revertSelectedNoteToLastCommit}
                title="Revertir nota"
                type="button"
              >
                <RotateCcw size={15} />
              </button>
            </>
          )}
          <button
            aria-label={playbackTransport.isPlaying ? "Detener reproduccion" : "Reproducir"}
            className="ui-icon-btn"
            disabled={allRecordedNotes.length === 0 && getSamplerTracks(project.timeline).length === 0 && !playbackTransport.isPlaying && !isMixOnlyPlaying}
            onClick={() => (playbackTransport.isPlaying || isMixOnlyPlaying) ? stopAll() : playAll(editNotesToPlay)}
            title={playbackTransport.isPlaying ? "Detener" : "Reproducir"}
            type="button"
          >
            {(playbackTransport.isPlaying || isMixOnlyPlaying) ? <Square size={18} /> : <Play size={18} />}
          </button>
          {timelineView === "notes" && (
            <button
              className="ui-icon-btn"
              onClick={compactPrimaryTrackNoteTimelineStart}
              title="Compactar inicio"
              type="button"
            >
              <ChevronsLeft size={18} />
            </button>
          )}

          <span aria-hidden="true" className="perform-mode-transport-divider" />

          <label className="perform-mode-arp-toggle" aria-label="Snap al paso">
            <input
              checked={timelineSnapEnabled}
              className="ui-checkbox"
              onChange={(e) => setTimelineSnapEnabled(e.target.checked)}
              type="checkbox"
            />
            <span>SNAP</span>
          </label>
          {timelineSnapEnabled && (
            <select
              aria-label="Paso de snap"
              className="ui-select"
              value={timelineSnapStep}
              onChange={(e) => setTimelineSnapStep(Number(e.target.value))}
            >
              <option value={0.05}>0.05s</option>
              <option value={0.1}>0.10s</option>
              <option value={0.25}>0.25s</option>
              <option value={0.5}>0.50s</option>
            </select>
          )}

          {mode === "edit-only" && (
            <>
              <button
                aria-label="Silenciar pista"
                className={`ui-icon-btn edit-mute-solo-btn${primaryTrack.muted ? " edit-mute-solo-btn-active" : ""}`}
                onClick={togglePrimaryTrackMuted}
                title="Mute"
                type="button"
              >
                <VolumeX size={18} />
              </button>
              <button
                aria-label="Solo pista"
                className={`ui-icon-btn edit-mute-solo-btn${primaryTrack.solo ? " edit-mute-solo-btn-active" : ""}`}
                onClick={togglePrimaryTrackSolo}
                title="Solo"
                type="button"
              >
                Solo
              </button>
              <span aria-hidden="true" className="perform-mode-transport-divider" />
              <button
                aria-label="Reducir duración"
                className="ui-icon-btn"
                onClick={() => {
                  const next = Math.max(1, Number((editSettingsDuration - 0.1).toFixed(2)))
                  if (timelineView === "notes") updatePrimaryTrackNoteTimelineDurationValue(next)
                  else updateProjectTrackTimelineDurationValue(next)
                }}
                title="Reducir duración −0.1s"
                type="button"
              >
                <Minus size={18} />
              </button>
              <span className="edit-duration-label">{editSettingsDuration.toFixed(1)}s</span>
              <button
                aria-label="Aumentar duración"
                className="ui-icon-btn"
                onClick={() => {
                  const next = Number((editSettingsDuration + 0.1).toFixed(2))
                  if (timelineView === "notes") updatePrimaryTrackNoteTimelineDurationValue(next)
                  else updateProjectTrackTimelineDurationValue(next)
                }}
                title="Aumentar duración +0.1s"
                type="button"
              >
                <Plus size={18} />
              </button>
            </>
          )}
          <button
            aria-label="Deshacer"
            className="ui-icon-btn"
            disabled={!canUndo}
            onClick={undoProjectEdit}
            title="Deshacer"
            type="button"
          >
            <Undo2 size={18} />
          </button>
          <button
            aria-label="Rehacer"
            className="ui-icon-btn"
            disabled={!canRedo}
            onClick={redoProjectEdit}
            title="Rehacer"
            type="button"
          >
            <Redo2 size={18} />
          </button>
          {timelineView === "notes" && (
            <button
              aria-label="Eliminar nota seleccionada"
              className="ui-icon-btn"
              disabled={!selectedRecordedNote}
              onClick={() => selectedRecordedNote && removeRecordedNote(selectedRecordedNote.id)}
              title="Eliminar nota"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          )}
          {mode === "edit-only" && timelineView === "tracks" && (
            <button
              aria-label={selectedMixId ? "Eliminar mix" : `Eliminar ${primaryTrack.name}`}
              className="ui-icon-btn"
              disabled={!selectedMixId && hasNoTracks}
              onClick={selectedMixId ? () => setIsMixDeleteConfirmOpen(true) : confirmRemoveActiveTrack}
              title={selectedMixId ? "Eliminar mix seleccionado" : `Eliminar ${primaryTrack.name}`}
              type="button"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      {timelineView === "tracks" ? (
        <TrackTimelinePreview
          activeTrackId={primaryTrack.id}
          onSelectTrack={switchActiveTrack}
          onDragStateChange={setIsTimelineDragging}
          onRemoveSamplerMix={(mixId) => applyUpdate((p) => removeSamplerMix(p, mixId))}
          onRenameMix={(mixId, name) => applyUpdate((p) => renameSamplerMix(p, mixId, name))}
          onSelectMix={setSelectedMixId}
          selectedMixId={selectedMixId}
          onUpdateSamplerMixStartTime={(mixId, startTime, mode) => {
            const snapped = timelineSnapEnabled
              ? Math.max(0, Math.round(startTime / timelineSnapStep) * timelineSnapStep)
              : Math.max(0, startTime)
            if (mode === "transient") {
              applyTransientUpdate((p) => updateSamplerMixStartTime(p, mixId, snapped))
            } else {
              commitTransientUpdate((p) => updateSamplerMixStartTime(p, mixId, snapped))
            }
          }}
          onUpdateTrackStartTime={updateTrackStartTime}
          playheadTime={absolutePlayheadTime}
          timeline={project.timeline}
          timelineLength={projectTrackTimelineLength}
        />
      ) : (
        <>
          {mode !== "edit-only" && (
            <LabNoteEditor
              onDuplicateSelectedNote={duplicateSelectedRecordedNote}
              onRevertSelectedNote={revertSelectedNoteToLastCommit}
              onSelectedNoteDurationChange={updateSelectedNoteDuration}
              onSelectedNoteStartTimeChange={updateSelectedNoteStartTime}
              selectedNoteHistoryStatus={selectedNoteHistoryStatus}
              selectedRecordedNote={selectedRecordedNote}
            />
          )}
          <TimelinePreview
            notes={primaryTrack.notes}
            onDragStateChange={setIsTimelineDragging}
            onRemoveSelectedNote={mode !== "edit-only" ? removeRecordedNote : undefined}
            onSelectNote={selectRecordedNote}
            onUpdateNote={updateRecordedNote}
            playheadTime={absolutePlayheadTime !== null ? absolutePlayheadTime - primaryTrack.startTime : null}
            selectedNoteId={selectedRecordedNoteId}
            timelineLength={primaryTrackNoteTimelineLength}
          />
        </>
      )}
    </section>
  )

  if (mode === "edit-only") {
    return (
      <>
        {editWorkspace}
        <AppDialog
          description="Ajusta la duracion del timeline y las opciones de visualizacion."
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title="Opciones — Editor"
        >
          <div className="control-group">
            <label>
              Duracion ({timelineView === "notes" ? "notas" : "tracks"}) (s)
            </label>
            <input
              min="1"
              step="0.1"
              type="number"
              value={editSettingsDuration.toFixed(1)}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (timelineView === "notes") updatePrimaryTrackNoteTimelineDurationValue(v)
                else updateProjectTrackTimelineDurationValue(v)
              }}
            />
            <button
              onClick={() => {
                if (timelineView === "notes") resetPrimaryTrackNoteTimelineDuration()
                else resetProjectTrackTimelineDuration()
              }}
              type="button"
            >
              Ajustar al contenido
            </button>
          </div>
          {timelineView === "notes" && (
            <div className="control-group">
              <button onClick={compactPrimaryTrackNoteTimelineStart} type="button">
                Compactar inicio
              </button>
            </div>
          )}

          <div className="edit-settings-track-section">
            <span className="perform-instrument-dialog-title">Pista activa — {primaryTrack.name}</span>

            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="edit-track-volume">
                Volumen
              </label>
              <input
                id="edit-track-volume"
                max={1}
                min={0}
                onChange={(e) => updatePrimaryTrackVolume(parseFloat(e.target.value))}
                step={0.01}
                type="range"
                value={primaryTrack.volume}
              />
              <span className="edit-settings-track-value">{Math.round(primaryTrack.volume * 100)}%</span>
            </div>

            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="edit-track-pan">
                Pan
              </label>
              <input
                id="edit-track-pan"
                max={1}
                min={-1}
                onChange={(e) => updatePrimaryTrackPan(parseFloat(e.target.value))}
                step={0.01}
                type="range"
                value={primaryTrack.pan}
              />
              <span className="edit-settings-track-value">
                {primaryTrack.pan === 0
                  ? "C"
                  : primaryTrack.pan > 0
                    ? `R${Math.round(primaryTrack.pan * 100)}`
                    : `L${Math.round(Math.abs(primaryTrack.pan) * 100)}`}
              </span>
            </div>

            <span className="perform-instrument-dialog-title" style={{ marginTop: "0.3rem" }}>ADSR</span>
            {(["attack", "decay", "sustain", "release"] as const).map((param) => (
              <div className="edit-settings-track-row" key={param}>
                <label className="edit-settings-track-label" htmlFor={`edit-adsr-${param}`}>
                  {param.charAt(0).toUpperCase() + param.slice(1)}
                </label>
                <input
                  id={`edit-adsr-${param}`}
                  max={param === "sustain" ? 1 : 2}
                  min={0.01}
                  onChange={(e) => updatePrimaryTrackEnvelope(param, parseFloat(e.target.value))}
                  step={0.01}
                  type="range"
                  value={primaryTrack.envelope?.[param] ?? (param === "sustain" ? 0.72 : param === "attack" ? 0.01 : param === "decay" ? 0.12 : 0.18)}
                />
                <span className="edit-settings-track-value">
                  {param === "sustain"
                    ? `${Math.round((primaryTrack.envelope?.[param] ?? 0.72) * 100)}%`
                    : `${((primaryTrack.envelope?.[param] ?? 0.01) * 1000).toFixed(0)}ms`}
                </span>
              </div>
            ))}
          </div>
        </AppDialog>

        <AppDialog
          actions={
            <>
              <button onClick={cancelRemoveActiveTrack} type="button">
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={acceptRemoveActiveTrack}
                type="button"
              >
                {midiTracks.length === 1 ? "Reiniciar pistas" : "Eliminar"}
              </button>
            </>
          }
          description={
            midiTracks.length === 1
              ? "Se eliminaran todas las notas y quedara una pista vacia. Los mixes del timeline no se borran."
              : "La pista activa y sus notas se eliminaran de esta toma."
          }
          onClose={cancelRemoveActiveTrack}
          open={isTrackRemovalConfirmOpen}
          title={midiTracks.length === 1 ? "Reiniciar pistas MIDI?" : `Eliminar ${primaryTrack.name}?`}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => setIsMixDeleteConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={() => {
                  const id = selectedMixId
                  setIsMixDeleteConfirmOpen(false)
                  setSelectedMixId(null)
                  if (id) applyUpdate((p) => removeSamplerMix(p, id))
                }}
                type="button"
              >
                Eliminar
              </button>
            </>
          }
          description="El mix se eliminara del timeline. Los slots y patrones del sampler no se borran."
          onClose={() => setIsMixDeleteConfirmOpen(false)}
          open={isMixDeleteConfirmOpen}
          title="Eliminar mix del timeline?"
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => setIsRestartConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  setIsRestartConfirmOpen(false)
                  restartProject()
                }}
                type="button"
              >
                Reiniciar
              </button>
            </>
          }
          description="Al eliminar esta pista solo quedara una. El proyecto se reiniciara y se perderan todas las notas grabadas."
          onClose={() => setIsRestartConfirmOpen(false)}
          open={isRestartConfirmOpen}
          title="Reiniciar proyecto?"
        />
      </>
    )
  }

  const projectPanel = (
    <LabProjectPanel
      activeInstrumentCategory={activeInstrumentCategory}
      envelopeHelpText="Ajusta ADSR de la pista activa. Los cambios afectan las notas nuevas y quedan guardados con la grabacion."
      envelope={primaryTrack.envelope}
      historyCount={undoStack.length}
      instrumentCategoryDescription={getInstrumentCategoryDescription(
        activeInstrumentCategory,
      )}
      instrumentCategories={instrumentCategories}
      instrumentOptions={visibleInstrumentOptions}
      noteCount={noteCount}
      noteTimelineDuration={primaryTrack.noteTimelineDuration}
      onAddTrack={addTrack}
      onInstrumentCategoryChange={updateTrackInstrumentCategory}
      onPluginEnabledChange={updatePluginEnabled}
      onProjectNameChange={updateProjectName}
      onProjectTrackTimelineDurationChange={updateProjectTrackTimelineDurationValue}
      onResetProjectTrackTimelineDuration={resetProjectTrackTimelineDuration}
      onResetTrackNoteTimelineDuration={resetPrimaryTrackNoteTimelineDuration}
      onRemoveActiveTrack={removeActiveTrack}
      onSwitchActiveTrack={switchActiveTrack}
      onTrackEnvelopeChange={updatePrimaryTrackEnvelope}
      onTrackInstrumentChange={updateTrackInstrumentId}
      onTrackMutedToggle={togglePrimaryTrackMuted}
      onTrackNameChange={updateTrackName}
      onTrackNoteTimelineDurationChange={updatePrimaryTrackNoteTimelineDurationValue}
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
      trackCount={midiTracks.length}
      tracks={midiTracks}
      volumeAutomation={primaryTrack.volumeAutomation}
      volume={primaryTrack.volume}
    />
  )

  const projectWorkspace = (
    <section className="app-mock-screen" aria-label="Proyecto actual">
      <input
        accept=".json,application/json"
        hidden
        onChange={importProjectFile}
        ref={importInputRef}
        type="file"
      />
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-copy">
          <strong>{project.name || "Proyecto"}</strong>
          {projectMessage && <span>{projectMessage}</span>}
        </div>
      </header>
      <div className="project-compact-body">
        <div className="project-compact-name-row">
          <span className="perform-instrument-dialog-title">Nombre</span>
          <input
            className="project-compact-name-input"
            onChange={(e) => updateProjectName(e.target.value)}
            placeholder="Nombre del proyecto"
            type="text"
            value={project.name}
          />
        </div>

        <div className="project-compact-grid">
          <button
            className="project-export-btn project-export-btn-primary project-compact-btn-wide"
            disabled={allRecordedNotes.length === 0 && !playbackTransport.isPlaying}
            onClick={playbackTransport.isPlaying ? playbackTransport.stop : playRecording}
            type="button"
          >
            {playbackTransport.isPlaying ? <><Square size={13} /> Detener</> : <><Play size={13} /> Reproducir</>}
          </button>
          <button
            className="project-export-btn project-export-btn-primary project-compact-btn-wide"
            disabled={allRecordedNotes.length === 0 || isExportingAudio}
            onClick={exportProjectAudio}
            type="button"
          >
            {isExportingAudio ? "Exportando..." : <><Play size={13} /> Exportar WAV</>}
          </button>
          <button
            className="project-export-btn"
            onClick={exportProject}
            type="button"
          >
            Exportar JSON
          </button>
          <button
            className="project-export-btn"
            onClick={openImportDialog}
            type="button"
          >
            Importar JSON
          </button>
        </div>
      </div>
    </section>
  )

  if (mode === "project-only") {
    return projectWorkspace
  }

  if (mode === "plugins-only") {
    return (
      <section className="app-mock-screen" aria-label="Plugins">
        <header className="app-mock-toolbar">
          <div className="app-mock-toolbar-actions">
            <button className="ui-pill-btn" type="button">
              <Upload size={14} />
              IMPORT
            </button>
            <button className="ui-pill-btn" type="button">
              <Folder size={14} />
              PLUGIN FOLDER
            </button>
          </div>
        </header>
        <div className="app-plugin-list" aria-label="Lista de plugins">
          {registeredPlugins.map((plugin) => {
            const words = plugin.name.trim().split(/\s+/)
            const shortLabel = words.length === 1
              ? plugin.name.slice(0, 2).toUpperCase()
              : words.slice(0, 2).map((w) => w[0]).join("").toUpperCase()
            return (
              <article className="ui-list-row" key={plugin.id}>
                <span className="ui-badge" aria-hidden="true">{shortLabel}</span>
                <div className="ui-plugin-copy">
                  <strong>{plugin.name}</strong>
                  <span>{plugin.version} · {plugin.description}</span>
                </div>
                <label
                  className="ui-toggle"
                  aria-label={`${plugin.enabled ? "Desactivar" : "Activar"} ${plugin.name}`}
                >
                  <input
                    checked={plugin.enabled}
                    onChange={() => updatePluginEnabled(plugin.id, !plugin.enabled)}
                    type="checkbox"
                  />
                  <span />
                </label>
                <span className="ui-list-arrow" aria-hidden="true">›</span>
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  if (mode === "sampler-only") {
    const handleSamplerPad = (id: SmcPadSoundId, velocity = 1) => {
      triggerSmcPad(id, velocity)
      setActiveSamplerPadId(id)
      window.setTimeout(() => setActiveSamplerPadId(null), 140)
    }

    return (
      <>
      <section className="app-mock-screen" aria-label="Workspace SMC Pad">
        <header className="app-mock-toolbar">
          <div className="perform-mode-transport" aria-label="Controles de grabación">
            <button
              aria-label={recordingState === "recording" ? "Detener grabación" : "Iniciar grabación"}
              className={`perform-mode-transport-button${recordingState === "recording" ? " perform-mode-transport-button-active" : ""}`}
              onClick={recordingState === "recording" ? () => stopRecording() : startRecording}
              type="button"
            >
              <span className="perform-mode-transport-icon">
                <span className={`perform-mode-transport-glyph ${recordingState === "recording" ? "perform-mode-transport-glyph-stop" : "perform-mode-transport-glyph-record"}`}>
                  {recordingState === "recording" ? "■" : "●"}
                </span>
              </span>
            </button>
            <button
              aria-label={playbackTransport.isPlaying ? "Detener reproducción" : "Reproducir"}
              className={`perform-mode-transport-button${playbackTransport.isPlaying ? " perform-mode-transport-button-active" : ""}`}
              disabled={recordingState === "recording"}
              onClick={playbackTransport.isPlaying ? playbackTransport.stop : () => playbackTransport.play({ ...project, timeline: [primaryTrack] }, { padSoundSettings: project.padSoundSettings })}
              type="button"
            >
              <span className="perform-mode-transport-icon">
                <span className={`perform-mode-transport-glyph ${playbackTransport.isPlaying ? "perform-mode-transport-glyph-stop" : "perform-mode-transport-glyph-play"}`}>
                  {playbackTransport.isPlaying ? "■" : "▶"}
                </span>
              </span>
            </button>
          </div>

          <span aria-hidden="true" className="perform-mode-transport-divider" />

          <div className="ui-pad-pager">
            <button
              aria-label="Página anterior"
              className="ui-icon-btn"
              disabled={padPage === 0}
              onClick={() => setPadPage((p) => Math.max(0, p - 1))}
              type="button"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="ui-pad-pager-label">{padPage + 1} / {Math.ceil(smcPadSounds.length / 8)}</span>
            <button
              aria-label="Página siguiente"
              className="ui-icon-btn"
              disabled={padPage >= Math.ceil(smcPadSounds.length / 8) - 1}
              onClick={() => setPadPage((p) => Math.min(Math.ceil(smcPadSounds.length / 8) - 1, p + 1))}
              type="button"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <span aria-hidden="true" className="perform-mode-transport-divider" />

          <div className="app-mock-toolbar-controls">
            <select
              aria-label="Pista activa"
              className="ui-select"
              value={primaryTrack.id}
              onChange={(e) => switchActiveTrack(e.target.value)}
            >
              {percussionTracks.map((track) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
            <button className="ui-pill-btn" onClick={addPadTrack} type="button">
              + Track
            </button>
            <button
              aria-label={project.padSettingsLocked ? "Desbloquear configuración" : "Bloquear configuración"}
              className="ui-icon-btn"
              onClick={() => applyUpdate((p) => ({ ...p, padSettingsLocked: !p.padSettingsLocked }))}
              title={project.padSettingsLocked ? "Desbloquear configuración" : "Bloquear configuración"}
              type="button"
            >
              {project.padSettingsLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <button
              aria-label={`Eliminar ${primaryTrack.name}`}
              className="ui-icon-btn"
              onClick={confirmRemoveActiveTrack}
              title={`Eliminar ${primaryTrack.name}`}
              type="button"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>
        <div className="ui-smc-grid">
          {smcPadSounds.slice(padPage * 8, padPage * 8 + 8).map((pad, i) => (
            <div key={pad.id} className="ui-smc-cell">
              <button
                aria-label={`${pad.label} — pulsar pad`}
                className={[
                  "ui-smc-btn",
                  getPadBtnClass(pad.id),
                  activeSamplerPadId === pad.id ? "ui-smc-btn-triggered" : "",
                ].filter(Boolean).join(" ")}
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const velocity = Math.max(0.35, 1 - (e.clientY - rect.top) / rect.height * 0.65)
                  handleSamplerPad(pad.id, velocity)
                }}
                type="button"
              >
                <span className="ui-smc-btn-num">{padPage * 8 + i + 1}</span>
                <span className="ui-smc-btn-label">{pad.label}</span>
                <span className="ui-smc-btn-desc">{pad.description}</span>
              </button>
              {!project.padSettingsLocked && (
                <button
                  aria-label={`Configurar ${pad.label}`}
                  className="ui-smc-config-btn"
                  onClick={() => setConfigSoundId(pad.id)}
                  title={`Configurar ${pad.label}`}
                  type="button"
                >
                  ⚙
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <AppDialog
        actions={
          <>
            <button onClick={cancelRemoveActiveTrack} type="button">
              Cancelar
            </button>
            <button
              className="app-dialog-confirm"
              onClick={acceptRemoveActiveTrack}
              type="button"
            >
              Eliminar
            </button>
          </>
        }
        description="La pista activa y sus notas se eliminaran de esta toma."
        onClose={cancelRemoveActiveTrack}
        open={isTrackRemovalConfirmOpen}
        title={`Eliminar ${primaryTrack.name}?`}
      />

      <AppDialog
        actions={
          <>
            <button onClick={() => setIsRestartConfirmOpen(false)} type="button">
              Cancelar
            </button>
            <button
              className="ui-btn-danger"
              onClick={() => {
                setIsRestartConfirmOpen(false)
                restartProject()
              }}
              type="button"
            >
              Reiniciar
            </button>
          </>
        }
        description="Al eliminar esta pista solo quedara una. El proyecto se reiniciara y se perderan todas las notas grabadas."
        onClose={() => setIsRestartConfirmOpen(false)}
        open={isRestartConfirmOpen}
        title="Reiniciar proyecto?"
      />

      {configSoundId && (() => {
        const snd = getSmcPadSoundDescriptor(configSoundId)
        const resolved: PadSoundParams = { ...PAD_SOUND_DEFAULTS[configSoundId], ...project.padSoundSettings[configSoundId] }
        const hasTune = resolved.tune !== undefined
        const hasLength = resolved.length !== undefined
        const hasFlicker = resolved.flicker !== undefined
        const patch = (p: Partial<PadSoundParams>) => applyUpdate((proj) => updatePadSoundSetting(proj, configSoundId, p))
        return (
          <AppDialog
            description={`Síntesis y comportamiento de ${snd.label}.`}
            onClose={() => setConfigSoundId(null)}
            open
            title={`Config — ${snd.label}`}
          >
            <div className="audio-sampler-settings">
              <section className="ui-list-section">
                <div className="edit-settings-track-row">
                  <label className="edit-settings-track-label" htmlFor="ps-volume">Volumen</label>
                  <input id="ps-volume" type="range" min={0} max={1} step={0.01}
                    value={resolved.volume}
                    onChange={(e) => patch({ volume: Number(e.target.value) })} />
                  <span className="edit-settings-track-value">{Math.round(resolved.volume * 100)}%</span>
                </div>
                <div className="edit-settings-track-row">
                  <label className="edit-settings-track-label" htmlFor="ps-decay">Decay</label>
                  <input id="ps-decay" type="range" min={0.3} max={2} step={0.05}
                    value={resolved.decay}
                    onChange={(e) => patch({ decay: Number(e.target.value) })} />
                  <span className="edit-settings-track-value">{resolved.decay.toFixed(2)}x</span>
                </div>
                <div className="edit-settings-track-row">
                  <label className="edit-settings-track-label" htmlFor="ps-dist">Distorsión</label>
                  <input id="ps-dist" type="range" min={0} max={1} step={0.01}
                    value={resolved.distortion}
                    onChange={(e) => patch({ distortion: Number(e.target.value) })} />
                  <span className="edit-settings-track-value">{Math.round(resolved.distortion * 100)}%</span>
                </div>
                {hasTune && (
                  <div className="edit-settings-track-row">
                    <label className="edit-settings-track-label" htmlFor="ps-tune">Tono</label>
                    <input id="ps-tune" type="range" min={20} max={400} step={1}
                      value={resolved.tune}
                      onChange={(e) => patch({ tune: Number(e.target.value) })} />
                    <span className="edit-settings-track-value">{resolved.tune} Hz</span>
                  </div>
                )}
                {hasLength && (
                  <div className="edit-settings-track-row">
                    <label className="edit-settings-track-label" htmlFor="ps-len">Longitud</label>
                    <input id="ps-len" type="range" min={0.02} max={0.6} step={0.005}
                      value={resolved.length}
                      onChange={(e) => patch({ length: Number(e.target.value) })} />
                    <span className="edit-settings-track-value">{Math.round((resolved.length ?? 0) * 1000)} ms</span>
                  </div>
                )}
                {hasFlicker && (
                  <div className="ui-list-row ui-list-row-static">
                    <span className="ui-list-label">Flicker (LFO)</span>
                    <label className="ui-toggle" aria-label="Flicker LFO">
                      <input type="checkbox" checked={resolved.flicker ?? false}
                        onChange={(e) => patch({ flicker: e.target.checked })} />
                      <span />
                    </label>
                  </div>
                )}
              </section>
            </div>
          </AppDialog>
        )
      })()}
    </>
    )
  }

  const performControls = (
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
  )

  const performPiano = (
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
  )

  const performPad = <MiniSmcPad onTrigger={triggerSmcPad} />

  const performActions = (
    <LabActions
      canExportAudio={allRecordedNotes.length > 0}
      canPlayRecording={allRecordedNotes.length > 0}
      isExportingAudio={isExportingAudio}
      isPlaying={playbackTransport.isPlaying}
      isRecording={recordingState === "recording"}
      onClearSession={clearSession}
      onExportAudio={exportProjectAudio}
      onExportProject={exportProject}
      onImportProject={openImportDialog}
      onPlayRecording={playRecording}
      onPlayTestChord={playTestChord}
      onPlayTestNote={playTestNote}
      onRestartProject={restartProject}
      onStartRecording={startRecording}
      onStopPlayback={playbackTransport.stop}
      onStopRecording={() => stopRecording()}
    />
  )

  const performMidiLog = <MidiEventLog events={midiEvents} />

  const performWorkspace = (
    <>
      {performControls}
      {performPiano}
      {performPad}
      {performActions}
      {performMidiLog}
    </>
  )

  if (mode === "perform-only") {
    return (
      <>
        <section className="perform-workspace-primary" aria-label="Panel principal Perform">
          <header className="app-mock-toolbar perform-mode-toolbar-bar">
            <PerformResponsiveToolbar
              activeInstrumentCategory={instrumentDialogCategory}
              allRecordedNotesCount={allRecordedNotes.length}
              instrumentCategories={instrumentCategories}
              isInstrumentDialogOpen={isInstrumentDialogOpen}
              isPlaying={playbackTransport.isPlaying}
              isRecording={recordingState === "recording"}
              octave={previewOctave}
              isArpEnabled={arpeggiatorSettings.enabled}
              onAddTrack={addTrack}
              onArpToggle={() => setArpeggiatorSettings((s) => ({ ...s, enabled: !s.enabled }))}
              onCloseInstrumentDialog={closeInstrumentDialog}
              onConfirmRemoveTrack={confirmRemoveActiveTrack}
              onInstrumentCategoryChange={setInstrumentDialogCategory}
              onInstrumentDialogOpen={openInstrumentDialog}
              onInstrumentSelect={updateTrackInstrumentId}
              onOctaveDown={() => stepPreviewOctave(-1)}
              onOctaveUp={() => stepPreviewOctave(1)}
              onPianoModeChange={setPianoMode}
              pianoMode={pianoMode}
              onPlayToggle={playbackTransport.isPlaying ? playbackTransport.stop : playRecording}
              onRecordToggle={
                recordingState === "recording" ? () => stopRecording() : startRecording
              }
              onSelectNextTrack={() => switchTrackByOffset(1)}
              onSelectPreviousTrack={() => switchTrackByOffset(-1)}
              primaryTrackName={primaryTrack.name}
              removeTrackDisabled={false}
              selectedInstrumentId={selectedInstrument.id}
              selectedInstrumentName={selectedInstrument.name}
              trackNextDisabled={midiTracks.at(-1)?.id === primaryTrack.id}
              trackPreviousDisabled={midiTracks[0]?.id === primaryTrack.id}
              visibleInstruments={dialogVisibleInstruments}
            />
          </header>

          <section className="perform-workspace-card perform-workspace-card-piano">
            {performPiano}
          </section>

          <div className="sr-only">
            {performControls}
          </div>
        </section>

        <AppDialog
          actions={
            <>
              <button onClick={cancelRemoveActiveTrack} type="button">
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={acceptRemoveActiveTrack}
                type="button"
              >
                Eliminar
              </button>
            </>
          }
          description="La pista activa y sus notas se eliminaran de esta toma."
          onClose={cancelRemoveActiveTrack}
          open={isTrackRemovalConfirmOpen}
          title={`Eliminar ${primaryTrack.name}?`}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => setIsRestartConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  setIsRestartConfirmOpen(false)
                  restartProject()
                }}
                type="button"
              >
                Reiniciar
              </button>
            </>
          }
          description="Al eliminar esta pista solo quedara una. El proyecto se reiniciara y se perderan todas las notas grabadas."
          onClose={() => setIsRestartConfirmOpen(false)}
          open={isRestartConfirmOpen}
          title="Reiniciar proyecto?"
        />

        <AppDialog
          description="Configura el modo de acorde y el arpegiador."
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title="Opciones — Piano"
        >
          <div className="perform-settings-dialog-v">
            <div className="perform-settings-dialog-section">
              <span className="perform-instrument-dialog-title">Tipo de acorde</span>
              <div className="perform-instrument-dialog-tabs">
                {(["major", "minor", "power"] as const).map((type) => (
                  <button
                    className={`ui-pill-btn${selectedChordType === type ? " ui-pill-btn-active" : ""}`}
                    key={type}
                    onClick={() => setSelectedChordType(type)}
                    type="button"
                  >
                    {type === "major" ? "Mayor" : type === "minor" ? "Menor" : "Power"}
                  </button>
                ))}
              </div>
            </div>

            <div className="perform-settings-dialog-section">
              <span className="perform-instrument-dialog-title">ARP — Modo</span>
              <div className="perform-instrument-dialog-tabs">
                {(["up", "down", "up-down", "random", "chord"] as const).map((m) => (
                  <button
                    className={`ui-pill-btn${arpeggiatorSettings.mode === m ? " ui-pill-btn-active" : ""}`}
                    key={m}
                    onClick={() => setArpeggiatorSettings((s) => ({ ...s, mode: m }))}
                    type="button"
                  >
                    {m === "up" ? "↑ Up" : m === "down" ? "↓ Down" : m === "up-down" ? "↕ Up-Down" : m === "random" ? "? Random" : "≡ Chord"}
                  </button>
                ))}
              </div>
            </div>

            <div className="perform-settings-dialog-section">
              <span className="perform-instrument-dialog-title">ARP — Rate</span>
              <div className="perform-instrument-dialog-tabs">
                {(["1/4", "1/8", "1/16", "1/8T"] as const).map((r) => (
                  <button
                    className={`ui-pill-btn${arpeggiatorSettings.rate === r ? " ui-pill-btn-active" : ""}`}
                    key={r}
                    onClick={() => setArpeggiatorSettings((s) => ({ ...s, rate: r }))}
                    type="button"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="perform-settings-dialog-row">
              <div className="perform-settings-dialog-section">
                <span className="perform-instrument-dialog-title">ARP — Gate</span>
                <div className="perform-settings-gate-row">
                  <input
                    className="perform-settings-gate-input"
                    max={1}
                    min={0.05}
                    onChange={(e) =>
                      setArpeggiatorSettings((s) => ({ ...s, gate: parseFloat(e.target.value) }))
                    }
                    step={0.05}
                    type="range"
                    value={arpeggiatorSettings.gate}
                  />
                  <span className="perform-settings-gate-value">
                    {Math.round(arpeggiatorSettings.gate * 100)}%
                  </span>
                </div>
              </div>

              <div className="perform-settings-dialog-section">
                <span className="perform-instrument-dialog-title">ARP — Octavas</span>
                <div className="perform-instrument-dialog-tabs">
                  {([1, 2, 3] as const).map((oct) => (
                    <button
                      className={`ui-pill-btn${arpeggiatorSettings.octaveRange === oct ? " ui-pill-btn-active" : ""}`}
                      key={oct}
                      onClick={() => setArpeggiatorSettings((s) => ({ ...s, octaveRange: oct }))}
                      type="button"
                    >
                      {oct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="perform-settings-latch-row">
              <input
                checked={arpeggiatorSettings.latch}
                onChange={(e) =>
                  setArpeggiatorSettings((s) => ({ ...s, latch: e.target.checked }))
                }
                type="checkbox"
              />
              <span className="perform-instrument-dialog-title" style={{ marginBottom: 0 }}>ARP Latch</span>
            </label>
          </div>
        </AppDialog>

        <aside className="perform-workspace-secondary perform-workspace-secondary-hidden">
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Proyecto</span>
                <h3>{project.name}</h3>
              </div>
            </div>
            <p className="app-surface-note">{projectMessage || "Listo para tocar y grabar."}</p>
          </section>

          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">SMC Pad</span>
                <h3>Percusion rapida</h3>
              </div>
            </div>
            {performPad}
          </section>

          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Acciones</span>
                <h3>Transporte y toma</h3>
              </div>
            </div>
            {performActions}
          </section>

          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">MIDI</span>
                <h3>Actividad reciente</h3>
              </div>
            </div>
            {performMidiLog}
          </section>
        </aside>
      </>
    )
  }

  if (false) {
    return (
      <>
        <section className="perform-workspace-primary" aria-label="Panel principal Perform">
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Interpretacion</span>
                <h3>{primaryTrack.name}</h3>
              </div>
              <span className="app-surface-status">
                {recordingState === "recording" ? "Grabando" : "Listo"}
              </span>
            </div>
            <p className="app-surface-note">
              Modo {pianoMode === "note" ? "nota" : "acorde"} · Octava {previewOctave}
            </p>
          </section>

          <section className="perform-workspace-card">
            <div className="perform-mode-track-strip">
              <button
                aria-label="Pista anterior"
                disabled={midiTracks[0]?.id === primaryTrack.id}
                onClick={() => switchTrackByOffset(-1)}
                type="button"
              >
                ←
              </button>
              <div className="perform-mode-track-display">
                <span>Track activa</span>
                <strong>{primaryTrack.name}</strong>
              </div>
              <button
                aria-label="Pista siguiente"
                disabled={midiTracks.at(-1)?.id === primaryTrack.id}
                onClick={() => switchTrackByOffset(1)}
                type="button"
              >
                →
              </button>
              <div className="perform-mode-octave-pill" aria-label="Octava visible activa">
                <span>Octava</span>
                <strong>{previewOctave}</strong>
              </div>
              <button onClick={addTrack} type="button">
                + Track
              </button>
            </div>
          </section>

          <section className="perform-workspace-card">
            <div className="perform-mode-track-strip">
              <button
                aria-label="Bajar octava"
                disabled={previewOctave === previewOctaveOptions[0]}
                onClick={() => stepPreviewOctave(-1)}
                type="button"
              >
                −
              </button>
              <div className="perform-mode-track-display">
                <span>Instrumento</span>
                <strong>{selectedInstrument.name}</strong>
              </div>
              <button
                aria-label="Subir octava"
                disabled={previewOctave === previewOctaveOptions.at(-1)}
                onClick={() => stepPreviewOctave(1)}
                type="button"
              >
                +
              </button>
              <div className="perform-mode-octave-pill" aria-label="Nota seleccionada activa">
                <span>Nota</span>
                <strong>{selectedNote}</strong>
              </div>
              <button onClick={playTestNote} type="button">
                Tocar
              </button>
            </div>
          </section>

          <section className="perform-workspace-card">
            {performControls}
          </section>

          <section className="perform-workspace-card">
            {performPiano}
          </section>
        </section>

        <aside className="perform-workspace-secondary">
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Proyecto</span>
                <h3>{project.name}</h3>
              </div>
            </div>
            <p className="app-surface-note">{projectMessage || "Listo para tocar y grabar."}</p>
          </section>

          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">SMC Pad</span>
                <h3>Percusion rapida</h3>
              </div>
            </div>
            {performPad}
          </section>

          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Acciones</span>
                <h3>Transporte y toma</h3>
              </div>
            </div>
            {performActions}
          </section>

          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">MIDI</span>
                <h3>Actividad reciente</h3>
              </div>
            </div>
            {performMidiLog}
          </section>
        </aside>
      </>
    )
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

        <input
          accept=".json,application/json"
          hidden
          onChange={importProjectFile}
          ref={importInputRef}
          type="file"
        />

        {projectPanel}

        {performWorkspace}
        {editWorkspace}
      </section>
    </main>
  )
}

export default LabApp
