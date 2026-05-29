import type { ChangeEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import "../../App.css"
import { resolveAppMessages, tpl, type AppLanguage } from "../../app/appI18n"
import {
  updatePadSoundSetting,
  compactTrackNotesStart,
  getMidiTracks,
  getMidiTrackNotes,
  getSamplerTracks,
  getAudioClipTracks,
  renameSamplerMix,
  removeSamplerMix,
  removeTrack,
  renameTrack,
  appendTrackWithNotes,
  addAudioClipTrack,
  type MusicalProject,
} from "../../engine/project/projectModel"
import { saveSampleBuffer, loadSampleBuffer } from "../../engine/audio/sampleStorage"
import { decodeAudioData } from "../../engine/audio/audioEngine"
import { loadSlotMetas, saveSlotMetas, DEFAULT_CALIBRATION } from "../../engine/audio/sampleModel"
import {
  Play,
  Square,
  Trash2,
  Undo2,
  Redo2,
  Copy,
  RotateCcw,
  Check,
  Upload,
  Folder,
  VolumeX,
  Minus,
  Plus,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from "lucide-react"
import {
  getInstrumentCategoryDescription,
  getInstrumentCategoryLabel,
  type MathematicalInstrument,
} from "../../engine/audio/mathematicalInstruments"
import { useLabInstrumentCatalog } from "./useLabInstrumentCatalog"
import {
  isSmcPadRecordedNote,
} from "../../engine/midi/events"
import { MidiEventLog } from "../midi-events/MidiEventLog"
import { PianoPreview } from "../piano/PianoPreview"
import { MiniSmcPad } from "../smc-pad/MiniSmcPad"
import { TrackTimelinePreview } from "../timeline/TrackTimelinePreview"
import { TimelinePreview } from "../timeline/TimelinePreview"
import { AppDialog } from "../../app/components/AppDialog"
import { PerformResponsiveToolbar } from "../perform/components/PerformResponsiveToolbar"
import { LabActions } from "./LabActions"
import { LabNoteEditor } from "./LabNoteEditor"
import { LabProjectPanel } from "./LabProjectPanel"
import { LabSoundControls } from "./LabSoundControls"
import { useLabRecordingSession } from "./useLabRecordingSession"
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
import { useLabPerform } from "./useLabPerform"
import { previewOctaveOptions } from "../../engine/midi/notes"
import { ensureAudioReady } from "../../engine/audio/audioEngine"
import { playNote, stopNote } from "../../application/use-cases/playNote"
import { saveFile } from "../../application/use-cases/saveFile"
import { usePluginAPI } from "../../engine/plugins/pluginApi"
import { useExternalPlugins } from "../../engine/plugins/useExternalPlugins"
import { PluginWorkspaceHost } from "../plugins-view/PluginWorkspaceHost"
import { PluginSlot } from "../plugins-view/PluginSlot"
import type { PluginOutput } from "../../engine/plugins/pluginModel"

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

function getPerformanceTimestamp() {
  return performance.now()
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
  // ── Simple local UI state ────────────────────────────────────────────────────
  const [timelineSnapEnabled, setTimelineSnapEnabled] = useState(false)
  const [timelineSnapStep, setTimelineSnapStep] = useState(0.1)
  const [timelineView, setTimelineView] = useState<"notes" | "tracks">(() => {
    const v = new URLSearchParams(window.location.search).get("timelineView")
    return v === "tracks" ? "tracks" : "notes"
  })
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
  const [configSoundId, setConfigSoundId] = useState<SmcPadSoundId | null>(null)
  const [isInstrumentDialogOpen, setIsInstrumentDialogOpen] = useState(false)
  const [instrumentDialogCategory, setInstrumentDialogCategory] = useState<
    MathematicalInstrument["category"]
  >("base")
  const [pluginToast, setPluginToast] = useState("")
  const pluginToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pluginVoicesRef = useRef<Map<string, ReturnType<typeof playNote>>>(new Map())

  // ── Core hooks ───────────────────────────────────────────────────────────────
  const lab = useLabProject({ mode, timelineSnapEnabled, timelineSnapStep })

  const labPlayback = useLabPlayback({ project: lab.project })

  const instrumentCatalog = useLabInstrumentCatalog(
    lab.primaryTrack.instrumentId,
    lab.project.pluginStates,
  )

  const labRecording = useLabRecordingSession({
    getPerformanceTimestamp,
    getTrackAutomationVolumeAtTime: (time) => lab.getTrackAutomationVolumeAtTime(time),
    onProjectUpdate: lab.applyUpdate,
    onStopRecording: useCallback(() => {
      lab.applyUpdate((p) => {
        const track = getMidiTracks(p.timeline).find((t) => t.id === lab.primaryTrack.id)
        if (!track || getMidiTrackNotes(track).length === 0) return p
        return compactTrackNotesStart(p, lab.primaryTrack.id)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lab.applyUpdate, lab.primaryTrack.id]),
    onUpdateMessage: lab.setProjectMessage,
    primaryTrack: lab.primaryTrack,
  })

  const labPerform = useLabPerform({
    primaryTrack: lab.primaryTrack,
    isPrimaryTrackAudible: lab.isPrimaryTrackAudible,
    selectedInstrument: instrumentCatalog.selectedInstrument,
    getCurrentRecordTime: labRecording.getCurrentRecordTime,
    recordNotesToActiveTrack: labRecording.recordNotesToActiveTrack,
    recordNotesAtTime: labRecording.recordNotesAtTime,
    registerMidiEvent: labRecording.registerMidiEvent,
    recordingState: labRecording.recordingState,
    applyUpdate: lab.applyUpdate,
    setProjectMessage: lab.setProjectMessage,
    project: lab.project,
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
  useEffect(() => {
    if (lab.hasNoTracks && timelineView === "notes") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimelineView("tracks")
    }
  }, [lab.hasNoTracks, timelineView])

  useEffect(() => {
    function syncTimelineView() {
      const v = new URLSearchParams(window.location.search).get("timelineView")
      if (v === "tracks" || v === "notes") setTimelineView(v)
    }
    window.addEventListener("popstate", syncTimelineView)
    return () => window.removeEventListener("popstate", syncTimelineView)
  }, [])

  useEffect(() => {
    if (timelineView !== "tracks") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTrackLaneFocused(false)
      setSelectedClipId(null)
    }
  }, [timelineView])

  // ── Plugin hooks (must be before any early return) ──────────────────────────
  const externalPlugins = useExternalPlugins()

  const pluginApi = usePluginAPI({
    isPlaying: labPlayback.playbackTransport.isPlaying,
    isRecording: labRecording.recordingState === "recording",
    bpm: getSamplerTracks(lab.project.timeline)[0]?.pattern.bpm ?? 120,
    playNote: (note, instrumentId, duration) => {
      const inst = instrumentCatalog.availableInstruments.find(i => i.id === instrumentId)
      const voiceId = playNote(note as Parameters<typeof playNote>[0], duration, {
        waveform: inst?.waveform,
        envelope: inst?.envelope,
        volume: inst?.volume,
      })
      pluginVoicesRef.current.set(note, voiceId)
    },
    stopNote: (note) => {
      const voiceId = pluginVoicesRef.current.get(note)
      if (voiceId !== undefined) { stopNote(voiceId); pluginVoicesRef.current.delete(note) }
    },
    triggerPad: (padId, velocity = 1) => labPerform.triggerSmcPad(padId as SmcPadSoundId, velocity),
    getTracks: () =>
      getMidiTracks(lab.project.timeline).map(tr => ({
        id: tr.id,
        name: tr.name,
        type: tr.trackType === "melodic" ? "melodic" as const : "percussion" as const,
      })),
    receivePluginOutput: (output: PluginOutput) => {
      if (output.type === "midi") {
        lab.applyUpdate(p => appendTrackWithNotes(p, output.name, output.instrumentId, output.notes))
      } else if (output.type === "audio") {
        if (output.destination === "sampler") {
          const dbId = output.dbId ?? `plugin-audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
          void output.blob.arrayBuffer().then(async buf => {
            if (!output.dbId) await saveSampleBuffer(dbId, buf)
            try {
              const audioBuffer = await decodeAudioData(buf)
              const slots = loadSlotMetas()
              const emptyIdx = slots.findIndex(s => s === null)
              if (emptyIdx !== -1) {
                const next = [...slots]
                next[emptyIdx] = {
                  index: emptyIdx + 1,
                  name: output.name,
                  duration: audioBuffer.duration,
                  dbId,
                  sampleRate: audioBuffer.sampleRate,
                  channels: audioBuffer.numberOfChannels,
                  calibration: { ...DEFAULT_CALIBRATION },
                }
                saveSlotMetas(next)
                window.dispatchEvent(new StorageEvent("storage", {
                  key: "mimidi-audio-slots",
                  newValue: JSON.stringify(next),
                  storageArea: localStorage,
                }))
              } else {
                void saveFile(new Blob([buf], { type: "audio/webm" }), `${output.name}.webm`, [
                  { description: "Audio WebM", accept: { "audio/webm": [".webm"] } },
                ])
              }
            } catch { /* decode failed */ }
          })
        } else {
          const dbId = output.dbId ?? `plugin-audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
          if (output.dbId) {
            lab.applyUpdate(p => addAudioClipTrack(p, { name: output.name, dbId, duration: output.duration }))
          } else {
            void output.blob.arrayBuffer().then(async buf => {
              await saveSampleBuffer(dbId, buf)
              lab.applyUpdate(p => addAudioClipTrack(p, { name: output.name, dbId, duration: output.duration }))
            })
          }
        }
      }
    },
    notify: (message) => {
      if (pluginToastTimerRef.current) clearTimeout(pluginToastTimerRef.current)
      setPluginToast(message)
      pluginToastTimerRef.current = setTimeout(() => setPluginToast(""), 3500)
    },
    storeClip: async (blob, _name, _duration) => {
      const dbId = `plugin-clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const buf = await blob.arrayBuffer()
      await saveSampleBuffer(dbId, buf)
      return dbId
    },
    loadClip: async (dbId) => {
      const buf = await loadSampleBuffer(dbId)
      if (!buf) return null
      return new Blob([buf], { type: "audio/webm" })
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
    await lab.restartProject()
  }

  async function handleImportProjectFile(e: React.ChangeEvent<HTMLInputElement>) {
    tearDownSession()
    await lab.importProjectFile(e)
  }

  async function handleImportBundle(e: React.ChangeEvent<HTMLInputElement>) {
    tearDownSession()
    await lab.importBundle(e)
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

  // ────────────────────────────────────────────────────────────────────────────
  // ── edit-only workspace ──────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const editWorkspace = (
    <section className="timeline-workspace" aria-label={t.toolbar.timelineWorkspace}>
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-controls">
          {!isNoteEditMode && (
            <>
              <div className="ui-toggle-group" role="group" aria-label={`${t.toolbar.viewNotes}/${t.toolbar.viewTracks}`}>
                <button
                  aria-pressed={timelineView === "notes"}
                  disabled={lab.hasNoTracks}
                  onClick={() => setTimelineView("notes")}
                  title={lab.hasNoTracks ? t.toolbar.addMidiTrackDisabled : undefined}
                  type="button"
                >
                  {t.toolbar.viewNotes}
                </button>
                <button
                  aria-pressed={timelineView === "tracks"}
                  data-tutorial="view-tracks-tab"
                  onClick={() => setTimelineView("tracks")}
                  type="button"
                >
                  {t.toolbar.viewTracks}
                </button>
              </div>
              <span aria-hidden="true" className="perform-mode-transport-divider" />
            </>
          )}
          {timelineView === "notes" && !isNoteEditMode && (
            <select
              aria-label={t.toolbar.selectTrack}
              className="ui-select"
              value={lab.primaryTrack.id}
              onChange={(e) => switchActiveTrack(e.target.value)}
            >
              {lab.midiTracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          )}
          {timelineView === "tracks" &&
            (() => {
              const activeSamplerTrack = selectedLaneId
                ? getSamplerTracks(lab.project.timeline).find((m) => m.id === selectedLaneId)
                : null
              const activeAudioTrack = !activeSamplerTrack && selectedLaneId
                ? getAudioClipTracks(lab.project.timeline).find((t) => t.id === selectedLaneId)
                : null
              return activeSamplerTrack ? (
                <input
                  aria-label={t.toolbar.mixName}
                  className="edit-note-input edit-track-name-input"
                  defaultValue={activeSamplerTrack.name}
                  key={activeSamplerTrack.id}
                  onBlur={(e) => {
                    const name = e.target.value.trim()
                    if (name) lab.applyUpdate((p) => renameSamplerMix(p, activeSamplerTrack.id, name))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur()
                  }}
                  type="text"
                />
              ) : activeAudioTrack ? (
                <input
                  aria-label={t.toolbar.activeTrackName}
                  className="edit-note-input edit-track-name-input"
                  defaultValue={activeAudioTrack.name}
                  key={activeAudioTrack.id}
                  onBlur={(e) => {
                    const name = e.target.value.trim()
                    if (name) lab.applyUpdate((p) => renameTrack(p, activeAudioTrack.id, name))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur()
                  }}
                  type="text"
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
                <input
                  aria-label={t.toolbar.activeTrackName}
                  className="edit-note-input edit-track-name-input"
                  defaultValue={lab.primaryTrack.name}
                  key={lab.primaryTrack.id}
                  onBlur={(e) => lab.updateTrackName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur()
                  }}
                  type="text"
                />
              )
            })()}
          {mode === "edit-only" && timelineView === "notes" && lab.selectedRecordedNote && (
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
          )}
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
                {lab.midiTracks.length === 1 ? t.common.reset : t.common.delete}
              </button>
            </>
          }
          description={
            lab.midiTracks.length === 1
              ? t.dialogs.resetTracksMsg
              : t.dialogs.deleteTrackMsg
          }
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={
            lab.midiTracks.length === 1
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
  const projectWorkspace = (
    <section className="app-mock-screen" aria-label={t.project.currentProject}>
      <input
        accept=".json,application/json"
        hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => void handleImportProjectFile(e)}
        ref={lab.importInputRef}
        type="file"
      />
      <input
        accept=".mimidi"
        hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => void handleImportBundle(e)}
        ref={lab.importBundleRef}
        type="file"
      />
      <div className="project-compact-body">
        <div className="project-compact-name-row">
          <label className="project-compact-label" htmlFor="project-view-name">
            {t.project.projectLabel}
          </label>
          <input
            className="project-compact-name-input"
            data-tutorial="project-name-input"
            id="project-view-name"
            onChange={(e) => lab.updateProjectName(e.target.value)}
            placeholder={t.project.projectName}
            type="text"
            value={lab.project.name}
          />
          <p className="project-compact-stats">
            {getMidiTracks(lab.project.timeline).length} {t.project.tracksLabel}
            {" · "}
            {getSamplerTracks(lab.project.timeline).length} mix
            {getSamplerTracks(lab.project.timeline).length !== 1 ? "es" : ""}
            {" · "}
            {lab.allRecordedNotes.length} {t.project.notesLabel}
          </p>
        </div>

        <div className="project-compact-divider" />

        <div className="project-compact-grid">
          <button
            className="project-export-btn project-export-btn-play project-compact-btn-wide"
            disabled={
              lab.allRecordedNotes.length === 0 &&
              getSamplerTracks(lab.project.timeline).length === 0 &&
              !labPlayback.playbackTransport.isPlaying &&
              !labPlayback.isMixOnlyPlaying
            }
            onClick={() =>
              labPlayback.playbackTransport.isPlaying || labPlayback.isMixOnlyPlaying
                ? labPlayback.stopAll()
                : labPlayback.playAll(lab.project, true)
            }
            type="button"
          >
            {labPlayback.playbackTransport.isPlaying || labPlayback.isMixOnlyPlaying ? (
              <>
                <Square size={13} /> {t.common.stop}
              </>
            ) : (
              <>
                <Play size={13} /> {t.common.play}
              </>
            )}
          </button>
          <button
            className="project-export-btn project-export-btn-primary project-compact-btn-wide"
            data-tutorial="export-wav-button"
            disabled={
              (lab.allRecordedNotes.length === 0 &&
                getSamplerTracks(lab.project.timeline).length === 0) ||
              lab.isExportingAudio
            }
            onClick={handleExportProjectAudio}
            type="button"
          >
            <Download size={13} />
            {lab.isExportingAudio ? t.common.exporting : t.common.exportWav}
          </button>
          <button
            className="project-export-btn project-compact-btn-wide"
            onClick={() => void lab.exportBundle()}
            type="button"
          >
            <Folder size={13} /> {t.common.export}
          </button>
          <button
            className="project-export-btn project-compact-btn-wide"
            onClick={() => lab.importBundleRef.current?.click()}
            type="button"
          >
            <Upload size={13} /> {t.common.import}
          </button>
          <button
            className="project-export-btn project-export-btn-reset project-compact-btn-wide project-compact-btn-full"
            onClick={() => lab.setIsNewProjectConfirmOpen(true)}
            type="button"
          >
            {t.project.newProject}
          </button>
        </div>
      </div>
    </section>
  )

  if (mode === "project-only") {
    return (
      <>
        {projectWorkspace}
        <AppDialog
          actions={
            <>
              <button onClick={() => lab.setIsNewProjectConfirmOpen(false)} type="button">
                {t.common.cancel}
              </button>
              <button
                onClick={() => {
                  lab.setIsNewProjectConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                {t.dialogs.continueWithout}
              </button>
              <button
                className="app-dialog-confirm"
                onClick={() => {
                  lab.setIsNewProjectConfirmOpen(false)
                  void lab.exportBundle()
                  void handleRestartProject()
                }}
                type="button"
              >
                {t.dialogs.saveAndContinue}
              </button>
            </>
          }
          description={t.dialogs.newProjectMsg}
          onClose={() => lab.setIsNewProjectConfirmOpen(false)}
          open={lab.isNewProjectConfirmOpen}
          title={t.dialogs.newProjectTitle}
        />
      </>
    )
  }

  if (mode === "plugin-workspace") {
    return (
      <>
        <PluginWorkspaceHost
          api={pluginApi}
          language={language}
          pluginId={pluginId ?? ""}
        />
        {pluginToast && (
          <div role="status" className="plugin-toast">{pluginToast}</div>
        )}
      </>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── plugins-only ─────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  if (mode === "plugins-only") {
    const mimodInputRef = { current: null as HTMLInputElement | null }
    const supportsDirectoryPicker = "showDirectoryPicker" in window

    function handleMimodFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ""
      void externalPlugins.installFromFile(file).then((manifest) => {
        lab.applyUpdate((p) => ({
          ...p,
          pluginStates: { ...p.pluginStates, [manifest.id]: true },
        }))
      }).catch((err: unknown) => {
        console.error("[IMPORT .mimod]", err)
        alert(`No se pudo instalar el plugin:\n${err instanceof Error ? err.message : String(err)}`)
      })
    }

    function handlePluginFolder() {
      void externalPlugins.installFromFolder().then((manifest) => {
        lab.applyUpdate((p) => ({
          ...p,
          pluginStates: { ...p.pluginStates, [manifest.id]: true },
        }))
      }).catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("[PLUGIN FOLDER]", err)
        alert(`No se pudo cargar el plugin:\n${err instanceof Error ? err.message : String(err)}`)
      })
    }

    return (
      <section className="app-mock-screen" aria-label={t.project.pluginsSection}>
        <input
          accept=".mimod"
          hidden
          ref={mimodInputRef}
          type="file"
          onChange={handleMimodFile}
        />
        <header className="app-mock-toolbar">
          <div className="app-mock-toolbar-actions">
            <button
              className="ui-pill-btn"
              type="button"
              onClick={() => mimodInputRef.current?.click()}
            >
              <Upload size={14} />
              IMPORT .mimod
            </button>
            <a
              className="ui-pill-btn"
              download="mimidi-plugin-sdk.d.ts"
              href="/mimidi-plugin-sdk.d.ts"
              style={{ textDecoration: "none" }}
            >
              <Download size={14} />
              SDK .d.ts
            </a>
          </div>
        </header>
        <div className="app-plugin-list" aria-label={t.project.pluginList}>
          {externalPlugins.isRestoring && (
            <p style={{ padding: "0.75rem 1rem", opacity: 0.5, fontSize: "0.8rem" }}>
              Restaurando plugins...
            </p>
          )}
          {lab.registeredPlugins.map((plugin) => {
            const words = plugin.name.trim().split(/\s+/)
            const shortLabel =
              words.length === 1
                ? plugin.name.slice(0, 2).toUpperCase()
                : words.slice(0, 2).map((w) => w[0]).join("").toUpperCase()
            const isExt = plugin.isExternal
            const extEntry = externalPlugins.entries.find((e) => e.id === plugin.id)
            const isDev = extEntry?.isDev ?? false
            return (
              <article className={`ui-list-row${isExt ? " ui-list-row-ext" : ""}`} key={plugin.id}>
                <span
                  className="ui-badge"
                  aria-hidden="true"
                  title={isDev ? "Plugin de desarrollo (no persistido)" : isExt ? "Plugin externo (.mimod)" : "Plugin interno"}
                >
                  {shortLabel}
                </span>
                <div className="ui-plugin-copy">
                  <strong>{plugin.name}</strong>
                  <span>
                    {plugin.version} · {plugin.description}
                    {isDev && <em style={{ opacity: 0.6 }}> · dev</em>}
                    {isExt && !isDev && <em style={{ opacity: 0.6 }}> · externo</em>}
                  </span>
                </div>
                {plugin.instrumentCount > 0 && (
                  <label
                    className="ui-toggle"
                    aria-label={tpl(plugin.enabled ? t.project.disablePlugin : t.project.enablePlugin, { name: plugin.name })}
                  >
                    <input
                      checked={plugin.enabled}
                      onChange={() => lab.updatePluginEnabled(plugin.id, !plugin.enabled)}
                      type="checkbox"
                    />
                    <span />
                  </label>
                )}
                {isExt && (
                  <button
                    aria-label={`Desinstalar ${plugin.name}`}
                    className="ui-icon-btn ui-icon-btn-danger"
                    title="Desinstalar plugin externo"
                    type="button"
                    onClick={() => void externalPlugins.uninstall(plugin.id).then(() => {
                      lab.applyUpdate((p) => {
                        const { [plugin.id]: _, ...rest } = p.pluginStates
                        return { ...p, pluginStates: rest }
                      })
                    })}
                  >
                    <X size={14} />
                  </button>
                )}
                {plugin.workspace && onOpenPlugin ? (
                  <button
                    aria-label={`Abrir ${plugin.name}`}
                    className="ui-list-arrow ui-list-arrow-btn"
                    onClick={() => onOpenPlugin(plugin.id)}
                    type="button"
                  >
                    ›
                  </button>
                ) : (
                  <span className="ui-list-arrow" aria-hidden="true" style={{ opacity: plugin.workspace ? 1 : 0.2 }}>
                    ›
                  </span>
                )}
              </article>
            )
          })}
        </div>

        {/* ── Dev tools ──────────────────────────────────────────────────── */}
        <details className="app-devtools-section">
          <summary className="app-devtools-summary">
            Herramientas para desarrolladores
          </summary>
          <div className="app-devtools-body">
            <p className="app-devtools-warn">
              Solo disponible en Chrome y Edge. Carga un plugin desde una carpeta local sin empaquetar (.mimod).
            </p>
            <button
              className="ui-pill-btn"
              disabled={!supportsDirectoryPicker}
              title={supportsDirectoryPicker ? "Cargar plugin desde directorio de desarrollo" : "Solo disponible en Chrome y Edge"}
              type="button"
              onClick={handlePluginFolder}
            >
              <Folder size={14} />
              PLUGIN FOLDER
            </button>
          </div>
        </details>
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
              <button
                aria-label={
                  labPlayback.playbackTransport.isPlaying
                    ? t.common.stopPlayback
                    : t.common.play
                }
                className={`perform-mode-transport-button${labPlayback.playbackTransport.isPlaying ? " perform-mode-transport-button-active" : ""}`}
                data-tutorial="pad-play-button"
                disabled={labRecording.recordingState === "recording"}
                onClick={
                  labPlayback.playbackTransport.isPlaying
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

            <div className="ui-pad-pager" data-tutorial="pad-page-pager">
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
            </div>

            <button className="ui-pill-btn" data-tutorial="add-pad-track-button" onClick={lab.addPadTrack} type="button">
              {t.toolbar.addPadTrack}
            </button>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Grupo 3: Configuración y acciones estructurales */}
            <button
              aria-label={
                lab.project.padSettingsLocked
                  ? t.toolbar.unlockConfig
                  : t.toolbar.lockConfig
              }
              className="ui-icon-btn"
              data-tutorial="pad-lock-button"
              onClick={() =>
                lab.applyUpdate((p) => ({
                  ...p,
                  padSettingsLocked: !p.padSettingsLocked,
                }))
              }
              title={
                lab.project.padSettingsLocked
                  ? t.toolbar.unlockConfig
                  : t.toolbar.lockConfig
              }
              type="button"
            >
              {lab.project.padSettingsLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <button
              aria-label={tpl(t.toolbar.deleteTrackNamed, { name: lab.primaryTrack.name })}
              className="ui-icon-btn"
              onClick={lab.confirmRemoveActiveTrack}
              title={tpl(t.toolbar.deleteTrackNamed, { name: lab.primaryTrack.name })}
              type="button"
            >
              <Trash2 size={18} />
            </button>
            <PluginSlot api={pluginApi} language={language} pluginStates={lab.project.pluginStates} slotId="pad-toolbar" />
          </header>

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
              allRecordedNotesCount={lab.allRecordedNotes.length}
              instrumentCategories={instrumentCategories}
              isInstrumentDialogOpen={isInstrumentDialogOpen}
              isPlaying={labPlayback.playbackTransport.isPlaying}
              isRecording={labRecording.recordingState === "recording"}
              language={language}
              octave={labPerform.previewOctave}
              isArpEnabled={labPerform.arpeggiatorSettings.enabled}
              onAddTrack={lab.addTrack}
              onArpToggle={() =>
                labPerform.setArpeggiatorSettings((s) => ({ ...s, enabled: !s.enabled }))
              }
              onCloseInstrumentDialog={closeInstrumentDialog}
              onConfirmRemoveTrack={lab.confirmRemoveActiveTrack}
              onInstrumentCategoryChange={setInstrumentDialogCategory}
              onInstrumentDialogOpen={openInstrumentDialog}
              onInstrumentSelect={lab.updateTrackInstrumentId}
              onOctaveDown={() => labPerform.stepPreviewOctave(-1)}
              onOctaveUp={() => labPerform.stepPreviewOctave(1)}
              onPianoModeChange={labPerform.setPianoMode}
              pianoMode={labPerform.pianoMode}
              onPlayToggle={
                labPlayback.playbackTransport.isPlaying
                  ? labPlayback.playbackTransport.stop
                  : () =>
                      labPlayback.playbackTransport.play({
                        ...lab.project,
                        timeline: [lab.primaryTrack],
                      })
              }
              onRecordToggle={
                labRecording.recordingState === "recording"
                  ? () => labRecording.stopRecording()
                  : startRecording
              }
              onSelectNextTrack={() => lab.switchTrackByOffset(1)}
              onSelectPreviousTrack={() => lab.switchTrackByOffset(-1)}
              primaryTrackName={lab.primaryTrack.name}
              removeTrackDisabled={false}
              selectedInstrumentId={selectedInstrument.id}
              selectedInstrumentName={selectedInstrument.name}
              trackNextDisabled={lab.melodicTracks.at(-1)?.id === lab.primaryTrack.id}
              trackPreviousDisabled={lab.melodicTracks[0]?.id === lab.primaryTrack.id}
              visibleInstruments={dialogVisibleInstruments}
            />
            <PluginSlot api={pluginApi} language={language} pluginStates={lab.project.pluginStates} slotId="piano-toolbar" />
          </header>

          <section className="perform-workspace-card perform-workspace-card-piano">
            {performPiano}
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
          description={t.dialogs.pianoOptionsDesc}
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title={t.dialogs.pianoOptions}
        >
          <div className="perform-settings-dialog-v" data-tutorial="piano-options-content">
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
      trackCount={lab.midiTracks.length}
      tracks={lab.midiTracks}
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => void handleImportProjectFile(e)}
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
