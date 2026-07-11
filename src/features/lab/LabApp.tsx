import type { ChangeEvent } from "react"
import { useCallback, useEffect, useState } from "react"
import "../../App.css"
import { resolveAppMessages, tpl, type AppLanguage } from "../../app/appI18n"
import { getBrowserSettingsRepository } from "../../app/browserSettingsRepository"
import { useProjectPerformanceComposition } from "../../app/useProjectPerformanceComposition"
import {
  loadPluginClip,
  processPluginAudioOutput,
  storePluginClip,
} from "../../application/use-cases/pluginAudioOutputs"
import {
  updatePadSoundSetting,
  getMidiTracks,
  getSamplerTracks,
  getAudioClipTracks,
  renameSamplerMix,
  removeSamplerMix,
  removeTrack,
  renameTrack,
  bakeOrReplaceTrackNotes,
  resetTrackClips,
  toggleStepNoteInTrack,
  updateTrackVolume,
  updateTrackPan,
  type MusicalProject,
} from "../../engine/project/projectModel"
import {
  Play,
  Square,
  Trash2,
  Undo2,
  Redo2,
  Copy,
  RotateCcw,
  Check,
  VolumeX,
  Minus,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import {
  getInstrumentCategoryDescription,
  getInstrumentCategoryLabel,
  type MathematicalInstrument,
} from "../../engine/audio/mathematicalInstruments"
import {
  isSmcPadRecordedNote,
} from "../../engine/midi/events"
import { MidiEventLog } from "../midi-events/MidiEventLog"
import { PianoPreview } from "../piano/PianoPreview"
import { MelodicStepSequencer } from "../step-sequencer/MelodicStepSequencer"
import {
  useMelodicSequencer,
  STEP_COUNT_OPTIONS,
  STEP_SUBDIVISION_OPTIONS,
  calcStepDurationSec,
} from "../step-sequencer/useMelodicSequencer"
import { PadBeatsSequencer } from "../pad-sequencer/PadBeatsSequencer"
import { usePadBeats } from "../pad-sequencer/usePadBeats"
import { MiniSmcPad } from "../smc-pad/MiniSmcPad"
import { TrackTimelinePreview } from "../timeline/TrackTimelinePreview"
import { TimelinePreview } from "../timeline/TimelinePreview"
import { AppDialog } from "../../app/components/AppDialog"
import { PerformResponsiveToolbar, type PianoViewMode } from "../perform/components/PerformResponsiveToolbar"
import { LabActions } from "./LabActions"
import { LabNoteEditor } from "./LabNoteEditor"
import { LabProjectPanel } from "./LabProjectPanel"
import { LabSoundControls } from "./LabSoundControls"
import {
  getSmcPadSoundDescriptor,
  PAD_SOUND_DEFAULTS,
  smcPadSounds,
  type PadSoundParams,
  type SmcPadSoundId,
} from "../../application/use-cases/playSmcPadHit"
import type { LabAppMode } from "./useLabProject"
import { useLabProject } from "./useLabProject"
import { useLabPlayback } from "./useLabPlayback"
import { previewOctaveOptions, type Octave } from "../../engine/midi/notes"
import { ensureAudioReady } from "../../engine/audio/audioEngine"
import { playNote, stopNote } from "../../application/use-cases/playNote"
import { saveFile } from "../../application/use-cases/saveFile"
import {
  loadLabPadViewModeWithRepository,
  loadLabActiveStepsTrackIdWithRepository,
  loadLabPianoViewModeWithRepository,
  loadLabSeqBpmWithRepository,
  loadLabSeqSubdivisionWithRepository,
  saveLabPadViewModeWithRepository,
  saveLabActiveStepsTrackIdWithRepository,
  saveLabPianoViewModeWithRepository,
  saveLabSeqBpmWithRepository,
  saveLabSeqSubdivisionWithRepository,
  resetLabProjectViewPreferencesWithRepository,
  type LabPadViewMode,
  type LabStepSubdivision,
} from "../../application/use-cases/labViewPreferences"
import { useExternalPlugins } from "../plugins-view/useExternalPlugins"
import { PluginSlot } from "../plugins-view/PluginSlot"
import { PluginWorkspaceView } from "../plugins-view/PluginWorkspaceView"
import { usePluginWorkspaceNotification } from "../plugins-view/usePluginWorkspaceNotification"
import { handlePluginWorkspaceOutput } from "../plugins-view/pluginWorkspaceOutputs"
import { getPluginWorkspaceTracks } from "../plugins-view/pluginWorkspaceTracks"
import { getPluginWorkspaceBpm } from "../plugins-view/pluginWorkspaceTempo"
import { usePluginWorkspaceNotePreview } from "../plugins-view/usePluginWorkspaceNotePreview"
import { createPluginWorkspaceClipStorage } from "../plugins-view/pluginWorkspaceClipStorage"
import { usePluginWorkspaceAPI } from "../plugins-view/usePluginWorkspaceAPI"
import { PluginsCatalogList } from "../plugins-view/PluginsCatalogList"
import {
  PluginsCatalogDevelopmentTools,
  PluginsCatalogImportToolbar,
} from "../plugins-view/PluginsCatalogToolbar"
import {
  installPluginCatalogFile,
  installPluginCatalogFolder,
  uninstallPluginCatalogEntry,
} from "../plugins-view/pluginCatalogActions"
import { createProjectFeatureComposition } from "../project-view/projectFeatureComposition"
import { createProjectFeatureFileImportHandlers } from "../project-view/projectFeatureFileImportHandlers"
import { LocalizedProjectFeatureView } from "../project-view/LocalizedProjectFeatureView"
import { EditTimelineToolbar } from "../edit/EditTimelineToolbar"
import { EditTrackNameInput } from "../edit/EditTrackNameInput"
import { useEditTimelineView } from "../edit/useEditTimelineView"

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

type LabAppProps = {
  language?: AppLanguage
  mode?: LabAppMode
  onOpenPlugin?: (pluginId: string) => void
  pluginId?: string
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

function LabApp({ language = "es", mode = "full", onOpenPlugin, pluginId, settingsOpen = false, onSettingsClose }: LabAppProps) {
  const t = resolveAppMessages(language).lab
  const settingsRepository = getBrowserSettingsRepository()
  // ── Simple local UI state ────────────────────────────────────────────────────
  const [timelineSnapEnabled, setTimelineSnapEnabled] = useState(false)
  const [timelineSnapStep, setTimelineSnapStep] = useState(0.1)
  const [, setIsTimelineDragging] = useState(false)
  const [isTrackLaneFocused, setIsTrackLaneFocused] = useState(false)
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null)
  const [isMixDeleteConfirmOpen, setIsMixDeleteConfirmOpen] = useState(false)
  const [selectedClipId, setSelectedClipId] = useState<{
    trackId: string
    clipId: string
    type: "midi" | "sampler"
  } | null>(null)
  const [isClipDeleteConfirmOpen, setIsClipDeleteConfirmOpen] = useState(false)
  const [activeSamplerPadId, setActiveSamplerPadId] = useState<SmcPadSoundId | null>(null)
  const [padPage, setPadPage] = useState(0)
  const [padViewMode, setPadViewMode] = useState<LabPadViewMode>(() =>
    loadLabPadViewModeWithRepository(settingsRepository),
  )
  const [configSoundId, setConfigSoundId] = useState<SmcPadSoundId | null>(null)
  const [isInstrumentDialogOpen, setIsInstrumentDialogOpen] = useState(false)
  const [activeStepsTrackId, setActiveStepsTrackId] = useState<string | null>(() =>
    loadLabActiveStepsTrackIdWithRepository(settingsRepository)
  )
  const [pianoViewMode, setPianoViewMode] = useState<PianoViewMode>(() => {
    return loadLabPianoViewModeWithRepository(settingsRepository)
  })
  const [seqBpm, setSeqBpm] = useState<number>(() =>
    loadLabSeqBpmWithRepository(settingsRepository),
  )
  const [seqStepSubdivision, setSeqStepSubdivision] = useState<LabStepSubdivision>(() =>
    loadLabSeqSubdivisionWithRepository(settingsRepository),
  )
  const [instrumentDialogCategory, setInstrumentDialogCategory] = useState<
    MathematicalInstrument["category"]
  >("base")
  const pluginWorkspaceNotification = usePluginWorkspaceNotification()

  // ── Core hooks ───────────────────────────────────────────────────────────────
  const lab = useLabProject({ mode, timelineSnapEnabled, timelineSnapStep })

  const labPlayback = useLabPlayback({ project: lab.project })

  const {
    instrumentCatalog,
    performance: labPerform,
    recording: labRecording,
  } = useProjectPerformanceComposition({
    projectSession: lab,
  })

  // Busca por ID; si no existe aún (recarga, proyecto nuevo), cae al primero
  const activeStepsTrack =
    lab.stepsTracks.find(t => t.id === activeStepsTrackId) ??
    lab.stepsTracks[0] ??
    null

  const activeStepsClipNotes = activeStepsTrack?.clips[0]?.notes ?? []

  // 7 notas naturales (sin sostenidos) — más legible en móvil y en grilla
  const stepSequencerNotes = labPerform.visibleNotes.filter(n => !n.includes("#"))

  const melodicSequencer = useMelodicSequencer({
    notes: stepSequencerNotes,
    playOptions: labPerform.basePreviewPlayOptions,
    bpm: seqBpm,
    stepSubdivision: seqStepSubdivision,
    clipNotes: activeStepsClipNotes,
    settingsRepository,
    onToggleStep: (row, col) => {
      if (!activeStepsTrack) return
      const note = stepSequencerNotes[stepSequencerNotes.length - 1 - row]
      if (!note) return
      lab.applyUpdate(p =>
        toggleStepNoteInTrack(p, activeStepsTrack.id, note, col, seqBpm, activeStepsTrack.instrumentId, seqStepSubdivision),
      )
    },
    onClearAll: () => {
      if (!activeStepsTrack) return
      lab.applyUpdate(p => resetTrackClips(p, activeStepsTrack.id))
    },
  })

  // ── Pad beats sequencer ──────────────────────────────────────────────────────
  const padBeatsClipNotes = lab.primaryTrack.trackType === "percussion"
    ? (lab.primaryTrack.clips[0]?.notes ?? [])
    : []

  const padBeats = usePadBeats({
    sounds: smcPadSounds,   // todos los 16 sonidos en beats mode
    bpm: seqBpm,
    stepSubdivision: seqStepSubdivision,
    clipNotes: padBeatsClipNotes,
    padSoundSettings: lab.project.padSoundSettings,
    onToggleStep: (row, col) => {
      const sound = smcPadSounds[row]
      if (!sound || lab.primaryTrack.trackType !== "percussion") return
      lab.applyUpdate(p =>
        toggleStepNoteInTrack(p, lab.primaryTrack.id, sound.note, col, seqBpm, lab.primaryTrack.instrumentId, seqStepSubdivision),
      )
    },
    onClearAll: () => {
      if (lab.primaryTrack.trackType !== "percussion") return
      lab.applyUpdate(p => resetTrackClips(p, lab.primaryTrack.id))
    },
  })

  // ── Derived from instrument catalog ──────────────────────────────────────────
  const {
    activeInstrumentCategory,
    availableInstruments,
    instrumentCategories,
    selectedInstrument,
    visibleInstruments,
  } = instrumentCatalog

  const visibleInstrumentOptions = visibleInstruments.map((instrument) => {
    const plugin = lab.getPluginForInstrument(instrument.id)
    return {
      id: instrument.id,
      name: `${instrument.name} (${getInstrumentCategoryLabel(instrument.category)} · ${plugin ? plugin.name : "Core"})`,
    }
  })

  const dialogVisibleInstruments = availableInstruments
    .filter((i) => i.category === instrumentDialogCategory)
    .map((i) => {
      const plugin = lab.getPluginForInstrument(i.id)
      return { ...i, sourceLabel: plugin ? plugin.name : "Core" }
    })

  // ── Timeline view effects ────────────────────────────────────────────────────
  const clearTrackLaneFocus = useCallback(() => {
    setIsTrackLaneFocused(false)
    setSelectedClipId(null)
  }, [])
  const { timelineView, setTimelineView } = useEditTimelineView({
    hasNoTracks: lab.hasNoTracks,
    onLeaveTracksView: clearTrackLaneFocus,
  })

  // ── Plugin hooks (must be before any early return) ──────────────────────────
  const externalPlugins = useExternalPlugins()
  const pluginNotePreview = usePluginWorkspaceNotePreview({
    instruments: instrumentCatalog.availableInstruments,
    startVoice: (note, duration, options) =>
      playNote(note as Parameters<typeof playNote>[0], duration, options),
    stopVoice: stopNote,
  })
  const pluginClipStorage = createPluginWorkspaceClipStorage({
    loadClip: loadPluginClip,
    storeClip: storePluginClip,
  })

  const pluginApi = usePluginWorkspaceAPI({
    audio: {
      playNote: pluginNotePreview.playNote,
      stopNote: pluginNotePreview.stopNote,
      triggerPad: (padId, velocity = 1) =>
        labPerform.triggerSmcPad(padId as SmcPadSoundId, velocity),
    },
    notify: pluginWorkspaceNotification.notify,
    project: {
      bpm: getPluginWorkspaceBpm(lab.project.timeline),
      getTracks: () => getPluginWorkspaceTracks(lab.project.timeline),
    },
    session: {
      loadClip: pluginClipStorage.loadClip,
      receivePluginOutput: (output) => {
        void handlePluginWorkspaceOutput(
          {
            applyProjectUpdate: lab.applyUpdate,
            notifySamplerSlotsChanged: () => {
              window.dispatchEvent(new StorageEvent("storage", {
                key: "mimidi-audio-slots",
                storageArea: localStorage,
              }))
            },
            processAudioOutput: processPluginAudioOutput,
            saveFile,
          },
          output,
        )
      },
      storeClip: pluginClipStorage.storeClip,
    },
    transport: {
      isPlaying: labPlayback.playbackTransport.isPlaying,
      isRecording: labRecording.recordingState === "recording",
    },
  })

  // ── Coordinators: sequences that span multiple hooks ─────────────────────────
  function switchActiveTrack(trackId: string) {
    labPerform.stopArpeggiator()
    lab.switchActiveTrack(trackId)
  }

  function startRecording() {
    labPlayback.stopAll()
    labPerform.stopArpeggiator()
    labRecording.startRecording()
  }

  function tearDownSession() {
    labPlayback.stopAll()
    labPerform.stopArpeggiator()
    labRecording.resetRecordingSession()
    labPerform.clearMidiEvents()
  }

  function handleClearSession() {
    tearDownSession()
    lab.clearSession()
  }

  async function handleRestartProject() {
    tearDownSession()
    melodicSequencer.stop()
    resetLabProjectViewPreferencesWithRepository(settingsRepository, {
      clearActiveStepsTrack: () => setActiveStepsTrackId(null),
      resetPianoViewMode: () => setPianoViewMode("keys"),
    })
    await lab.restartProject()
  }

  function handleExportProjectAudio() {
    void lab.exportProjectAudio(labPerform.volume)
  }

  // ── Bridge functions (span multiple hooks) ───────────────────────────────────
  function selectTrackLane(trackId: string) {
    switchActiveTrack(trackId)
    setSelectedLaneId(null)
    setIsTrackLaneFocused(true)
  }

  function selectLane(laneId: string) {
    setSelectedLaneId(laneId)
    setIsTrackLaneFocused(true)
  }

  function exitTrackLaneFocus() {
    setSelectedClipId(null)
    setSelectedLaneId(null)
    setIsTrackLaneFocused(false)
  }

  function setActiveStepsTrack(id: string) {
    setActiveStepsTrackId(id)
    saveLabActiveStepsTrackIdWithRepository(settingsRepository, id)
  }

  // Auto-crear STEPS 1 si la app carga en modo steps sin pistas existentes
  useEffect(() => {
    if (pianoViewMode !== "steps" || lab.stepsTracks.length > 0) return
    lab.addStepsTrack()
    const newId = lab.lastCreatedStepsTrackIdRef.current
    if (newId) setActiveStepsTrack(newId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pianoViewMode, lab.stepsTracks.length])

  // Detener reproducción al cambiar de steps track
  useEffect(() => {
    melodicSequencer.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStepsTrackId])

  function handleSetPianoViewMode(mode: PianoViewMode) {
    if (mode === "steps") {
      if (labRecording.recordingState === "recording") labRecording.stopRecording()
      if (lab.stepsTracks.length === 0) {
        lab.addStepsTrack()
        const newId = lab.lastCreatedStepsTrackIdRef.current
        if (newId) setActiveStepsTrack(newId)
      } else if (!activeStepsTrack) {
        setActiveStepsTrack(lab.stepsTracks[0].id)
      }
    }
    if (mode === "keys") melodicSequencer.stop()
    setPianoViewMode(mode)
    saveLabPianoViewModeWithRepository(settingsRepository, mode)
  }

  function handleSetPadViewMode(mode: LabPadViewMode) {
    if (mode === "pads") padBeats.stop()
    setPadViewMode(mode)
    saveLabPadViewModeWithRepository(settingsRepository, mode)
  }

  function handleAddStepsTrack() {
    lab.addStepsTrack()
    // El ref se popula síncronamente dentro del updater de setState
    const newId = lab.lastCreatedStepsTrackIdRef.current
    if (newId) setActiveStepsTrack(newId)
  }

  function handleStepsTrackByOffset(offset: -1 | 1) {
    const tracks = lab.stepsTracks
    const idx = tracks.findIndex(t => t.id === activeStepsTrack?.id)
    const next = tracks[Math.max(0, Math.min(tracks.length - 1, idx + offset))]
    if (next) setActiveStepsTrack(next.id)
  }

  function handleRemoveStepsTrack() {
    if (!activeStepsTrack || lab.stepsTracks.length <= 1) return
    const tracks = lab.stepsTracks
    const idx = tracks.findIndex(t => t.id === activeStepsTrack.id)
    const nextIdx = idx === 0 ? 1 : idx - 1
    const next = tracks[nextIdx]
    lab.removeStepsTrack(activeStepsTrack.id)
    if (next) setActiveStepsTrack(next.id)
  }

  function handleBakeStepsToTrack() {
    if (!activeStepsTrack || activeStepsClipNotes.length === 0) return
    lab.applyUpdate((p) => {
      const [updated] = bakeOrReplaceTrackNotes(
        p,
        activeStepsTrack.name,
        activeStepsTrack.instrumentId,
        activeStepsClipNotes,
      )
      return updated
    })
    lab.setProjectMessage(`Patrón "${activeStepsTrack.name}" enviado al timeline.`)
  }

  function handleSetSeqBpm(bpm: number) {
    const clamped = saveLabSeqBpmWithRepository(settingsRepository, bpm)
    setSeqBpm(clamped)
  }

  function handleSetSeqSubdivision(subdivision: LabStepSubdivision) {
    setSeqStepSubdivision(subdivision)
    saveLabSeqSubdivisionWithRepository(settingsRepository, subdivision)
  }

  function openInstrumentDialog() {
    setInstrumentDialogCategory(activeInstrumentCategory)
    setIsInstrumentDialogOpen(true)
  }

  function closeInstrumentDialog() {
    setIsInstrumentDialogOpen(false)
  }

  const canDeleteSelectedClip = (() => {
    if (!selectedClipId) return false
    if (selectedClipId.type === "midi") {
      const track = getMidiTracks(lab.project.timeline).find(
        (t) => t.id === selectedClipId.trackId,
      )
      return (track?.clips.length ?? 0) > 1
    }
    const mix = getSamplerTracks(lab.project.timeline).find(
      (m) => m.id === selectedClipId.trackId,
    )
    return (mix?.clips.length ?? 0) > 1
  })()

  function confirmDeleteSelectedClip() {
    if (!selectedClipId) return
    if (selectedClipId.type === "midi") {
      lab.removeMidiClipHandler(selectedClipId.trackId, selectedClipId.clipId)
    } else {
      lab.removeSamplerClipHandler(selectedClipId.trackId, selectedClipId.clipId)
    }
    setSelectedClipId(null)
    setIsClipDeleteConfirmOpen(false)
  }

  // ── Shared playback shortcuts ────────────────────────────────────────────────
  const editNotesToPlay: MusicalProject =
    timelineView === "notes" ? { ...lab.project, timeline: [lab.primaryTrack] } : lab.project

  const editSettingsDuration =
    timelineView === "notes"
      ? lab.primaryTrack.noteTimelineDuration
      : lab.project.trackTimelineDuration

  const isNoteEditMode =
    mode === "edit-only" && timelineView === "notes" && !!lab.selectedRecordedNote

  const editTrackNameControl = timelineView === "tracks"
    ? (() => {
        const activeSamplerTrack = selectedLaneId
          ? getSamplerTracks(lab.project.timeline).find((m) => m.id === selectedLaneId)
          : null
        const activeAudioTrack = !activeSamplerTrack && selectedLaneId
          ? getAudioClipTracks(lab.project.timeline).find((t) => t.id === selectedLaneId)
          : null
        return activeSamplerTrack ? (
          <EditTrackNameInput
            key={activeSamplerTrack.id}
            label={t.toolbar.mixName}
            name={activeSamplerTrack.name}
            onNameCommit={(value) => {
              const name = value.trim()
              if (name) lab.applyUpdate((p) => renameSamplerMix(p, activeSamplerTrack.id, name))
            }}
          />
        ) : activeAudioTrack ? (
          <EditTrackNameInput
            key={activeAudioTrack.id}
            label={t.toolbar.activeTrackName}
            name={activeAudioTrack.name}
            onNameCommit={(value) => {
              const name = value.trim()
              if (name) lab.applyUpdate((p) => renameTrack(p, activeAudioTrack.id, name))
            }}
          />
        ) : lab.hasNoTracks ? (
          <button
            className="ui-icon-btn"
            onClick={lab.addTrack}
            style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem", borderRadius: "999px" }}
            title={t.toolbar.addMidiTrackTitle}
            type="button"
          >
            {t.toolbar.addMidiTrack}
          </button>
        ) : (
          <EditTrackNameInput
            key={lab.primaryTrack.id}
            label={t.toolbar.activeTrackName}
            name={lab.primaryTrack.name}
            onNameCommit={lab.updateTrackName}
          />
        )
      })()
    : null

  const editNoteControls =
    mode === "edit-only" && timelineView === "notes" && lab.selectedRecordedNote ? (
      <>
        <span className="edit-note-chip">{lab.selectedRecordedNote.note}</span>
        <input
          aria-label={t.toolbar.noteStart}
          className="edit-note-input"
          min="0"
          step="0.01"
          type="number"
          value={lab.selectedRecordedNote.startTime.toFixed(2)}
          onChange={(e) => lab.updateSelectedNoteStartTime(Number(e.target.value))}
        />
        <input
          aria-label={t.toolbar.noteDuration}
          className="edit-note-input"
          disabled={isSmcPadRecordedNote(lab.selectedRecordedNote)}
          min="0.01"
          step="0.01"
          type="number"
          value={lab.selectedRecordedNote.duration.toFixed(2)}
          onChange={(e) => lab.updateSelectedNoteDuration(Number(e.target.value))}
        />
        <button
          className="ui-icon-btn"
          onClick={lab.duplicateSelectedRecordedNote}
          title={t.toolbar.duplicateNote}
          type="button"
        >
          <Copy size={15} />
        </button>
        <button
          className="ui-icon-btn"
          onClick={lab.revertSelectedNoteToLastCommit}
          title={t.toolbar.revertNote}
          type="button"
        >
          <RotateCcw size={15} />
        </button>
        <button
          aria-label={t.toolbar.confirmEdit}
          className="ui-icon-btn"
          onClick={() => lab.setSelectedRecordedNoteId(null)}
          title={t.common.done}
          type="button"
        >
          <Check size={16} />
        </button>
      </>
    ) : null

  // ────────────────────────────────────────────────────────────────────────────
  // ── edit-only workspace ──────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const editWorkspace = (
    <section className="timeline-workspace" aria-label={t.toolbar.timelineWorkspace}>
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-controls">
          <EditTimelineToolbar
            activeTrackId={lab.primaryTrack.id}
            activeTrackSelectLabel={t.toolbar.selectTrack}
            addMidiTrackDisabledTitle={t.toolbar.addMidiTrackDisabled}
            hasNoTracks={lab.hasNoTracks}
            isNoteEditMode={isNoteEditMode}
            noteEditControls={editNoteControls}
            notesLabel={t.toolbar.viewNotes}
            onTimelineViewChange={setTimelineView}
            onTrackChange={switchActiveTrack}
            timelineView={timelineView}
            trackNameControl={editTrackNameControl}
            tracks={lab.midiTracks.filter(t => t.trackType !== "steps")}
            tracksLabel={t.toolbar.viewTracks}
          />
          {!isNoteEditMode && (
            <>
              <span aria-hidden="true" className="perform-mode-transport-divider" />
              <button
                aria-label={
                  labPlayback.playbackTransport.isPlaying ? t.common.stopPlayback : t.common.play
                }
                className="ui-icon-btn"
                disabled={
                  lab.allRecordedNotes.length === 0 &&
                  getSamplerTracks(lab.project.timeline).length === 0 &&
                  getAudioClipTracks(lab.project.timeline).length === 0 &&
                  !labPlayback.playbackTransport.isPlaying &&
                  !labPlayback.isMixOnlyPlaying
                }
                onClick={() =>
                  labPlayback.playbackTransport.isPlaying || labPlayback.isMixOnlyPlaying
                    ? labPlayback.stopAll()
                    : labPlayback.playAll(editNotesToPlay, timelineView === "tracks")
                }
                title={labPlayback.playbackTransport.isPlaying ? t.common.stop : t.common.play}
                type="button"
              >
                {labPlayback.playbackTransport.isPlaying || labPlayback.isMixOnlyPlaying ? (
                  <Square size={18} />
                ) : (
                  <Play size={18} />
                )}
              </button>
            </>
          )}
          <span aria-hidden="true" className="perform-mode-transport-divider" />

          <label className="perform-mode-arp-toggle" aria-label={t.toolbar.snapToStep}>
            <input
              checked={timelineSnapEnabled}
              className="ui-checkbox"
              onChange={(e) => setTimelineSnapEnabled(e.target.checked)}
              type="checkbox"
            />
            <span>{t.toolbar.snap}</span>
          </label>
          {timelineSnapEnabled && (
            <select
              aria-label={t.toolbar.snapStep}
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

          {mode === "edit-only" &&
            !isNoteEditMode &&
            !(timelineView === "tracks" && isTrackLaneFocused) && (
              <>
                <button
                  aria-label={t.toolbar.reduceDuration}
                  className="ui-icon-btn"
                  onClick={() => {
                    const next = Math.max(1, Number((editSettingsDuration - 0.1).toFixed(2)))
                    if (timelineView === "notes")
                      lab.updatePrimaryTrackNoteTimelineDurationValue(next)
                    else lab.updateProjectTrackTimelineDurationValue(next)
                  }}
                  title={t.toolbar.reduceDurationStep}
                  type="button"
                >
                  <Minus size={18} />
                </button>
                <span className="edit-duration-label">{editSettingsDuration.toFixed(1)}s</span>
                <button
                  aria-label={t.toolbar.increaseDuration}
                  className="ui-icon-btn"
                  onClick={() => {
                    const next = Number((editSettingsDuration + 0.1).toFixed(2))
                    if (timelineView === "notes")
                      lab.updatePrimaryTrackNoteTimelineDurationValue(next)
                    else lab.updateProjectTrackTimelineDurationValue(next)
                  }}
                  title={t.toolbar.increaseDurationStep}
                  type="button"
                >
                  <Plus size={18} />
                </button>
              </>
            )}
          {!(timelineView === "tracks" && isTrackLaneFocused) && (
            <>
              <span aria-hidden="true" className="perform-mode-transport-divider" />
              <button
                aria-label={t.common.undo}
                className="ui-icon-btn"
                disabled={!lab.canUndo}
                onClick={lab.undoProjectEdit}
                title={t.common.undo}
                type="button"
              >
                <Undo2 size={18} />
              </button>
              <button
                aria-label={t.common.redo}
                className="ui-icon-btn"
                disabled={!lab.canRedo}
                onClick={lab.redoProjectEdit}
                title={t.common.redo}
                type="button"
              >
                <Redo2 size={18} />
              </button>
            </>
          )}
          {timelineView === "notes" && (
            <button
              aria-label={t.toolbar.deleteSelectedNote}
              className="ui-icon-btn"
              disabled={!lab.selectedRecordedNote}
              onClick={() =>
                lab.selectedRecordedNote && lab.removeRecordedNote(lab.selectedRecordedNote.id)
              }
              title={t.toolbar.deleteNote}
              type="button"
            >
              <Trash2 size={18} />
            </button>
          )}
          {timelineView === "tracks" &&
            isTrackLaneFocused &&
            (() => {
              const activeSamplerTrack = selectedLaneId
                ? getSamplerTracks(lab.project.timeline).find((m) => m.id === selectedLaneId)
                : null
              const activeAudioTrack = !activeSamplerTrack && selectedLaneId
                ? getAudioClipTracks(lab.project.timeline).find((t) => t.id === selectedLaneId)
                : null
              const lastMixClip = activeSamplerTrack?.clips.at(-1)
              const dupDisabled = activeSamplerTrack ? !lastMixClip : activeAudioTrack ? true : !lab.activeClip
              const isMuted = activeSamplerTrack ? activeSamplerTrack.muted : activeAudioTrack ? activeAudioTrack.muted : lab.primaryTrack.muted
              const isSolo = activeSamplerTrack ? (activeSamplerTrack.solo ?? false) : activeAudioTrack ? false : lab.primaryTrack.solo
              return (
                <>
                  <span aria-hidden="true" className="perform-mode-transport-divider" />
                  <button
                    aria-label={isMuted ? t.common.unmute : t.common.mute}
                    className={`ui-icon-btn edit-mute-solo-btn${isMuted ? " edit-mute-solo-btn-active" : ""}`}
                    onClick={() => {
                      if (activeSamplerTrack) {
                        lab.updateSamplerTrackMutedHandler(activeSamplerTrack.id, !activeSamplerTrack.muted)
                      } else if (activeAudioTrack) {
                        lab.updateAudioClipTrackMutedHandler(activeAudioTrack.id, !activeAudioTrack.muted)
                      } else {
                        lab.togglePrimaryTrackMuted()
                      }
                    }}
                    title={isMuted ? t.common.unmute : t.common.mute}
                    type="button"
                  >
                    <VolumeX size={18} />
                  </button>
                  <button
                    aria-label={t.common.solo}
                    className={`ui-icon-btn edit-mute-solo-btn${isSolo ? " edit-mute-solo-btn-active" : ""}`}
                    disabled={!!activeAudioTrack}
                    onClick={() => {
                      if (activeSamplerTrack) {
                        lab.updateSamplerTrackSoloHandler(activeSamplerTrack.id, !isSolo)
                      } else if (!activeAudioTrack) {
                        lab.togglePrimaryTrackSolo()
                      }
                    }}
                    title={t.common.solo}
                    type="button"
                  >
                    {t.common.solo}
                  </button>
                  <button
                    aria-label={t.toolbar.duplicateClip}
                    className="ui-icon-btn"
                    disabled={dupDisabled}
                    onClick={() => {
                      if (activeSamplerTrack && lastMixClip) {
                        lab.duplicateSamplerClipHandler(activeSamplerTrack.id, lastMixClip.id)
                      } else if (!activeAudioTrack && lab.activeClip) {
                        lab.duplicateMidiClipHandler(lab.primaryTrack.id, lab.activeClip.id)
                      }
                    }}
                    title={
                      activeSamplerTrack
                        ? tpl(t.toolbar.duplicateClipFrom, { name: activeSamplerTrack.name })
                        : activeAudioTrack
                          ? tpl(t.toolbar.duplicateClipFrom, { name: activeAudioTrack.name })
                          : tpl(t.toolbar.duplicateClipFrom, { name: lab.primaryTrack.name })
                    }
                    type="button"
                  >
                    <Copy size={18} />
                  </button>
                  {!activeAudioTrack && (
                  <button
                    aria-label={t.toolbar.deleteClipSelected}
                    className="ui-icon-btn"
                    disabled={!canDeleteSelectedClip}
                    onClick={() => setIsClipDeleteConfirmOpen(true)}
                    title={
                      selectedClipId
                        ? t.toolbar.deleteClipSelected
                        : t.toolbar.deleteClipHint
                    }
                    type="button"
                  >
                    <X size={18} />
                  </button>
                  )}
                  <button
                    aria-label={activeSamplerTrack ? t.toolbar.deleteMix : t.toolbar.deleteTrack}
                    className="ui-icon-btn"
                    onClick={() => {
                      if (activeSamplerTrack || activeAudioTrack) {
                        setIsMixDeleteConfirmOpen(true)
                      } else {
                        lab.confirmRemoveActiveTrack()
                      }
                    }}
                    title={
                      activeSamplerTrack
                        ? tpl(t.toolbar.deleteMixFromTimeline, { name: activeSamplerTrack.name })
                        : activeAudioTrack
                          ? tpl(t.toolbar.deleteMixFromTimeline, { name: activeAudioTrack.name })
                          : tpl(t.toolbar.deleteTrackNamed, { name: lab.primaryTrack.name })
                    }
                    type="button"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    aria-label={t.toolbar.finishEditingTracks}
                    className="ui-icon-btn"
                    onClick={exitTrackLaneFocus}
                    title={t.common.done}
                    type="button"
                  >
                    <Check size={18} />
                  </button>
                </>
              )
            })()}
        </div>
        <PluginSlot api={pluginApi} language={language} pluginStates={lab.project.pluginStates} slotId="edit-toolbar" />
      </header>

      {timelineView === "tracks" ? (
        <TrackTimelinePreview
          activeTrackId={lab.primaryTrack.id}
          language={language}
          onDragStateChange={setIsTimelineDragging}
          onRenameMix={(mixId, name) =>
            lab.applyUpdate((p) => renameSamplerMix(p, mixId, name))
          }
          onSelectClip={(info) => {
            setSelectedClipId(info)
            if (info) setIsTrackLaneFocused(true)
          }}
          onSelectLane={selectLane}
          onSelectTrack={selectTrackLane}
          onUpdateMidiClipStartTime={lab.updateMidiClipStartTimeHandler}
          onUpdateSamplerClipStartTime={lab.updateSamplerClipStartTimeHandler}
          onUpdateAudioClipStartTime={lab.updateAudioClipStartTimeHandler}
          playheadTime={labPlayback.absolutePlayheadTime}
          selectedClipId={selectedClipId}
          selectedLaneId={selectedLaneId}
          timeline={lab.project.timeline}
          timelineLength={lab.projectTrackTimelineLength}
        />
      ) : (
        <>
          {mode !== "edit-only" && (
            <LabNoteEditor
              onDuplicateSelectedNote={lab.duplicateSelectedRecordedNote}
              onRevertSelectedNote={lab.revertSelectedNoteToLastCommit}
              onSelectedNoteDurationChange={lab.updateSelectedNoteDuration}
              onSelectedNoteStartTimeChange={lab.updateSelectedNoteStartTime}
              selectedNoteHistoryStatus={lab.selectedNoteHistoryStatus}
              selectedRecordedNote={lab.selectedRecordedNote}
            />
          )}
          <TimelinePreview
            notes={lab.activeClip?.notes ?? []}
            onDragStateChange={setIsTimelineDragging}
            onRemoveSelectedNote={mode !== "edit-only" ? lab.removeRecordedNote : undefined}
            onSelectNote={lab.selectRecordedNote}
            onUpdateNote={lab.updateRecordedNote}
            playheadTime={
              labPlayback.absolutePlayheadTime !== null
                ? labPlayback.absolutePlayheadTime - (lab.activeClip?.startTime ?? 0)
                : null
            }
            selectedNoteId={lab.selectedRecordedNoteId}
            timelineLength={lab.primaryTrackNoteTimelineLength}
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
          description={t.dialogs.editorOptionsDesc}
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title={t.dialogs.editorOptions}
        >
          <div className="control-group" data-tutorial="edit-options-content">
            <label>{timelineView === "notes" ? t.project.noteTimelineDurationShort : t.project.trackTimelineDurationShort} (s)</label>
            <input
              min="1"
              step="0.1"
              type="number"
              value={editSettingsDuration.toFixed(1)}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (timelineView === "notes") lab.updatePrimaryTrackNoteTimelineDurationValue(v)
                else lab.updateProjectTrackTimelineDurationValue(v)
              }}
            />
            <button
              onClick={() => {
                if (timelineView === "notes") lab.resetPrimaryTrackNoteTimelineDuration()
                else lab.resetProjectTrackTimelineDuration()
              }}
              type="button"
            >
              {timelineView === "notes" ? t.project.fitNotesToContent : t.project.fitToContent}
            </button>
          </div>
          {timelineView === "notes" && (
            <div className="control-group">
              <button onClick={lab.compactPrimaryTrackNoteTimelineStart} type="button">
                {t.toolbar.compactNoteStart}
              </button>
            </div>
          )}

          <div className="edit-settings-track-section">
            <span className="perform-instrument-dialog-title">
              {t.toolbar.activeTrack} — {lab.primaryTrack.name}
            </span>
            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="edit-track-volume">
                {t.common.volume}
              </label>
              <input
                id="edit-track-volume"
                max={1}
                min={0}
                onChange={(e) => lab.updatePrimaryTrackVolume(parseFloat(e.target.value))}
                step={0.01}
                type="range"
                value={lab.primaryTrack.volume}
              />
              <span className="edit-settings-track-value">
                {Math.round(lab.primaryTrack.volume * 100)}%
              </span>
            </div>
            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="edit-track-pan">
                Pan
              </label>
              <input
                id="edit-track-pan"
                max={1}
                min={-1}
                onChange={(e) => lab.updatePrimaryTrackPan(parseFloat(e.target.value))}
                step={0.01}
                type="range"
                value={lab.primaryTrack.pan}
              />
              <span className="edit-settings-track-value">
                {lab.primaryTrack.pan === 0
                  ? "C"
                  : lab.primaryTrack.pan > 0
                    ? `R${Math.round(lab.primaryTrack.pan * 100)}`
                    : `L${Math.round(Math.abs(lab.primaryTrack.pan) * 100)}`}
              </span>
            </div>
            <span className="perform-instrument-dialog-title" style={{ marginTop: "0.3rem" }}>
              ADSR
            </span>
            {(["attack", "decay", "sustain", "release"] as const).map((param) => (
              <div className="edit-settings-track-row" key={param}>
                <label className="edit-settings-track-label" htmlFor={`edit-adsr-${param}`}>
                  {param.charAt(0).toUpperCase() + param.slice(1)}
                </label>
                <input
                  id={`edit-adsr-${param}`}
                  max={param === "sustain" ? 1 : 2}
                  min={0.01}
                  onChange={(e) =>
                    lab.updatePrimaryTrackEnvelope(param, parseFloat(e.target.value))
                  }
                  step={0.01}
                  type="range"
                  value={
                    lab.primaryTrack.envelope?.[param] ??
                    (param === "sustain"
                      ? 0.72
                      : param === "attack"
                        ? 0.01
                        : param === "decay"
                          ? 0.12
                          : 0.18)
                  }
                />
                <span className="edit-settings-track-value">
                  {param === "sustain"
                    ? `${Math.round((lab.primaryTrack.envelope?.[param] ?? 0.72) * 100)}%`
                    : `${((lab.primaryTrack.envelope?.[param] ?? 0.01) * 1000).toFixed(0)}ms`}
                </span>
              </div>
            ))}
          </div>
        </AppDialog>

        <AppDialog
          actions={
            <>
              <button onClick={lab.cancelRemoveActiveTrack} type="button">
                {t.common.cancel}
              </button>
              <button
                className="app-dialog-confirm"
                onClick={lab.acceptRemoveActiveTrack}
                type="button"
              >
                {(lab.melodicTracks.length + lab.percussionTracks.length) === 1 ? t.common.reset : t.common.delete}
              </button>
            </>
          }
          description={
            (lab.melodicTracks.length + lab.percussionTracks.length) === 1
              ? t.dialogs.resetTracksMsg
              : t.dialogs.deleteTrackMsg
          }
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={
            (lab.melodicTracks.length + lab.percussionTracks.length) === 1
              ? t.dialogs.resetTracksTitle
              : tpl(t.dialogs.deleteTrackTitle, { name: lab.primaryTrack.name })
          }
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => setIsMixDeleteConfirmOpen(false)} type="button">
                {t.common.cancel}
              </button>
              <button
                className="app-dialog-confirm"
                onClick={() => {
                  const id = selectedLaneId
                  setIsMixDeleteConfirmOpen(false)
                  setSelectedLaneId(null)
                  if (id) {
                    const isSampler = getSamplerTracks(lab.project.timeline).some((m) => m.id === id)
                    lab.applyUpdate((p) => isSampler ? removeSamplerMix(p, id) : removeTrack(p, id))
                  }
                }}
                type="button"
              >
                {t.common.delete}
              </button>
            </>
          }
          description={t.dialogs.deleteMixMsg}
          onClose={() => setIsMixDeleteConfirmOpen(false)}
          open={isMixDeleteConfirmOpen}
          title={t.dialogs.deleteMixTitle}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
                {t.common.cancel}
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  lab.setIsRestartConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                {t.common.reset}
              </button>
            </>
          }
          description={t.dialogs.resetProjectMsg}
          onClose={() => lab.setIsRestartConfirmOpen(false)}
          open={lab.isRestartConfirmOpen}
          title={t.dialogs.resetProjectTitle}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => setIsClipDeleteConfirmOpen(false)} type="button">
                {t.common.cancel}
              </button>
              <button
                className="app-dialog-confirm"
                onClick={confirmDeleteSelectedClip}
                type="button"
              >
                {t.common.delete}
              </button>
            </>
          }
          description={t.dialogs.deleteClipMsg}
          onClose={() => setIsClipDeleteConfirmOpen(false)}
          open={isClipDeleteConfirmOpen}
          title={t.dialogs.deleteClipTitle}
        />
      </>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── project workspace ────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const projectFeatureContract = createProjectFeatureComposition({
    dependencies: {
      exportBundle: lab.exportBundle,
      exportWav: handleExportProjectAudio,
      openBundleImport: () => lab.importBundleRef.current?.click(),
      playProject: () => labPlayback.playAll(lab.project, true),
      restartProject: handleRestartProject,
      setConfirmOpen: lab.setIsNewProjectConfirmOpen,
      stopPlayback: labPlayback.stopAll,
      updateProjectName: lab.updateProjectName,
    },
    project: lab.project,
    status: {
      isExportingAudio: lab.isExportingAudio,
      isMixOnlyPlaying: labPlayback.isMixOnlyPlaying,
      isNewProjectConfirmOpen: lab.isNewProjectConfirmOpen,
      isPlaying: labPlayback.playbackTransport.isPlaying,
    },
  })
  const projectFeatureFileImportHandlers =
    createProjectFeatureFileImportHandlers({
      importBundle: lab.importBundle,
      importProjectFile: lab.importProjectFile,
      tearDownSession,
    })
  if (mode === "project-only") {
    return (
      <LocalizedProjectFeatureView
        fileInputs={{
          bundleInputRef: lab.importBundleRef,
          jsonInputRef: lab.importInputRef,
          onBundleChange: (event) =>
            void projectFeatureFileImportHandlers.importBundle(event),
          onJsonChange: (event) =>
            void projectFeatureFileImportHandlers.importProjectFile(event),
        }}
        language={language}
        projectFeature={projectFeatureContract}
      />
    )
  }

  if (mode === "plugin-workspace") {
    return (
      <PluginWorkspaceView
        api={pluginApi}
        language={language}
        notification={pluginWorkspaceNotification.notification}
        pluginId={pluginId ?? ""}
      />
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── plugins-only ─────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (mode === "plugins-only") {
    const pluginCatalogActionDependencies = {
      installFromFile: externalPlugins.installFromFile,
      installFromFolder: externalPlugins.installFromFolder,
      logError: (context: string, error: unknown) =>
        console.error(context, error),
      setPluginEnabled: (pluginId: string, enabled: boolean | undefined) => {
        lab.applyUpdate((p) => {
          if (enabled === undefined) {
            const { [pluginId]: _, ...rest } = p.pluginStates
            return { ...p, pluginStates: rest }
          }
          return {
            ...p,
            pluginStates: { ...p.pluginStates, [pluginId]: enabled },
          }
        })
      },
      showError: (message: string) => alert(message),
      uninstall: externalPlugins.uninstall,
    }

    function handleMimodFile(file: File) {
      void installPluginCatalogFile(file, pluginCatalogActionDependencies)
    }

    function handlePluginFolder() {
      void installPluginCatalogFolder(pluginCatalogActionDependencies)
    }

    return (
      <section className="app-mock-screen" aria-label={t.project.pluginsSection}>
        <PluginsCatalogImportToolbar onMimodFile={handleMimodFile} />
        <PluginsCatalogList
          externalPluginEntries={externalPlugins.entries}
          isRestoring={externalPlugins.isRestoring}
          language={language}
          onOpenPlugin={onOpenPlugin}
          onPluginEnabledChange={lab.updatePluginEnabled}
          onPluginUninstall={(pluginId) => {
            void uninstallPluginCatalogEntry(
              pluginId,
              pluginCatalogActionDependencies,
            )
          }}
          plugins={lab.registeredPlugins}
        />

        {/* ── Dev tools ──────────────────────────────────────────────────── */}
        <PluginsCatalogDevelopmentTools
          onPluginFolder={handlePluginFolder}
          supportsDirectoryPicker={"showDirectoryPicker" in window}
        />
      </section>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── sampler-only ─────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (mode === "sampler-only") {
    const handleSamplerPad = (id: SmcPadSoundId, velocity = 1) => {
      labPerform.triggerSmcPad(id, velocity)
      setActiveSamplerPadId(id)
      window.setTimeout(() => setActiveSamplerPadId(null), 140)
    }

    return (
      <>
        <section className="app-mock-screen" aria-label={t.pad.workspace}>
          <header className="app-mock-toolbar">
            <div className="perform-mode-transport" aria-label={t.pad.recordingControls}>
              {padViewMode === "beats" ? (
                // En beats: el patrón ya está en el track — el botón confirma y muestra mensaje
                <button
                  aria-label="Patrón guardado en el track de percusión"
                  className="perform-mode-transport-button perform-mode-transport-record"
                  onClick={() => lab.setProjectMessage(`Patrón guardado en "${lab.primaryTrack.name}".`)}
                  title="Patrón guardado automáticamente en el track"
                  type="button"
                >
                  <span aria-hidden="true" className="perform-mode-transport-icon">
                    <Layers size={16} className="perform-mode-transport-glyph-record" />
                  </span>
                </button>
              ) : (
                <button
                  aria-label={
                    labRecording.recordingState === "recording"
                      ? t.common.stopRecording
                      : t.common.startRecording
                  }
                  className={`perform-mode-transport-button${labRecording.recordingState === "recording" ? " perform-mode-transport-button-active" : ""}`}
                  data-tutorial="pad-record-button"
                  onClick={
                    labRecording.recordingState === "recording"
                      ? () => labRecording.stopRecording()
                      : startRecording
                  }
                  type="button"
                >
                  <span className="perform-mode-transport-icon">
                    <span
                      className={`perform-mode-transport-glyph ${labRecording.recordingState === "recording" ? "perform-mode-transport-glyph-stop" : "perform-mode-transport-glyph-record"}`}
                    >
                      {labRecording.recordingState === "recording" ? "■" : "●"}
                    </span>
                  </span>
                </button>
              )}
              <button
                aria-label={
                  (padViewMode === "beats" ? padBeats.isPlaying : labPlayback.playbackTransport.isPlaying)
                    ? t.common.stopPlayback
                    : t.common.play
                }
                className={`perform-mode-transport-button${(padViewMode === "beats" ? padBeats.isPlaying : labPlayback.playbackTransport.isPlaying) ? " perform-mode-transport-button-active" : ""}`}
                data-tutorial="pad-play-button"
                disabled={labRecording.recordingState === "recording"}
                onClick={
                  padViewMode === "beats"
                    ? padBeats.togglePlay
                    : labPlayback.playbackTransport.isPlaying
                      ? labPlayback.playbackTransport.stop
                      : () =>
                          labPlayback.playbackTransport.play(
                            { ...lab.project, timeline: [lab.primaryTrack] },
                            { padSoundSettings: lab.project.padSoundSettings },
                          )
                }
                type="button"
              >
                <span className="perform-mode-transport-icon">
                  <span
                    className={`perform-mode-transport-glyph ${labPlayback.playbackTransport.isPlaying ? "perform-mode-transport-glyph-stop" : "perform-mode-transport-glyph-play"}`}
                  >
                    {labPlayback.playbackTransport.isPlaying ? "■" : "▶"}
                  </span>
                </span>
              </button>
            </div>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Modo: pads en vivo / beats sequencer */}
            <div className="ui-toggle-group" role="group" aria-label="Modo de entrada" data-tutorial="pad-view-mode-toggle">
              <button
                aria-pressed={padViewMode === "pads"}
                onClick={() => handleSetPadViewMode("pads")}
                type="button"
              >
                Pads
              </button>
              <button
                aria-pressed={padViewMode === "beats"}
                data-tutorial="pad-view-mode-beats-btn"
                onClick={() => handleSetPadViewMode("beats")}
                type="button"
              >
                Beats
              </button>
            </div>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Grupo 2: Qué tocas — pista, página y añadir */}
            <select
              aria-label={t.toolbar.activeTrack}
              className="ui-select"
              value={lab.primaryTrack.id}
              onChange={(e) => switchActiveTrack(e.target.value)}
            >
              {lab.percussionTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>

            {padViewMode === "pads" && <div className="ui-pad-pager" data-tutorial="pad-page-pager">
              <button
                aria-label={t.pad.prevPage}
                className="ui-icon-btn"
                disabled={padPage === 0}
                onClick={() => setPadPage((p) => Math.max(0, p - 1))}
                type="button"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="ui-pad-pager-label">
                {padPage + 1} / {Math.ceil(smcPadSounds.length / 8)}
              </span>
              <button
                aria-label={t.pad.nextPage}
                className="ui-icon-btn"
                disabled={padPage >= Math.ceil(smcPadSounds.length / 8) - 1}
                onClick={() =>
                  setPadPage((p) => Math.min(Math.ceil(smcPadSounds.length / 8) - 1, p + 1))
                }
                type="button"
              >
                <ChevronRight size={15} />
              </button>
            </div>}

            <button className="ui-pill-btn" data-tutorial="add-pad-track-button" onClick={lab.addPadTrack} type="button">
              {t.toolbar.addPadTrack}
            </button>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Grupo 3: Acciones estructurales */}
            <button
              aria-label={tpl(t.toolbar.deleteTrackNamed, { name: lab.primaryTrack.name })}
              className="ui-icon-btn"
              onClick={lab.confirmRemoveActiveTrack}
              title={tpl(t.toolbar.deleteTrackNamed, { name: lab.primaryTrack.name })}
              type="button"
            >
              <Trash2 size={18} />
            </button>
            {/* <PluginSlot api={pluginApi} language={language} pluginStates={lab.project.pluginStates} slotId="pad-toolbar" /> */}
          </header>

          {padViewMode === "beats" ? (
            <div className="perform-workspace-card perform-workspace-card-piano">
              <PadBeatsSequencer
                activeStep={padBeats.activeStep}
                grid={padBeats.grid}
                sounds={smcPadSounds}
                stepCount={padBeats.stepCount}
                onToggleStep={padBeats.toggleStep}
              />
            </div>
          ) : (
            <div className="ui-smc-grid" data-tutorial="pad-grid">
              {smcPadSounds.slice(padPage * 8, padPage * 8 + 8).map((pad, i) => (
                <div key={pad.id} className="ui-smc-cell">
                  <button
                    aria-label={`${pad.label} — ${t.pad.pressPad}`}
                    className={[
                      "ui-smc-btn",
                      getPadBtnClass(pad.id),
                      activeSamplerPadId === pad.id ? "ui-smc-btn-triggered" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onPointerDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const velocity = Math.max(
                        0.35,
                        1 - ((e.clientY - rect.top) / rect.height) * 0.65,
                      )
                      void ensureAudioReady().then(() => handleSamplerPad(pad.id, velocity))
                    }}
                    type="button"
                  >
                    <span className="ui-smc-btn-num">{padPage * 8 + i + 1}</span>
                    <span className="ui-smc-btn-label">{pad.label}</span>
                    <span className="ui-smc-btn-desc">{t.pad.descriptions[pad.id] ?? pad.description}</span>
                  </button>
                  {!lab.project.padSettingsLocked && (
                    <button
                      aria-label={tpl(t.pad.configurePad, { label: pad.label })}
                      className="ui-smc-config-btn"
                      data-tutorial={i === 0 ? "pad-settings-btn" : undefined}
                      onClick={() => setConfigSoundId(pad.id)}
                      title={tpl(t.pad.configurePad, { label: pad.label })}
                      type="button"
                    >
                      ⚙
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <AppDialog
          actions={
            <>
              <button onClick={lab.cancelRemoveActiveTrack} type="button">
                {t.common.cancel}
              </button>
              <button
                className="app-dialog-confirm"
                onClick={lab.acceptRemoveActiveTrack}
                type="button"
              >
                {t.common.delete}
              </button>
            </>
          }
          description={t.dialogs.deleteTrackMsg}
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={tpl(t.dialogs.deleteTrackTitle, { name: lab.primaryTrack.name })}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
                {t.common.cancel}
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  lab.setIsRestartConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                {t.common.reset}
              </button>
            </>
          }
          description={t.dialogs.resetProjectMsg}
          onClose={() => lab.setIsRestartConfirmOpen(false)}
          open={lab.isRestartConfirmOpen}
          title={t.dialogs.resetProjectTitle}
        />

        <AppDialog
          actions={
            <button
              onClick={() => {
                lab.updatePrimaryTrackVolume(1)
                lab.updatePrimaryTrackPan(0)
              }}
              type="button"
            >
              {t.common.resetDefaults}
            </button>
          }
          description={t.project.muteSoloDesc}
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title={t.project.perTrackMix}
        >
          <div className="edit-settings-track-section" data-tutorial="pad-options-content">
            {/* Opciones de Beats — solo visibles en modo beats */}
            {padViewMode === "beats" && (
              <>
                <div className="perform-settings-dialog-row">
                  <div className="perform-settings-dialog-section">
                    <span className="perform-instrument-dialog-title">BPM</span>
                    <div className="ui-counter">
                      <button className="ui-counter-btn" onClick={() => handleSetSeqBpm(seqBpm - 5)} type="button">−</button>
                      <span className="ui-counter-value" style={{ minWidth: "2.8rem" }}>{seqBpm}</span>
                      <button className="ui-counter-btn" onClick={() => handleSetSeqBpm(seqBpm + 5)} type="button">+</button>
                    </div>
                    <input
                      max={240} min={40} step={1}
                      style={{ width: "100%", marginTop: "0.5rem" }}
                      type="range" value={seqBpm}
                      onChange={(e) => handleSetSeqBpm(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="perform-settings-dialog-section">
                  <span className="perform-instrument-dialog-title">
                    {t.perform.stepSubdivision ?? "Subdivisión"}
                    <span style={{ opacity: 0.5, fontSize: "0.75em", marginLeft: "0.5rem" }}>
                      = {Math.round(calcStepDurationSec(seqBpm, seqStepSubdivision) * 1000)}ms/paso
                    </span>
                  </span>
                  <div className="perform-instrument-dialog-tabs">
                    {STEP_SUBDIVISION_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        className={`ui-pill-btn${seqStepSubdivision === value ? " ui-pill-btn-active" : ""}`}
                        onClick={() => {
                          handleSetSeqSubdivision(value)
                        }}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="perform-settings-dialog-section">
                  <span className="perform-instrument-dialog-title">{t.perform.steps}</span>
                  <div className="perform-instrument-dialog-tabs">
                    {STEP_COUNT_OPTIONS.map((sc) => (
                      <button
                        key={sc}
                        className={`ui-pill-btn${padBeats.stepCount === sc ? " ui-pill-btn-active" : ""}`}
                        onClick={() => padBeats.setStepCount(sc)}
                        type="button"
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="perform-settings-dialog-section">
                  <button
                    className="ui-pill-btn"
                    onClick={padBeats.clearGrid}
                    style={{ width: "100%" }}
                    type="button"
                  >
                    CLEAR BEATS
                  </button>
                </div>
              </>
            )}
            {/* Lock de configuración de pads — movido desde la toolbar */}
            <div className="perform-settings-dialog-section">
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
                <input
                  checked={lab.project.padSettingsLocked}
                  className="ui-checkbox"
                  onChange={() => lab.applyUpdate(p => ({ ...p, padSettingsLocked: !p.padSettingsLocked }))}
                  type="checkbox"
                />
                <span>{lab.project.padSettingsLocked ? t.toolbar.unlockConfig : t.toolbar.lockConfig}</span>
              </label>
            </div>

            <span className="perform-instrument-dialog-title">
              {t.toolbar.activeTrack} — {lab.primaryTrack.name}
            </span>
            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="pad-track-volume">
                {t.common.volume}
              </label>
              <input
                id="pad-track-volume"
                max={1.5}
                min={0}
                onChange={(e) => lab.updatePrimaryTrackVolume(parseFloat(e.target.value))}
                step={0.01}
                type="range"
                value={lab.primaryTrack.volume}
              />
              <span className="edit-settings-track-value">
                {Math.round(lab.primaryTrack.volume * 100)}%
              </span>
            </div>
            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="pad-track-pan">
                Pan
              </label>
              <input
                id="pad-track-pan"
                max={1}
                min={-1}
                onChange={(e) => lab.updatePrimaryTrackPan(parseFloat(e.target.value))}
                step={0.01}
                type="range"
                value={lab.primaryTrack.pan}
              />
              <span className="edit-settings-track-value">
                {lab.primaryTrack.pan === 0
                  ? "C"
                  : lab.primaryTrack.pan > 0
                    ? `R${Math.round(lab.primaryTrack.pan * 100)}`
                    : `L${Math.round(Math.abs(lab.primaryTrack.pan) * 100)}`}
              </span>
            </div>
          </div>
        </AppDialog>

        {configSoundId &&
          (() => {
            const snd = getSmcPadSoundDescriptor(configSoundId)
            const resolved: PadSoundParams = {
              ...PAD_SOUND_DEFAULTS[configSoundId],
              ...lab.project.padSoundSettings[configSoundId],
            }
            const hasTune = resolved.tune !== undefined
            const hasLength = resolved.length !== undefined
            const hasFlicker = resolved.flicker !== undefined
            const patch = (p: Partial<PadSoundParams>) =>
              lab.applyUpdate((proj) => updatePadSoundSetting(proj, configSoundId, p))
            return (
              <AppDialog
                actions={
                  <button
                    onClick={() => patch(PAD_SOUND_DEFAULTS[configSoundId])}
                    type="button"
                  >
                    {t.common.resetDefaults}
                  </button>
                }
                description={tpl(t.pad.synthDesc, { label: snd.label })}
                onClose={() => setConfigSoundId(null)}
                open
                title={tpl(t.pad.configTitle, { label: snd.label })}
              >
                <div className="audio-sampler-settings">
                  <section className="ui-list-section">
                    <div className="edit-settings-track-row">
                      <label className="edit-settings-track-label" htmlFor="ps-volume">
                        {t.common.volume}
                      </label>
                      <input
                        id="ps-volume"
                        max={1}
                        min={0}
                        onChange={(e) => patch({ volume: Number(e.target.value) })}
                        step={0.01}
                        type="range"
                        value={resolved.volume}
                      />
                      <span className="edit-settings-track-value">
                        {Math.round(resolved.volume * 100)}%
                      </span>
                    </div>
                    <div className="edit-settings-track-row">
                      <label className="edit-settings-track-label" htmlFor="ps-decay">
                        Decay
                      </label>
                      <input
                        id="ps-decay"
                        max={2}
                        min={0.3}
                        onChange={(e) => patch({ decay: Number(e.target.value) })}
                        step={0.05}
                        type="range"
                        value={resolved.decay}
                      />
                      <span className="edit-settings-track-value">
                        {resolved.decay.toFixed(2)}x
                      </span>
                    </div>
                    <div className="edit-settings-track-row">
                      <label className="edit-settings-track-label" htmlFor="ps-dist">
                        {t.pad.distortion}
                      </label>
                      <input
                        id="ps-dist"
                        max={1}
                        min={0}
                        onChange={(e) => patch({ distortion: Number(e.target.value) })}
                        step={0.01}
                        type="range"
                        value={resolved.distortion}
                      />
                      <span className="edit-settings-track-value">
                        {Math.round(resolved.distortion * 100)}%
                      </span>
                    </div>
                    {hasTune && (
                      <div className="edit-settings-track-row">
                        <label className="edit-settings-track-label" htmlFor="ps-tune">
                          {t.pad.pitch}
                        </label>
                        <input
                          id="ps-tune"
                          max={400}
                          min={20}
                          onChange={(e) => patch({ tune: Number(e.target.value) })}
                          step={1}
                          type="range"
                          value={resolved.tune}
                        />
                        <span className="edit-settings-track-value">{resolved.tune} Hz</span>
                      </div>
                    )}
                    {hasLength && (
                      <div className="edit-settings-track-row">
                        <label className="edit-settings-track-label" htmlFor="ps-len">
                          {t.pad.length}
                        </label>
                        <input
                          id="ps-len"
                          max={0.6}
                          min={0.02}
                          onChange={(e) => patch({ length: Number(e.target.value) })}
                          step={0.005}
                          type="range"
                          value={resolved.length}
                        />
                        <span className="edit-settings-track-value">
                          {Math.round((resolved.length ?? 0) * 1000)} ms
                        </span>
                      </div>
                    )}
                    {hasFlicker && (
                      <div className="ui-list-row ui-list-row-static">
                        <span className="ui-list-label">{t.pad.flicker}</span>
                        <label className="ui-toggle" aria-label={t.pad.flicker}>
                          <input
                            checked={resolved.flicker ?? false}
                            onChange={(e) => patch({ flicker: e.target.checked })}
                            type="checkbox"
                          />
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

  // ────────────────────────────────────────────────────────────────────────────
  // ── Shared perform pieces ────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const performControls = (
    <LabSoundControls
      arpeggiatorSettings={labPerform.arpeggiatorSettings}
      availableNotes={labPerform.visibleNotes}
      onArpeggiatorEnabledChange={labPerform.handleArpeggiatorEnabledChange}
      onArpeggiatorGateChange={labPerform.handleArpeggiatorGateChange}
      onArpeggiatorLatchChange={labPerform.handleArpeggiatorLatchChange}
      onArpeggiatorModeChange={labPerform.handleArpeggiatorModeChange}
      onArpeggiatorOctaveRangeChange={labPerform.handleArpeggiatorOctaveRangeChange}
      onArpeggiatorRateChange={labPerform.handleArpeggiatorRateChange}
      onChordTypeChange={labPerform.setSelectedChordType}
      onNoteChange={labPerform.setSelectedNote}
      onPreviewOctaveChange={labPerform.updatePreviewOctave}
      onPianoModeChange={labPerform.setPianoMode}
      onVolumeChange={labPerform.updateVolume}
      pianoMode={labPerform.pianoMode}
      previewOctave={labPerform.previewOctave}
      previewOctaveOptions={previewOctaveOptions}
      selectedChordType={labPerform.selectedChordType}
      selectedNote={labPerform.selectedNote}
      volume={labPerform.volume}
    />
  )

  const performPiano = (
    <PianoPreview
      getPlayableNotes={labPerform.getPianoPlayableNotes}
      directPlaybackEnabled={!labPerform.arpeggiatorSettings.enabled}
      interactionMode={labPerform.pianoMode}
      notes={labPerform.visibleNotes}
      onNoteOff={
        labPerform.arpeggiatorSettings.enabled
          ? undefined
          : (note) => labPerform.handleMidiEvent("note-off", note)
      }
      onNoteOn={
        labPerform.arpeggiatorSettings.enabled
          ? undefined
          : (note) => labPerform.handleMidiEvent("note-on", note)
      }
      onSelectNote={labPerform.setSelectedNote}
      onTriggerNoteOff={labPerform.handlePianoTriggerEnd}
      onTriggerNoteOn={labPerform.handlePianoTriggerStart}
      playOptions={labPerform.basePreviewPlayOptions}
      resolvePlayOptions={() =>
        labPerform.getTrackPreviewPlayOptions(labRecording.getCurrentRecordTime())
      }
      selectedNote={labPerform.selectedNote}
    />
  )

  const performPad = <MiniSmcPad onTrigger={labPerform.triggerSmcPad} />

  const performActions = (
    <LabActions
      canExportAudio={lab.allRecordedNotes.length > 0}
      canPlayRecording={lab.allRecordedNotes.length > 0}
      isExportingAudio={lab.isExportingAudio}
      isPlaying={labPlayback.playbackTransport.isPlaying}
      isRecording={labRecording.recordingState === "recording"}
      onClearSession={handleClearSession}
      onExportAudio={handleExportProjectAudio}
      onExportProject={lab.exportProject}
      onImportProject={() => lab.importInputRef.current?.click()}
      onPlayRecording={labPlayback.playRecording}
      onPlayTestChord={labPerform.playTestChord}
      onPlayTestNote={labPerform.playTestNote}
      onRestartProject={() => lab.setIsRestartConfirmOpen(true)}
      onStartRecording={startRecording}
      onStopPlayback={labPlayback.playbackTransport.stop}
      onStopRecording={() => labRecording.stopRecording()}
    />
  )

  const performMidiLog = <MidiEventLog events={labPerform.midiEvents} />

  const performWorkspace = (
    <>
      {performControls}
      {performPiano}
      {performPad}
      {performActions}
      {performMidiLog}
    </>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // ── perform-only ─────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (mode === "perform-only") {
    return (
      <>
        <section className="perform-workspace-primary" aria-label={t.perform.mainPanel}>
          <header className="app-mock-toolbar">
            <PerformResponsiveToolbar
              activeInstrumentCategory={instrumentDialogCategory}
              allRecordedNotesCount={pianoViewMode === "steps" ? activeStepsClipNotes.length : lab.allRecordedNotes.length}
              instrumentCategories={instrumentCategories}
              isInstrumentDialogOpen={isInstrumentDialogOpen}
              isPlaying={pianoViewMode === "steps" ? melodicSequencer.isPlaying : labPlayback.playbackTransport.isPlaying}
              isRecording={pianoViewMode === "steps" ? false : labRecording.recordingState === "recording"}
              language={language}
              octave={labPerform.previewOctave}
              isArpEnabled={labPerform.arpeggiatorSettings.enabled}
              onAddTrack={pianoViewMode === "steps" ? handleAddStepsTrack : lab.addTrack}
              onArpToggle={() =>
                labPerform.setArpeggiatorSettings((s) => ({ ...s, enabled: !s.enabled }))
              }
              onBakeStepsToTrack={handleBakeStepsToTrack}
              onCloseInstrumentDialog={closeInstrumentDialog}
              onConfirmRemoveTrack={pianoViewMode === "steps" ? handleRemoveStepsTrack : lab.confirmRemoveActiveTrack}
              onInstrumentCategoryChange={setInstrumentDialogCategory}
              onInstrumentDialogOpen={openInstrumentDialog}
              onInstrumentSelect={lab.updateTrackInstrumentId}
              onOctaveDown={() => labPerform.stepPreviewOctave(-1)}
              onOctaveUp={() => labPerform.stepPreviewOctave(1)}
              onPianoModeChange={labPerform.setPianoMode}
              onPianoViewModeChange={handleSetPianoViewMode}
              pianoMode={labPerform.pianoMode}
              pianoViewMode={pianoViewMode}
              onStepClear={melodicSequencer.clearGrid}
              onStepCountChange={melodicSequencer.setStepCount}
              stepCount={melodicSequencer.stepCount}
              onPlayToggle={
                pianoViewMode === "steps"
                  ? melodicSequencer.togglePlay
                  : labPlayback.playbackTransport.isPlaying
                    ? labPlayback.playbackTransport.stop
                    : () =>
                        labPlayback.playbackTransport.play({
                          ...lab.project,
                          timeline: [lab.primaryTrack],
                        })
              }
              onRecordToggle={
                pianoViewMode === "steps"
                  ? undefined
                  : labRecording.recordingState === "recording"
                    ? () => labRecording.stopRecording()
                    : startRecording
              }
              onSelectNextTrack={pianoViewMode === "steps" ? () => handleStepsTrackByOffset(1) : () => lab.switchTrackByOffset(1)}
              onSelectPreviousTrack={pianoViewMode === "steps" ? () => handleStepsTrackByOffset(-1) : () => lab.switchTrackByOffset(-1)}
              primaryTrackName={pianoViewMode === "steps" ? (activeStepsTrack?.name ?? "Steps 1") : lab.primaryTrack.name}
              removeTrackDisabled={pianoViewMode === "steps" ? lab.stepsTracks.length <= 1 : false}
              selectedInstrumentId={selectedInstrument.id}
              selectedInstrumentName={selectedInstrument.name}
              trackNextDisabled={pianoViewMode === "steps" ? lab.stepsTracks.at(-1)?.id === activeStepsTrack?.id : lab.melodicTracks.at(-1)?.id === lab.primaryTrack.id}
              trackPreviousDisabled={pianoViewMode === "steps" ? lab.stepsTracks[0]?.id === activeStepsTrack?.id : lab.melodicTracks[0]?.id === lab.primaryTrack.id}
              visibleInstruments={dialogVisibleInstruments}
            />
            <PluginSlot api={pluginApi} language={language} pluginStates={lab.project.pluginStates} slotId="piano-toolbar" />
          </header>

          <section className="perform-workspace-card perform-workspace-card-piano">
            {pianoViewMode === "steps" ? (
              <MelodicStepSequencer
                activeStep={melodicSequencer.activeStep}
                grid={melodicSequencer.grid}
                notes={stepSequencerNotes}
                onToggleStep={melodicSequencer.toggleStep}
                stepCount={melodicSequencer.stepCount}
              />
            ) : (
              performPiano
            )}
          </section>

          <div className="sr-only">{performControls}</div>
        </section>

        <AppDialog
          actions={
            <>
              <button onClick={lab.cancelRemoveActiveTrack} type="button">
                {t.common.cancel}
              </button>
              <button
                className="app-dialog-confirm"
                onClick={lab.acceptRemoveActiveTrack}
                type="button"
              >
                {t.common.delete}
              </button>
            </>
          }
          description={t.dialogs.deleteTrackMsg}
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={tpl(t.dialogs.deleteTrackTitle, { name: lab.primaryTrack.name })}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
                {t.common.cancel}
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  lab.setIsRestartConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                {t.common.reset}
              </button>
            </>
          }
          description={t.dialogs.resetProjectMsg}
          onClose={() => lab.setIsRestartConfirmOpen(false)}
          open={lab.isRestartConfirmOpen}
          title={t.dialogs.resetProjectTitle}
        />

        <AppDialog
          actions={pianoViewMode === "steps" ? (
            <button
              onClick={() => {
                handleSetSeqBpm(120)
                labPerform.updatePreviewOctave(4 as Octave)
              }}
              type="button"
            >
              {t.common.resetDefaults ?? "Reset"}
            </button>
          ) : undefined}
          description={t.dialogs.pianoOptionsDesc}
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title={t.dialogs.pianoOptions}
        >
          <div className="perform-settings-dialog-v" data-tutorial="piano-options-content">
            {/* Modo de entrada — siempre visible */}
            <div className="perform-settings-dialog-section">
              <span className="perform-instrument-dialog-title">{t.perform.inputMode}</span>
              <div className="perform-instrument-dialog-tabs">
                <button
                  className={`ui-pill-btn${pianoViewMode === "keys" ? " ui-pill-btn-active" : ""}`}
                  onClick={() => handleSetPianoViewMode("keys")}
                  type="button"
                >
                  ⌨ {t.perform.modeKeys}
                </button>
                <button
                  className={`ui-pill-btn${pianoViewMode === "steps" ? " ui-pill-btn-active" : ""}`}
                  onClick={() => handleSetPianoViewMode("steps")}
                  type="button"
                >
                  ▦ {t.perform.modeSteps}
                </button>
              </div>
            </div>

            {/* Modo PASOS: octava + BPM + pasos */}
            {pianoViewMode === "steps" && (
              <>
                <div className="perform-settings-dialog-row">
                  <div className="perform-settings-dialog-section">
                    <span className="perform-instrument-dialog-title">{t.perform.octave}</span>
                    <div className="ui-counter">
                      <button className="ui-counter-btn" onClick={() => labPerform.stepPreviewOctave(-1)} type="button">−</button>
                      <span className="ui-counter-value">{labPerform.previewOctave}</span>
                      <button className="ui-counter-btn" onClick={() => labPerform.stepPreviewOctave(1)} type="button">+</button>
                    </div>
                  </div>
                  <div className="perform-settings-dialog-section">
                    <span className="perform-instrument-dialog-title">BPM</span>
                    <div className="ui-counter">
                      <button className="ui-counter-btn" onClick={() => handleSetSeqBpm(seqBpm - 5)} type="button">−</button>
                      <span className="ui-counter-value" style={{ minWidth: "2.8rem" }}>{seqBpm}</span>
                      <button className="ui-counter-btn" onClick={() => handleSetSeqBpm(seqBpm + 5)} type="button">+</button>
                    </div>
                    <input
                      max={240}
                      min={40}
                      step={1}
                      style={{ width: "100%", marginTop: "0.5rem" }}
                      type="range"
                      value={seqBpm}
                      onChange={(e) => handleSetSeqBpm(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="perform-settings-dialog-section">
                  <span className="perform-instrument-dialog-title">
                    {t.perform.stepSubdivision ?? "Subdivisión"}
                    <span style={{ opacity: 0.5, fontSize: "0.75em", marginLeft: "0.5rem" }}>
                      = {Math.round(calcStepDurationSec(seqBpm, seqStepSubdivision) * 1000)}ms/paso
                    </span>
                  </span>
                  <div className="perform-instrument-dialog-tabs">
                    {STEP_SUBDIVISION_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        className={`ui-pill-btn${seqStepSubdivision === value ? " ui-pill-btn-active" : ""}`}
                        onClick={() => {
                          handleSetSeqSubdivision(value)
                        }}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="perform-settings-dialog-section">
                  <span className="perform-instrument-dialog-title">{t.perform.steps}</span>
                  <div className="perform-instrument-dialog-tabs">
                    {STEP_COUNT_OPTIONS.map((sc) => (
                      <button
                        key={sc}
                        className={`ui-pill-btn${melodicSequencer.stepCount === sc ? " ui-pill-btn-active" : ""}`}
                        onClick={() => melodicSequencer.setStepCount(sc)}
                        type="button"
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>
                {activeStepsTrack && (
                  <div className="perform-settings-dialog-section">
                    <span className="perform-instrument-dialog-title">{activeStepsTrack.name}</span>
                    <div className="edit-settings-track-row">
                      <label className="edit-settings-track-label" htmlFor="seq-track-volume">
                        {t.common.volume}
                      </label>
                      <input
                        id="seq-track-volume"
                        max={1.5}
                        min={0}
                        onChange={(e) =>
                          lab.applyUpdate((p) => updateTrackVolume(p, activeStepsTrack.id, parseFloat(e.target.value)))
                        }
                        step={0.01}
                        type="range"
                        value={activeStepsTrack.volume ?? 1}
                      />
                      <span className="edit-settings-track-value">
                        {Math.round((activeStepsTrack.volume ?? 1) * 100)}%
                      </span>
                    </div>
                    <div className="edit-settings-track-row">
                      <label className="edit-settings-track-label" htmlFor="seq-track-pan">
                        Pan
                      </label>
                      <input
                        id="seq-track-pan"
                        max={1}
                        min={-1}
                        onChange={(e) =>
                          lab.applyUpdate((p) => updateTrackPan(p, activeStepsTrack.id, parseFloat(e.target.value)))
                        }
                        step={0.01}
                        type="range"
                        value={activeStepsTrack.pan ?? 0}
                      />
                      <span className="edit-settings-track-value">
                        {(activeStepsTrack.pan ?? 0) === 0
                          ? "C"
                          : (activeStepsTrack.pan ?? 0) > 0
                            ? `R${Math.round((activeStepsTrack.pan ?? 0) * 100)}`
                            : `L${Math.round(Math.abs(activeStepsTrack.pan ?? 0) * 100)}`}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Modo TECLADO: acordes + arpegiador */}
            {pianoViewMode === "keys" && (
              <>
            <div className="perform-settings-dialog-section" data-tutorial="piano-chord-section">
              <span className="perform-instrument-dialog-title">{t.perform.chordType}</span>
              <div className="perform-instrument-dialog-tabs">
                {(["major", "minor", "power"] as const).map((type) => (
                  <button
                    className={`ui-pill-btn${labPerform.selectedChordType === type ? " ui-pill-btn-active" : ""}`}
                    key={type}
                    onClick={() => labPerform.setSelectedChordType(type)}
                    type="button"
                  >
                    {type === "major" ? t.perform.chordMajor : type === "minor" ? t.perform.chordMinor : t.perform.chordPower}
                  </button>
                ))}
              </div>
            </div>
            <div className="perform-settings-dialog-section" data-tutorial="piano-arp-mode-section">
              <span className="perform-instrument-dialog-title">{t.perform.arpMode}</span>
              <div className="perform-instrument-dialog-tabs">
                {(["up", "down", "up-down", "random", "chord"] as const).map((m) => (
                  <button
                    className={`ui-pill-btn${labPerform.arpeggiatorSettings.mode === m ? " ui-pill-btn-active" : ""}`}
                    key={m}
                    onClick={() => labPerform.setArpeggiatorSettings((s) => ({ ...s, mode: m }))}
                    type="button"
                  >
                    {m === "up"
                      ? t.perform.arpUp
                      : m === "down"
                        ? t.perform.arpDown
                        : m === "up-down"
                          ? t.perform.arpUpDown
                          : m === "random"
                            ? t.perform.arpRandom
                            : t.perform.arpChord}
                  </button>
                ))}
              </div>
            </div>
            <div className="perform-settings-dialog-section" data-tutorial="piano-arp-params">
              <span className="perform-instrument-dialog-title">{t.perform.arpRate}</span>
              <div className="perform-instrument-dialog-tabs">
                {(["1/4", "1/8", "1/16", "1/8T"] as const).map((r) => (
                  <button
                    className={`ui-pill-btn${labPerform.arpeggiatorSettings.rate === r ? " ui-pill-btn-active" : ""}`}
                    key={r}
                    onClick={() => labPerform.setArpeggiatorSettings((s) => ({ ...s, rate: r }))}
                    type="button"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="perform-settings-dialog-row">
              <div className="perform-settings-dialog-section">
                <span className="perform-instrument-dialog-title">{t.perform.arpGate}</span>
                <div className="perform-settings-gate-row">
                  <input
                    className="perform-settings-gate-input"
                    max={1}
                    min={0.05}
                    onChange={(e) =>
                      labPerform.setArpeggiatorSettings((s) => ({
                        ...s,
                        gate: parseFloat(e.target.value),
                      }))
                    }
                    step={0.05}
                    type="range"
                    value={labPerform.arpeggiatorSettings.gate}
                  />
                  <span className="perform-settings-gate-value">
                    {Math.round(labPerform.arpeggiatorSettings.gate * 100)}%
                  </span>
                </div>
              </div>
              <div className="perform-settings-dialog-section">
                <span className="perform-instrument-dialog-title">{t.perform.arpOctaves}</span>
                <div className="perform-instrument-dialog-tabs">
                  {([1, 2, 3] as const).map((oct) => (
                    <button
                      className={`ui-pill-btn${labPerform.arpeggiatorSettings.octaveRange === oct ? " ui-pill-btn-active" : ""}`}
                      key={oct}
                      onClick={() =>
                        labPerform.setArpeggiatorSettings((s) => ({ ...s, octaveRange: oct }))
                      }
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
                checked={labPerform.arpeggiatorSettings.latch}
                onChange={(e) =>
                  labPerform.setArpeggiatorSettings((s) => ({ ...s, latch: e.target.checked }))
                }
                type="checkbox"
              />
              <span className="perform-instrument-dialog-title" style={{ marginBottom: 0 }}>
                {t.perform.arpLatch}
              </span>
            </label>
              </>
            )}
          </div>
        </AppDialog>

        <aside className="perform-workspace-secondary perform-workspace-secondary-hidden">
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Proyecto</span>
                <h3>{lab.project.name}</h3>
              </div>
            </div>
            <p className="app-surface-note">
              {lab.projectMessage || t.status.readyToPlay}
            </p>
          </section>
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">SMC Pad</span>
                <h3>{t.shortcuts.quickPercussion}</h3>
              </div>
            </div>
            {performPad}
          </section>
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">Acciones</span>
                <h3>{t.shortcuts.transportAndTake}</h3>
              </div>
            </div>
            {performActions}
          </section>
          <section className="perform-workspace-card">
            <div className="app-surface-title-row">
              <div>
                <span className="app-surface-eyebrow">MIDI</span>
                <h3>{t.shortcuts.recentActivity}</h3>
              </div>
            </div>
            {performMidiLog}
          </section>
        </aside>
      </>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── full mode (lab fallback) ─────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const projectPanel = (
    <LabProjectPanel
      activeInstrumentCategory={activeInstrumentCategory}
      envelopeHelpText={t.project.envelopeDesc}
      envelope={lab.primaryTrack.envelope}
      historyCount={lab.undoStack.length}
      instrumentCategoryDescription={getInstrumentCategoryDescription(activeInstrumentCategory)}
      instrumentCategories={instrumentCategories}
      instrumentOptions={visibleInstrumentOptions}
      noteCount={lab.noteCount}
      noteTimelineDuration={lab.primaryTrack.noteTimelineDuration}
      onAddTrack={lab.addTrack}
      onInstrumentCategoryChange={(cat) =>
        lab.updateTrackInstrumentCategory(cat, availableInstruments)
      }
      onPluginEnabledChange={lab.updatePluginEnabled}
      onProjectNameChange={lab.updateProjectName}
      onProjectTrackTimelineDurationChange={lab.updateProjectTrackTimelineDurationValue}
      onResetProjectTrackTimelineDuration={lab.resetProjectTrackTimelineDuration}
      onResetTrackNoteTimelineDuration={lab.resetPrimaryTrackNoteTimelineDuration}
      onRemoveActiveTrack={lab.confirmRemoveActiveTrack}
      onSwitchActiveTrack={switchActiveTrack}
      onTrackEnvelopeChange={lab.updatePrimaryTrackEnvelope}
      onTrackInstrumentChange={lab.updateTrackInstrumentId}
      onTrackMutedToggle={lab.togglePrimaryTrackMuted}
      onTrackNameChange={lab.updateTrackName}
      onTrackNoteTimelineDurationChange={lab.updatePrimaryTrackNoteTimelineDurationValue}
      onTrackPanChange={lab.updatePrimaryTrackPan}
      onTrackSoloToggle={lab.togglePrimaryTrackSolo}
      onTrackVolumeAutomationChange={lab.updatePrimaryTrackVolumeAutomation}
      onTrackVolumeChange={lab.updatePrimaryTrackVolume}
      pan={lab.primaryTrack.pan}
      primaryTrackId={lab.primaryTrack.id}
      primaryTrackInstrumentId={lab.primaryTrack.instrumentId}
      primaryTrackMuted={lab.primaryTrack.muted}
      primaryTrackName={lab.primaryTrack.name}
      primaryTrackSolo={lab.primaryTrack.solo}
      projectMessage={lab.projectMessage}
      projectName={lab.project.name}
      projectTrackTimelineDuration={lab.project.trackTimelineDuration}
      plugins={lab.registeredPlugins}
      trackCount={lab.midiTracks.filter(t => t.trackType !== "steps").length}
      tracks={lab.midiTracks.filter(t => t.trackType !== "steps")}
      volumeAutomation={lab.primaryTrack.volumeAutomation}
      volume={lab.primaryTrack.volume}
    />
  )

  return (
    <>
      <main>
        <h1>MiMIDI</h1>
        <p>Core musical experimental basado en instrumentos matematicos.</p>
        <section className="audio-lab" aria-label="Core de audio">
          <input
            accept=".json,application/json"
            hidden
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              void projectFeatureFileImportHandlers.importProjectFile(e)
            }
            ref={lab.importInputRef}
            type="file"
          />
          {projectPanel}
          {performWorkspace}
          {editWorkspace}
        </section>
      </main>

      <AppDialog
        actions={
          <>
            <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
              {t.common.cancel}
            </button>
            <button
              className="ui-btn-danger"
              onClick={() => {
                lab.setIsRestartConfirmOpen(false)
                void handleRestartProject()
              }}
              type="button"
            >
              {t.common.reset}
            </button>
          </>
        }
        description={t.dialogs.resetProjectMsg}
        onClose={() => lab.setIsRestartConfirmOpen(false)}
        open={lab.isRestartConfirmOpen}
        title={t.dialogs.resetProjectTitle}
      />
    </>
  )
}

export default LabApp
