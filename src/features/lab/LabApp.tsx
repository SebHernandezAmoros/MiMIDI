import type { ChangeEvent } from "react"
import { useCallback, useEffect, useState } from "react"
import "../../App.css"
import {
  updatePadSoundSetting,
  compactTrackNotesStart,
  getMidiTracks,
  getMidiTrackNotes,
  getSamplerTracks,
  renameSamplerMix,
  removeSamplerMix,
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
  mode?: LabAppMode
  settingsOpen?: boolean
  onSettingsClose?: () => void
}

function LabApp({ mode = "full", settingsOpen = false, onSettingsClose }: LabAppProps) {
  // ── Simple local UI state ────────────────────────────────────────────────────
  const [timelineSnapEnabled, setTimelineSnapEnabled] = useState(false)
  const [timelineSnapStep, setTimelineSnapStep] = useState(0.1)
  const [timelineView, setTimelineView] = useState<"notes" | "tracks">("notes")
  const [, setIsTimelineDragging] = useState(false)
  const [isTrackLaneFocused, setIsTrackLaneFocused] = useState(false)
  const [selectedMixId, setSelectedMixId] = useState<string | null>(null)
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
    if (timelineView !== "tracks") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTrackLaneFocused(false)
      setSelectedClipId(null)
    }
  }, [timelineView])

  // ── Coordinators: sequences that span multiple hooks ─────────────────────────
  function switchActiveTrack(trackId: string) {
    labPerform.stopArpeggiator()
    lab.switchActiveTrack(trackId)
  }

  function startRecording() {
    labPlayback.stopAll()
    labPerform.stopArpeggiator()
    startRecording()
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
    setIsTrackLaneFocused(true)
  }

  function selectMixLane(mixId: string) {
    setSelectedMixId(mixId)
    setIsTrackLaneFocused(true)
  }

  function exitTrackLaneFocus() {
    setSelectedClipId(null)
    setSelectedMixId(null)
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
    <section className="timeline-workspace" aria-label="Workspace de timeline">
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-controls">
          {!isNoteEditMode && (
            <div className="edit-view-switch" role="group" aria-label="Vista del timeline">
              <button
                aria-pressed={timelineView === "notes"}
                disabled={lab.hasNoTracks}
                onClick={() => setTimelineView("notes")}
                title={lab.hasNoTracks ? "Agrega una pista MIDI para editar notas" : undefined}
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
          )}
          {timelineView === "notes" && !isNoteEditMode && (
            <select
              aria-label="Seleccionar pista"
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
              const activeMix = selectedMixId
                ? getSamplerTracks(lab.project.timeline).find((m) => m.id === selectedMixId)
                : null
              return activeMix ? (
                <input
                  aria-label="Nombre del mix"
                  className="edit-note-input edit-track-name-input"
                  defaultValue={activeMix.name}
                  key={activeMix.id}
                  onBlur={(e) => {
                    const name = e.target.value.trim()
                    if (name) lab.applyUpdate((p) => renameSamplerMix(p, activeMix.id, name))
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
                  title="Agregar pista MIDI"
                  type="button"
                >
                  + Pista MIDI
                </button>
              ) : (
                <input
                  aria-label="Nombre de la pista activa"
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
                aria-label="Inicio (s)"
                className="edit-note-input"
                min="0"
                step="0.01"
                type="number"
                value={lab.selectedRecordedNote.startTime.toFixed(2)}
                onChange={(e) => lab.updateSelectedNoteStartTime(Number(e.target.value))}
              />
              <input
                aria-label="Duracion (s)"
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
                title="Duplicar nota"
                type="button"
              >
                <Copy size={15} />
              </button>
              <button
                className="ui-icon-btn"
                onClick={lab.revertSelectedNoteToLastCommit}
                title="Revertir nota"
                type="button"
              >
                <RotateCcw size={15} />
              </button>
              <button
                aria-label="Confirmar edición"
                className="ui-icon-btn"
                onClick={() => lab.setSelectedRecordedNoteId(null)}
                title="Listo"
                type="button"
              >
                <Check size={16} />
              </button>
            </>
          )}
          {!isNoteEditMode && (
            <button
              aria-label={
                labPlayback.playbackTransport.isPlaying ? "Detener reproduccion" : "Reproducir"
              }
              className="ui-icon-btn"
              disabled={
                lab.allRecordedNotes.length === 0 &&
                getSamplerTracks(lab.project.timeline).length === 0 &&
                !labPlayback.playbackTransport.isPlaying &&
                !labPlayback.isMixOnlyPlaying
              }
              onClick={() =>
                labPlayback.playbackTransport.isPlaying || labPlayback.isMixOnlyPlaying
                  ? labPlayback.stopAll()
                  : labPlayback.playAll(editNotesToPlay, timelineView === "tracks")
              }
              title={labPlayback.playbackTransport.isPlaying ? "Detener" : "Reproducir"}
              type="button"
            >
              {labPlayback.playbackTransport.isPlaying || labPlayback.isMixOnlyPlaying ? (
                <Square size={18} />
              ) : (
                <Play size={18} />
              )}
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

          {mode === "edit-only" &&
            !isNoteEditMode &&
            !(timelineView === "tracks" && isTrackLaneFocused) && (
              <>
                <span aria-hidden="true" className="perform-mode-transport-divider" />
                <button
                  aria-label="Reducir duración"
                  className="ui-icon-btn"
                  onClick={() => {
                    const next = Math.max(1, Number((editSettingsDuration - 0.1).toFixed(2)))
                    if (timelineView === "notes")
                      lab.updatePrimaryTrackNoteTimelineDurationValue(next)
                    else lab.updateProjectTrackTimelineDurationValue(next)
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
                    if (timelineView === "notes")
                      lab.updatePrimaryTrackNoteTimelineDurationValue(next)
                    else lab.updateProjectTrackTimelineDurationValue(next)
                  }}
                  title="Aumentar duración +0.1s"
                  type="button"
                >
                  <Plus size={18} />
                </button>
              </>
            )}
          {!(timelineView === "tracks" && isTrackLaneFocused) && (
            <>
              <button
                aria-label="Deshacer"
                className="ui-icon-btn"
                disabled={!lab.canUndo}
                onClick={lab.undoProjectEdit}
                title="Deshacer"
                type="button"
              >
                <Undo2 size={18} />
              </button>
              <button
                aria-label="Rehacer"
                className="ui-icon-btn"
                disabled={!lab.canRedo}
                onClick={lab.redoProjectEdit}
                title="Rehacer"
                type="button"
              >
                <Redo2 size={18} />
              </button>
            </>
          )}
          {timelineView === "notes" && (
            <button
              aria-label="Eliminar nota seleccionada"
              className="ui-icon-btn"
              disabled={!lab.selectedRecordedNote}
              onClick={() =>
                lab.selectedRecordedNote && lab.removeRecordedNote(lab.selectedRecordedNote.id)
              }
              title="Eliminar nota"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          )}
          {timelineView === "tracks" &&
            isTrackLaneFocused &&
            (() => {
              const activeMix = selectedMixId
                ? getSamplerTracks(lab.project.timeline).find((m) => m.id === selectedMixId)
                : null
              const lastMixClip = activeMix?.clips.at(-1)
              const dupDisabled = activeMix ? !lastMixClip : !lab.activeClip
              const isMuted = activeMix ? activeMix.muted : lab.primaryTrack.muted
              const isSolo = activeMix ? (activeMix.solo ?? false) : lab.primaryTrack.solo
              return (
                <>
                  <button
                    aria-label={isMuted ? "Activar audio" : "Silenciar"}
                    className={`ui-icon-btn edit-mute-solo-btn${isMuted ? " edit-mute-solo-btn-active" : ""}`}
                    onClick={() => {
                      if (activeMix) {
                        lab.updateSamplerTrackMutedHandler(activeMix.id, !activeMix.muted)
                      } else {
                        lab.togglePrimaryTrackMuted()
                      }
                    }}
                    title={isMuted ? "Activar audio" : "Silenciar"}
                    type="button"
                  >
                    <VolumeX size={18} />
                  </button>
                  <button
                    aria-label="Solo"
                    className={`ui-icon-btn edit-mute-solo-btn${isSolo ? " edit-mute-solo-btn-active" : ""}`}
                    onClick={() => {
                      if (activeMix) {
                        lab.updateSamplerTrackSoloHandler(activeMix.id, !isSolo)
                      } else {
                        lab.togglePrimaryTrackSolo()
                      }
                    }}
                    title="Solo"
                    type="button"
                  >
                    Solo
                  </button>
                  <button
                    aria-label="Duplicar último clip"
                    className="ui-icon-btn"
                    disabled={dupDisabled}
                    onClick={() => {
                      if (activeMix && lastMixClip) {
                        lab.duplicateSamplerClipHandler(activeMix.id, lastMixClip.id)
                      } else if (lab.activeClip) {
                        lab.duplicateMidiClipHandler(lab.primaryTrack.id, lab.activeClip.id)
                      }
                    }}
                    title={
                      activeMix
                        ? `Duplicar clip de ${activeMix.name}`
                        : `Duplicar clip de ${lab.primaryTrack.name}`
                    }
                    type="button"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    aria-label="Eliminar clip seleccionado"
                    className="ui-icon-btn"
                    disabled={!canDeleteSelectedClip}
                    onClick={() => setIsClipDeleteConfirmOpen(true)}
                    title={
                      selectedClipId
                        ? "Eliminar clip seleccionado"
                        : "Selecciona un clip para eliminar"
                    }
                    type="button"
                  >
                    <X size={18} />
                  </button>
                  <button
                    aria-label={activeMix ? "Eliminar mix" : "Eliminar pista"}
                    className="ui-icon-btn"
                    onClick={() => {
                      if (activeMix) {
                        setIsMixDeleteConfirmOpen(true)
                      } else {
                        lab.confirmRemoveActiveTrack()
                      }
                    }}
                    title={
                      activeMix
                        ? `Eliminar ${activeMix.name} del timeline`
                        : `Eliminar ${lab.primaryTrack.name}`
                    }
                    type="button"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    aria-label="Terminar edición de tracks"
                    className="ui-icon-btn"
                    onClick={exitTrackLaneFocus}
                    title="Listo"
                    type="button"
                  >
                    <Check size={18} />
                  </button>
                </>
              )
            })()}
        </div>
      </header>

      {timelineView === "tracks" ? (
        <TrackTimelinePreview
          activeTrackId={lab.primaryTrack.id}
          onDragStateChange={setIsTimelineDragging}
          onRenameMix={(mixId, name) =>
            lab.applyUpdate((p) => renameSamplerMix(p, mixId, name))
          }
          onSelectClip={(info) => {
            setSelectedClipId(info)
            if (info) setIsTrackLaneFocused(true)
          }}
          onSelectMix={selectMixLane}
          onSelectTrack={selectTrackLane}
          onUpdateMidiClipStartTime={lab.updateMidiClipStartTimeHandler}
          onUpdateSamplerClipStartTime={lab.updateSamplerClipStartTimeHandler}
          playheadTime={labPlayback.absolutePlayheadTime}
          selectedClipId={selectedClipId}
          selectedMixId={selectedMixId}
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
          description="Ajusta la duracion del timeline y las opciones de visualizacion."
          onClose={onSettingsClose ?? (() => {})}
          open={settingsOpen}
          title="Opciones — Editor"
        >
          <div className="control-group">
            <label>Duracion ({timelineView === "notes" ? "notas" : "tracks"}) (s)</label>
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
              Ajustar al contenido
            </button>
          </div>
          {timelineView === "notes" && (
            <div className="control-group">
              <button onClick={lab.compactPrimaryTrackNoteTimelineStart} type="button">
                Compactar inicio
              </button>
            </div>
          )}

          <div className="edit-settings-track-section">
            <span className="perform-instrument-dialog-title">
              Pista activa — {lab.primaryTrack.name}
            </span>
            <div className="edit-settings-track-row">
              <label className="edit-settings-track-label" htmlFor="edit-track-volume">
                Volumen
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
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={lab.acceptRemoveActiveTrack}
                type="button"
              >
                {lab.midiTracks.length === 1 ? "Reiniciar pistas" : "Eliminar"}
              </button>
            </>
          }
          description={
            lab.midiTracks.length === 1
              ? "Se eliminaran todas las notas y quedara una pista vacia. Los mixes del timeline no se borran."
              : "La pista activa y sus notas se eliminaran de esta toma."
          }
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={
            lab.midiTracks.length === 1
              ? "Reiniciar pistas MIDI?"
              : `Eliminar ${lab.primaryTrack.name}?`
          }
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
                  if (id) lab.applyUpdate((p) => removeSamplerMix(p, id))
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
              <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  lab.setIsRestartConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                Reiniciar
              </button>
            </>
          }
          description="Al eliminar esta pista solo quedara una. El proyecto se reiniciara y se perderan todas las notas grabadas."
          onClose={() => lab.setIsRestartConfirmOpen(false)}
          open={lab.isRestartConfirmOpen}
          title="Reiniciar proyecto?"
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => setIsClipDeleteConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={confirmDeleteSelectedClip}
                type="button"
              >
                Eliminar clip
              </button>
            </>
          }
          description="El clip y sus notas se eliminaran del timeline. Esta accion se puede deshacer con Ctrl+Z."
          onClose={() => setIsClipDeleteConfirmOpen(false)}
          open={isClipDeleteConfirmOpen}
          title="Eliminar clip?"
        />
      </>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── project workspace ────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const projectWorkspace = (
    <section className="app-mock-screen" aria-label="Proyecto actual">
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
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-copy">
          <strong>{lab.project.name || "Proyecto"}</strong>
          {lab.projectMessage && <span>{lab.projectMessage}</span>}
        </div>
      </header>
      <div className="project-compact-body">
        <div className="project-compact-name-row">
          <label className="project-compact-label" htmlFor="project-view-name">
            Nombre
          </label>
          <input
            className="project-compact-name-input"
            id="project-view-name"
            onChange={(e) => lab.updateProjectName(e.target.value)}
            placeholder="Nombre del proyecto"
            type="text"
            value={lab.project.name}
          />
          <p className="project-compact-stats">
            {getMidiTracks(lab.project.timeline).length} pista
            {getMidiTracks(lab.project.timeline).length !== 1 ? "s" : ""}
            {" · "}
            {getSamplerTracks(lab.project.timeline).length} mix
            {getSamplerTracks(lab.project.timeline).length !== 1 ? "es" : ""}
            {" · "}
            {lab.allRecordedNotes.length} nota
            {lab.allRecordedNotes.length !== 1 ? "s" : ""}
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
                <Square size={13} /> Detener
              </>
            ) : (
              <>
                <Play size={13} /> Reproducir
              </>
            )}
          </button>
          <button
            className="project-export-btn project-export-btn-primary project-compact-btn-wide"
            disabled={
              (lab.allRecordedNotes.length === 0 &&
                getSamplerTracks(lab.project.timeline).length === 0) ||
              lab.isExportingAudio
            }
            onClick={handleExportProjectAudio}
            type="button"
          >
            <Download size={13} />
            {lab.isExportingAudio ? "Exportando..." : "Exportar WAV"}
          </button>
          <button
            className="project-export-btn project-compact-btn-wide"
            onClick={() => void lab.exportBundle()}
            type="button"
          >
            <Folder size={13} /> Exportar
          </button>
          <button
            className="project-export-btn project-compact-btn-wide"
            onClick={() => lab.importBundleRef.current?.click()}
            type="button"
          >
            <Upload size={13} /> Importar
          </button>
          <button
            className="project-export-btn project-export-btn-reset project-compact-btn-wide project-compact-btn-full"
            onClick={() => lab.setIsNewProjectConfirmOpen(true)}
            type="button"
          >
            <Plus size={13} /> Nuevo proyecto
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
                Cancelar
              </button>
              <button
                onClick={() => {
                  lab.setIsNewProjectConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                Continuar sin guardar
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
                Guardar y continuar
              </button>
            </>
          }
          description="El proyecto actual se perderá si no lo guardas primero."
          onClose={() => lab.setIsNewProjectConfirmOpen(false)}
          open={lab.isNewProjectConfirmOpen}
          title="¿Empezar un nuevo proyecto?"
        />
      </>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ── plugins-only ─────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
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
          {lab.registeredPlugins.map((plugin) => {
            const words = plugin.name.trim().split(/\s+/)
            const shortLabel =
              words.length === 1
                ? plugin.name.slice(0, 2).toUpperCase()
                : words
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
            return (
              <article className="ui-list-row" key={plugin.id}>
                <span className="ui-badge" aria-hidden="true">
                  {shortLabel}
                </span>
                <div className="ui-plugin-copy">
                  <strong>{plugin.name}</strong>
                  <span>
                    {plugin.version} · {plugin.description}
                  </span>
                </div>
                <label
                  className="ui-toggle"
                  aria-label={`${plugin.enabled ? "Desactivar" : "Activar"} ${plugin.name}`}
                >
                  <input
                    checked={plugin.enabled}
                    onChange={() => lab.updatePluginEnabled(plugin.id, !plugin.enabled)}
                    type="checkbox"
                  />
                  <span />
                </label>
                <span className="ui-list-arrow" aria-hidden="true">
                  ›
                </span>
              </article>
            )
          })}
        </div>
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
        <section className="app-mock-screen" aria-label="Workspace SMC Pad">
          <header className="app-mock-toolbar">
            <div className="perform-mode-transport" aria-label="Controles de grabación">
              <button
                aria-label={
                  labRecording.recordingState === "recording"
                    ? "Detener grabación"
                    : "Iniciar grabación"
                }
                className={`perform-mode-transport-button${labRecording.recordingState === "recording" ? " perform-mode-transport-button-active" : ""}`}
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
                    ? "Detener reproducción"
                    : "Reproducir"
                }
                className={`perform-mode-transport-button${labPlayback.playbackTransport.isPlaying ? " perform-mode-transport-button-active" : ""}`}
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
              <span className="ui-pad-pager-label">
                {padPage + 1} / {Math.ceil(smcPadSounds.length / 8)}
              </span>
              <button
                aria-label="Página siguiente"
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

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            <div className="app-mock-toolbar-controls">
              <select
                aria-label="Pista activa"
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
              <button className="ui-pill-btn" onClick={lab.addPadTrack} type="button">
                + Track
              </button>
              <button
                aria-label={
                  lab.project.padSettingsLocked
                    ? "Desbloquear configuración"
                    : "Bloquear configuración"
                }
                className="ui-icon-btn"
                onClick={() =>
                  lab.applyUpdate((p) => ({
                    ...p,
                    padSettingsLocked: !p.padSettingsLocked,
                  }))
                }
                title={
                  lab.project.padSettingsLocked
                    ? "Desbloquear configuración"
                    : "Bloquear configuración"
                }
                type="button"
              >
                {lab.project.padSettingsLocked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
              <button
                aria-label={`Eliminar ${lab.primaryTrack.name}`}
                className="ui-icon-btn"
                onClick={lab.confirmRemoveActiveTrack}
                title={`Eliminar ${lab.primaryTrack.name}`}
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
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const velocity = Math.max(
                      0.35,
                      1 - ((e.clientY - rect.top) / rect.height) * 0.65,
                    )
                    handleSamplerPad(pad.id, velocity)
                  }}
                  type="button"
                >
                  <span className="ui-smc-btn-num">{padPage * 8 + i + 1}</span>
                  <span className="ui-smc-btn-label">{pad.label}</span>
                  <span className="ui-smc-btn-desc">{pad.description}</span>
                </button>
                {!lab.project.padSettingsLocked && (
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
              <button onClick={lab.cancelRemoveActiveTrack} type="button">
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={lab.acceptRemoveActiveTrack}
                type="button"
              >
                Eliminar
              </button>
            </>
          }
          description="La pista activa y sus notas se eliminaran de esta toma."
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={`Eliminar ${lab.primaryTrack.name}?`}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  lab.setIsRestartConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                Reiniciar
              </button>
            </>
          }
          description="Al eliminar esta pista solo quedara una. El proyecto se reiniciara y se perderan todas las notas grabadas."
          onClose={() => lab.setIsRestartConfirmOpen(false)}
          open={lab.isRestartConfirmOpen}
          title="Reiniciar proyecto?"
        />

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
                description={`Síntesis y comportamiento de ${snd.label}.`}
                onClose={() => setConfigSoundId(null)}
                open
                title={`Config — ${snd.label}`}
              >
                <div className="audio-sampler-settings">
                  <section className="ui-list-section">
                    <div className="edit-settings-track-row">
                      <label className="edit-settings-track-label" htmlFor="ps-volume">
                        Volumen
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
                        Distorsión
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
                          Tono
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
                          Longitud
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
                        <span className="ui-list-label">Flicker (LFO)</span>
                        <label className="ui-toggle" aria-label="Flicker LFO">
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
        <section className="perform-workspace-primary" aria-label="Panel principal Perform">
          <header className="app-mock-toolbar">
            <PerformResponsiveToolbar
              activeInstrumentCategory={instrumentDialogCategory}
              allRecordedNotesCount={lab.allRecordedNotes.length}
              instrumentCategories={instrumentCategories}
              isInstrumentDialogOpen={isInstrumentDialogOpen}
              isPlaying={labPlayback.playbackTransport.isPlaying}
              isRecording={labRecording.recordingState === "recording"}
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
                  : labPlayback.playRecording
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
              trackNextDisabled={lab.midiTracks.at(-1)?.id === lab.primaryTrack.id}
              trackPreviousDisabled={lab.midiTracks[0]?.id === lab.primaryTrack.id}
              visibleInstruments={dialogVisibleInstruments}
            />
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
                Cancelar
              </button>
              <button
                className="app-dialog-confirm"
                onClick={lab.acceptRemoveActiveTrack}
                type="button"
              >
                Eliminar
              </button>
            </>
          }
          description="La pista activa y sus notas se eliminaran de esta toma."
          onClose={lab.cancelRemoveActiveTrack}
          open={lab.isTrackRemovalConfirmOpen}
          title={`Eliminar ${lab.primaryTrack.name}?`}
        />

        <AppDialog
          actions={
            <>
              <button onClick={() => lab.setIsRestartConfirmOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className="ui-btn-danger"
                onClick={() => {
                  lab.setIsRestartConfirmOpen(false)
                  void handleRestartProject()
                }}
                type="button"
              >
                Reiniciar
              </button>
            </>
          }
          description="Al eliminar esta pista solo quedara una. El proyecto se reiniciara y se perderan todas las notas grabadas."
          onClose={() => lab.setIsRestartConfirmOpen(false)}
          open={lab.isRestartConfirmOpen}
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
                    className={`ui-pill-btn${labPerform.selectedChordType === type ? " ui-pill-btn-active" : ""}`}
                    key={type}
                    onClick={() => labPerform.setSelectedChordType(type)}
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
                    className={`ui-pill-btn${labPerform.arpeggiatorSettings.mode === m ? " ui-pill-btn-active" : ""}`}
                    key={m}
                    onClick={() => labPerform.setArpeggiatorSettings((s) => ({ ...s, mode: m }))}
                    type="button"
                  >
                    {m === "up"
                      ? "↑ Up"
                      : m === "down"
                        ? "↓ Down"
                        : m === "up-down"
                          ? "↕ Up-Down"
                          : m === "random"
                            ? "? Random"
                            : "≡ Chord"}
                  </button>
                ))}
              </div>
            </div>
            <div className="perform-settings-dialog-section">
              <span className="perform-instrument-dialog-title">ARP — Rate</span>
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
                <span className="perform-instrument-dialog-title">ARP — Gate</span>
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
                <span className="perform-instrument-dialog-title">ARP — Octavas</span>
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
                ARP Latch
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
              {lab.projectMessage || "Listo para tocar y grabar."}
            </p>
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

  // ────────────────────────────────────────────────────────────────────────────
  // ── full mode (lab fallback) ─────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────
  const projectPanel = (
    <LabProjectPanel
      activeInstrumentCategory={activeInstrumentCategory}
      envelopeHelpText="Ajusta ADSR de la pista activa. Los cambios afectan las notas nuevas y quedan guardados con la grabacion."
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
  )
}

export default LabApp
