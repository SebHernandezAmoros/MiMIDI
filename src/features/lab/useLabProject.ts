import type { ChangeEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { saveFile } from "../../application/use-cases/saveFile"
import { createProjectAudioExport } from "../../application/use-cases/projectAudioTransfer"
import {
  createProjectBundleExport,
  importProjectBundleFile,
} from "../../application/use-cases/projectBundleTransfer"
import {
  createProjectJsonExport,
  importProjectJsonFile,
} from "../../application/use-cases/projectJsonTransfer"
import {
  getProjectSessionRestoreMessage,
  loadProjectSessionInitialProject,
  saveProjectSession,
} from "../../application/use-cases/projectSessionPersistence"
import {
  resolveInitialActiveTrackId,
  resolveFirstProjectActiveTrackId,
  resolvePrimaryTrack,
  resolveSelectedRecordedNote,
} from "../../application/use-cases/projectSelection"
import type { ADSREnvelope } from "../../engine/audio/audioEngine"
import type { MathematicalInstrument, MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import { loadSlotMetas, saveSlotMetas, NUM_SLOTS } from "../../engine/audio/sampleModel"
import { deleteSampleBuffer } from "../../engine/audio/sampleStorage"
import { isSmcPadRecordedNote } from "../../engine/midi/events"
import {
  clearAllTrackNotes,
  compactTrackNotesStart,
  createProjectTrack,
  duplicateMidiClip,
  duplicateSamplerClip,
  getActiveClip,
  getMidiTrackNotes,
  getMidiTracks,
  getProjectTrackTimelineLength,
  getSamplerTracks,
  getTrackNoteTimelineContentLength,
  getTrackNoteTimelineLength,
  getTracksTimelineLength,
  getTrackVolumeAutomationValue,
  isTrackAudible,
  removeMidiClip,
  removeSamplerClip,
  renameProject,
  renameTrack,
  resetProject,
  updateAudioClipStartTime,
  updateAudioClipTrackMuted,
  updateMidiClipStartTime,
  updateNoteInTrack,
  updateProjectPluginEnabled,
  updateProjectTrackTimelineDuration,
  updateSamplerClipStartTime,
  updateSamplerTrackMuted,
  updateSamplerTrackSolo,
  updateTrackEnvelope,
  updateTrackInstrument,
  updateTrackMuted,
  updateTrackNoteTimelineDuration,
  updateTrackPan,
  updateTrackSolo,
  updateTrackVolumeAutomation,
  updateTrackVolume,
  type MusicalProject,
  type TrackVolumeAutomation,
} from "../../engine/project/projectModel"
import { findRegisteredPluginByInstrumentId, getRegisteredPluginSummaries, subscribeToPluginRegistry } from "../../engine/plugins/pluginRegistry"
import { useProjectHistory } from "../history/useProjectHistory"
import {
  resolveRedoProjectHistoryAction,
  resolveUndoProjectHistoryAction,
} from "../project-session/projectSessionHistory"
import {
  resolveRecordedNoteDuplication,
  resolveRecordedNoteRemoval,
  resolveRecordedNoteRevertToLastCommit,
  resolveRecordedNoteSafePatch,
  resolveRecordedNoteUpdateBlock,
} from "../project-session/projectSessionNoteEditing"
import { resolveTrackCreation } from "../project-session/projectSessionTrackCreation"
import {
  resolveActiveTrackRemoval,
  type ActiveTrackRemovalResolution,
  resolveStepsTrackRemoval,
} from "../project-session/projectSessionTrackRemoval"
import {
  formatAudioExportFailedMessage,
  formatAudioExportedMessage,
  formatBundleExportFailedMessage,
  formatBundleExportedMessage,
  formatBundleImportFailedMessage,
  formatBundlePackagingMessage,
  formatJsonExportedMessage,
  formatJsonImportFailedMessage,
  formatOfflineAudioUnsupportedMessage,
  formatPluginEnabledMessage,
  formatProjectImportedMessage,
  formatProjectImportingMessage,
  formatProjectRestartedMessage,
  formatSessionClearedMessage,
} from "../project-session/projectSessionMessages"

export type LabAppMode =
  | "full"
  | "edit-only"
  | "project-only"
  | "perform-only"
  | "plugins-only"
  | "plugin-workspace"
  | "sampler-only"

const HISTORY_LIMIT = 20
const EMPTY_MIDI_TRACK = createProjectTrack(0)

function getInitialProject() {
  return loadProjectSessionInitialProject()
}

function getInitialProjectMessage() {
  return getProjectSessionRestoreMessage()
}

function areProjectsEquivalent(a: MusicalProject, b: MusicalProject) {
  return JSON.stringify(a) === JSON.stringify(b)
}

type UseLabProjectOptions = {
  mode: LabAppMode
  timelineSnapEnabled: boolean
  timelineSnapStep: number
}

export function useLabProject({
  mode,
  timelineSnapEnabled,
  timelineSnapStep,
}: UseLabProjectOptions) {
  const [activeTrackId, setActiveTrackId] = useState(() => {
    return resolveInitialActiveTrackId(getInitialProject(), mode)
  })
  const [selectedRecordedNoteId, setSelectedRecordedNoteId] = useState<string | null>(null)
  const [projectMessage, setProjectMessage] = useState(getInitialProjectMessage)
  const [isExportingAudio, setIsExportingAudio] = useState(false)
  const [isTrackRemovalConfirmOpen, setIsTrackRemovalConfirmOpen] = useState(false)
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false)
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false)

  const {
    state: project,
    undoStack,
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
  const importBundleRef = useRef<HTMLInputElement | null>(null)

  // ── Derived values ──────────────────────────────────────────────────────────
  const midiTracks = getMidiTracks(project.timeline)
  const hasNoTracks = midiTracks.length === 0
  const melodicTracks = midiTracks.filter((t) => t.trackType === "melodic")
  const percussionTracks = midiTracks.filter((t) => t.trackType === "percussion")
  const stepsTracks = midiTracks.filter((t) => t.trackType === "steps")

  const primaryTrack = resolvePrimaryTrack({
    activeTrackId,
    emptyTrack: EMPTY_MIDI_TRACK,
    melodicTracks,
    midiTracks,
    mode,
    percussionTracks,
  })

  const allRecordedNotes = midiTracks
    .filter((t) => t.trackType !== "steps")
    .flatMap((track) => getMidiTrackNotes(track))
  const projectTrackTimelineLength = getProjectTrackTimelineLength(project)
  const primaryTrackNoteTimelineLength = getTrackNoteTimelineLength(primaryTrack)
  const primaryTrackNotes = getMidiTrackNotes(primaryTrack)
  const activeClip = getActiveClip(primaryTrack)
  const noteCount = primaryTrackNotes.length
  const isPrimaryTrackAudible = isTrackAudible(primaryTrack, midiTracks)
  const selectedRecordedNote = resolveSelectedRecordedNote(
    primaryTrack,
    selectedRecordedNoteId,
  )

  const [pluginRegistryVersion, setPluginRegistryVersion] = useState(0)
  useEffect(() => subscribeToPluginRegistry(() => setPluginRegistryVersion((v) => v + 1)), [])

  const registeredPlugins = useMemo(
    () => getRegisteredPluginSummaries(project.pluginStates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.pluginStates, pluginRegistryVersion],
  )

  let selectedNoteHistoryStatus: "modificada" | "sin-cambios" | null = null
  if (selectedRecordedNoteId && selectedRecordedNote) {
    const latestSnapshot = undoStack.at(-1)
    if (!latestSnapshot) {
      selectedNoteHistoryStatus = "sin-cambios"
    } else {
      const snapshotTrack = getMidiTracks(latestSnapshot.timeline).find(
        (t) => t.id === primaryTrack.id,
      )
      const snapshotNote = snapshotTrack
        ? getMidiTrackNotes(snapshotTrack).find((n) => n.id === selectedRecordedNoteId)
        : undefined
      selectedNoteHistoryStatus =
        !snapshotNote ||
        snapshotNote.startTime !== selectedRecordedNote.startTime ||
        snapshotNote.duration !== selectedRecordedNote.duration
          ? "modificada"
          : "sin-cambios"
    }
  }

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    saveProjectSession(project)
  }, [project])

  useEffect(() => {
    const tracks = getMidiTracks(project.timeline)
    if (tracks.length > 0 && !tracks.some((t) => t.id === activeTrackId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTrackId(tracks[0].id)
    }
  }, [project.timeline, activeTrackId])

  useEffect(() => {
    if (!isTrackRemovalConfirmOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsTrackRemovalConfirmOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isTrackRemovalConfirmOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
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
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // ── Utility ─────────────────────────────────────────────────────────────────
  function getTrackAutomationVolumeAtTime(time: number) {
    return getTrackVolumeAutomationValue(primaryTrack.volumeAutomation, time)
  }

  // ── Track selection ──────────────────────────────────────────────────────────
  function switchActiveTrack(trackId: string) {
    setActiveTrackId(trackId)
    setSelectedRecordedNoteId(null)
  }

  function switchTrackByOffset(offset: -1 | 1) {
    const tracks = mode === "perform-only" ? melodicTracks : midiTracks
    const currentIndex = tracks.findIndex((track) => track.id === primaryTrack.id)
    if (currentIndex < 0) {
      if (tracks[0]) switchActiveTrack(tracks[0].id)
      return
    }
    const nextTrack = tracks[currentIndex + offset]
    if (!nextTrack) return
    switchActiveTrack(nextTrack.id)
  }

  // ── Track management ─────────────────────────────────────────────────────────
  function addTrack() {
    applyUpdate((currentProject) => {
      const result = resolveTrackCreation({
        project: currentProject,
        trackType: "melodic",
      })
      setActiveTrackId(result.activeTrackId)
      setProjectMessage(result.message)
      return result.project
    })
  }

  function addPadTrack() {
    applyUpdate((currentProject) => {
      const result = resolveTrackCreation({
        project: currentProject,
        trackType: "percussion",
      })
      setActiveTrackId(result.activeTrackId)
      setProjectMessage(result.message)
      return result.project
    })
  }

  const lastCreatedStepsTrackIdRef = useRef<string | null>(null)

  function addStepsTrack() {
    lastCreatedStepsTrackIdRef.current = null
    applyUpdate((currentProject) => {
      const result = resolveTrackCreation({
        project: currentProject,
        trackType: "steps",
      })
      lastCreatedStepsTrackIdRef.current = result.createdTrackId
      setProjectMessage(result.message)
      return result.project
    })
    // El updater de setState corre síncronamente → el ref ya tiene el ID
  }

  function removeStepsTrack(trackId: string) {
    const removalResult: {
      current: ReturnType<typeof resolveStepsTrackRemoval>
    } = {
      current: null,
    }
    applyUpdate((currentProject) => {
      removalResult.current = resolveStepsTrackRemoval({
        project: currentProject,
        trackId,
      })
      return removalResult.current?.project ?? currentProject
    })
    if (!removalResult.current) return
    setProjectMessage(removalResult.current.message)
  }

  function removeActiveTrack() {
    if (hasNoTracks) return

    const removalResult: { current: ActiveTrackRemovalResolution | null } = {
      current: null,
    }
    applyUpdate((currentProject) => {
      removalResult.current = resolveActiveTrackRemoval({
        activeTrackId: primaryTrack.id,
        project: currentProject,
      })
      return removalResult.current?.project ?? currentProject
    })

    if (!removalResult.current) return
    setActiveTrackId(removalResult.current.activeTrackId)
    setSelectedRecordedNoteId(null)
    setProjectMessage(removalResult.current.message)
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

  // ── Track properties ─────────────────────────────────────────────────────────
  function updateProjectName(name: string) {
    applyUpdate((p) => renameProject(p, name.trim() || "MiMIDI Project"))
  }

  function updateTrackName(name: string) {
    applyUpdate((p) => renameTrack(p, primaryTrack.id, name.trim() || "Track 1"))
  }

  function updateTrackInstrumentId(instrumentId: MathematicalInstrumentId) {
    applyUpdate((p) => updateTrackInstrument(p, primaryTrack.id, instrumentId))
  }

  function updateTrackInstrumentCategory(
    category: MathematicalInstrument["category"],
    availableInstruments: MathematicalInstrument[],
  ) {
    const nextInstrument = availableInstruments.find((i) => i.category === category)
    if (!nextInstrument) return
    updateTrackInstrumentId(nextInstrument.id)
  }

  function updatePluginEnabled(pluginId: string, enabled: boolean) {
    const pluginName =
      registeredPlugins.find((plugin) => plugin.id === pluginId)?.name ?? pluginId
    applyUpdate((p) => updateProjectPluginEnabled(p, pluginId, enabled))
    setProjectMessage(formatPluginEnabledMessage(pluginName, enabled))
  }

  function updatePrimaryTrackEnvelope(parameter: keyof ADSREnvelope, value: number) {
    if (!Number.isFinite(value)) return
    const nextValue =
      parameter === "sustain"
        ? Math.min(Math.max(value, 0), 1)
        : Math.min(Math.max(value, 0.001), 2)
    applyUpdate((p) => updateTrackEnvelope(p, primaryTrack.id, { [parameter]: nextValue }))
  }

  function updatePrimaryTrackVolume(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((p) => updateTrackVolume(p, primaryTrack.id, Math.min(Math.max(value, 0), 1.5)))
  }

  function updatePrimaryTrackPan(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((p) => updateTrackPan(p, primaryTrack.id, value))
  }

  function togglePrimaryTrackMuted() {
    applyUpdate((p) => updateTrackMuted(p, primaryTrack.id, !primaryTrack.muted))
  }

  function togglePrimaryTrackSolo() {
    applyUpdate((p) => updateTrackSolo(p, primaryTrack.id, !primaryTrack.solo))
  }

  function updatePrimaryTrackVolumeAutomation(automation: TrackVolumeAutomation) {
    applyUpdate((p) => updateTrackVolumeAutomation(p, primaryTrack.id, automation))
  }

  // ── Note editing ─────────────────────────────────────────────────────────────
  function selectRecordedNote(noteId: string) {
    setSelectedRecordedNoteId(noteId)
  }

  function removeRecordedNote(noteId: string) {
    const removalResult: {
      current: ReturnType<typeof resolveRecordedNoteRemoval> | null
    } = {
      current: null,
    }
    applyUpdate((currentProject) => {
      removalResult.current = resolveRecordedNoteRemoval({
        noteId,
        project: currentProject,
        selectedRecordedNoteId,
        trackId: primaryTrack.id,
        trackName: primaryTrack.name,
      })
      return removalResult.current.project
    })
    if (!removalResult.current) return
    setSelectedRecordedNoteId(removalResult.current.selectedRecordedNoteId)
    setProjectMessage(removalResult.current.message)
  }

  function updateRecordedNote(
    noteId: string,
    patch: Partial<{ startTime: number; duration: number }>,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const noteToUpdate = primaryTrackNotes.find((note) => note.id === noteId)
    if (!noteToUpdate) return

    const updateBlock = resolveRecordedNoteUpdateBlock({
      historyMode,
      isDurationUpdate: typeof patch.duration === "number",
      isSmcPadNote: isSmcPadRecordedNote(noteToUpdate),
    })
    if (updateBlock.blocked) {
      if (updateBlock.message) setProjectMessage(updateBlock.message)
      return
    }

    const safePatch = resolveRecordedNoteSafePatch({
      patch,
      timelineSnapEnabled,
      timelineSnapStep,
    })

    if (historyMode === "transient") {
      applyTransientUpdate((p) => updateNoteInTrack(p, primaryTrack.id, noteId, safePatch))
      return
    }
    commitTransientUpdate((p) => updateNoteInTrack(p, primaryTrack.id, noteId, safePatch))
  }

  function duplicateSelectedRecordedNote() {
    if (!selectedRecordedNote) return
    const duplicationResult: {
      current: ReturnType<typeof resolveRecordedNoteDuplication> | null
    } = {
      current: null,
    }
    applyUpdate((currentProject) => {
      duplicationResult.current = resolveRecordedNoteDuplication({
        noteId: selectedRecordedNote.id,
        offsetSeconds: timelineSnapEnabled ? timelineSnapStep : 0.05,
        project: currentProject,
        trackId: primaryTrack.id,
        trackName: primaryTrack.name,
      })
      return duplicationResult.current.project
    })
    if (!duplicationResult.current) return
    setProjectMessage(duplicationResult.current.message)
  }

  function revertSelectedNoteToLastCommit() {
    if (!selectedRecordedNote) return
    const revertResult = resolveRecordedNoteRevertToLastCommit({
      currentNote: selectedRecordedNote,
      project,
      snapshots: undoStack,
      trackId: primaryTrack.id,
      trackName: primaryTrack.name,
    })
    if (revertResult.applied) {
      applyUpdate(() => revertResult.project)
    }
    setProjectMessage(revertResult.message)
  }

  function updateSelectedNoteStartTime(value: number) {
    if (!selectedRecordedNote) return
    updateRecordedNote(selectedRecordedNote.id, { startTime: Number.isFinite(value) ? value : 0 })
  }

  function updateSelectedNoteDuration(value: number) {
    if (!selectedRecordedNote) return
    const updateBlock = resolveRecordedNoteUpdateBlock({
      historyMode: "commit",
      isDurationUpdate: true,
      isSmcPadNote: isSmcPadRecordedNote(selectedRecordedNote),
    })
    if (updateBlock.blocked) {
      if (updateBlock.message) setProjectMessage(updateBlock.message)
      return
    }
    updateRecordedNote(selectedRecordedNote.id, { duration: Number.isFinite(value) ? value : 0.01 })
  }

  // ── Clip handlers ────────────────────────────────────────────────────────────
  function updateMidiClipStartTimeHandler(
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const quantize = (value: number) =>
      timelineSnapEnabled ? Math.round(value / timelineSnapStep) * timelineSnapStep : value
    const safeStartTime = Math.max(0, quantize(startTime))
    if (historyMode === "transient") {
      applyTransientUpdate((p) => updateMidiClipStartTime(p, trackId, clipId, safeStartTime))
      return
    }
    commitTransientUpdate((p) => updateMidiClipStartTime(p, trackId, clipId, safeStartTime))
  }

  function updateSamplerClipStartTimeHandler(
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const snapped = timelineSnapEnabled
      ? Math.max(0, Math.round(startTime / timelineSnapStep) * timelineSnapStep)
      : Math.max(0, startTime)
    if (historyMode === "transient") {
      applyTransientUpdate((p) => updateSamplerClipStartTime(p, trackId, clipId, snapped))
    } else {
      commitTransientUpdate((p) => updateSamplerClipStartTime(p, trackId, clipId, snapped))
    }
  }

  function duplicateMidiClipHandler(trackId: string, clipId: string) {
    applyUpdate((p) => duplicateMidiClip(p, trackId, clipId))
  }

  function duplicateSamplerClipHandler(trackId: string, clipId: string) {
    applyUpdate((p) => duplicateSamplerClip(p, trackId, clipId))
  }

  function removeMidiClipHandler(trackId: string, clipId: string) {
    applyUpdate((p) => removeMidiClip(p, trackId, clipId))
  }

  function removeSamplerClipHandler(trackId: string, clipId: string) {
    applyUpdate((p) => removeSamplerClip(p, trackId, clipId))
  }

  function updateAudioClipStartTimeHandler(
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const snapped = timelineSnapEnabled
      ? Math.max(0, Math.round(startTime / timelineSnapStep) * timelineSnapStep)
      : Math.max(0, startTime)
    if (historyMode === "transient") {
      applyTransientUpdate((p) => updateAudioClipStartTime(p, trackId, clipId, snapped))
    } else {
      commitTransientUpdate((p) => updateAudioClipStartTime(p, trackId, clipId, snapped))
    }
  }

  function updateAudioClipTrackMutedHandler(trackId: string, muted: boolean) {
    applyUpdate((p) => updateAudioClipTrackMuted(p, trackId, muted))
  }

  function updateSamplerTrackMutedHandler(trackId: string, muted: boolean) {
    applyUpdate((p) => updateSamplerTrackMuted(p, trackId, muted))
  }

  function updateSamplerTrackSoloHandler(trackId: string, solo: boolean) {
    applyUpdate((p) => updateSamplerTrackSolo(p, trackId, solo))
  }

  // ── Timeline duration ────────────────────────────────────────────────────────
  function updateProjectTrackTimelineDurationValue(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((p) => updateProjectTrackTimelineDuration(p, value))
  }

  function resetProjectTrackTimelineDuration() {
    applyUpdate((p) => updateProjectTrackTimelineDuration(p, getTracksTimelineLength(p.timeline)))
    setProjectMessage("Duracion del timeline ajustada al contenido.")
  }

  function updatePrimaryTrackNoteTimelineDurationValue(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((p) => updateTrackNoteTimelineDuration(p, primaryTrack.id, value))
  }

  function resetPrimaryTrackNoteTimelineDuration() {
    applyUpdate((p) =>
      updateTrackNoteTimelineDuration(p, primaryTrack.id, (() => {
        const currentTrack =
          getMidiTracks(p.timeline).find((track) => track.id === primaryTrack.id) ?? primaryTrack
        return getTrackNoteTimelineContentLength(currentTrack)
      })()),
    )
    setProjectMessage(`Duracion del timeline de notas ajustada al contenido de ${primaryTrack.name}.`)
  }

  function compactPrimaryTrackNoteTimelineStart() {
    if (!activeClip || activeClip.notes.length === 0) {
      setProjectMessage(`No hay notas en ${primaryTrack.name} para compactar.`)
      return
    }
    const earliestStartTime = activeClip.notes.reduce(
      (min, note) => Math.min(min, note.startTime),
      Number.POSITIVE_INFINITY,
    )
    if (!Number.isFinite(earliestStartTime) || earliestStartTime <= 0) {
      setProjectMessage(`Las notas de ${primaryTrack.name} ya empiezan en 0s.`)
      return
    }
    applyUpdate((p) => compactTrackNotesStart(p, primaryTrack.id))
    setProjectMessage(`Inicio del timeline de notas compactado en ${primaryTrack.name}.`)
  }

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  function undoProjectEdit() {
    const result = resolveUndoProjectHistoryAction(undo(), activeTrackId)
    if (!result.applied) {
      setProjectMessage(result.message)
      return
    }
    setSelectedRecordedNoteId(null)
    setActiveTrackId(result.activeTrackId)
    setProjectMessage(result.message)
  }

  function redoProjectEdit() {
    const result = resolveRedoProjectHistoryAction(redo(), activeTrackId)
    if (!result.applied) {
      setProjectMessage(result.message)
      return
    }
    setSelectedRecordedNoteId(null)
    setActiveTrackId(result.activeTrackId)
    setProjectMessage(result.message)
  }

  useEffect(() => {
    undoActionRef.current = undoProjectEdit
    redoActionRef.current = redoProjectEdit
  })

  // ── Session management ───────────────────────────────────────────────────────
  function clearSession() {
    applyUpdate((p) => clearAllTrackNotes(p))
    setSelectedRecordedNoteId(null)
    setProjectMessage(formatSessionClearedMessage())
  }

  async function clearSamplerSlots() {
    const slots = loadSlotMetas()
    for (const slot of slots) {
      if (slot) await deleteSampleBuffer(slot.dbId)
    }
    saveSlotMetas(Array<null>(NUM_SLOTS).fill(null))
  }

  async function restartProject() {
    await clearSamplerSlots()
    applyUpdate((p) => resetProject(p))
    setActiveTrackId("track-1")
    setSelectedRecordedNoteId(null)
    setProjectMessage(formatProjectRestartedMessage())
  }

  // ── Import / Export ──────────────────────────────────────────────────────────
  async function exportProject() {
    const { blob, fileName, types } = createProjectJsonExport(project)
    await saveFile(blob, fileName, types)
    setProjectMessage(formatJsonExportedMessage())
  }

  async function exportProjectAudio(masterVolume: number) {
    if (allRecordedNotes.length === 0 && getSamplerTracks(project.timeline).length === 0) return
    if (isExportingAudio) return

    if (typeof OfflineAudioContext === "undefined") {
      setProjectMessage(formatOfflineAudioUnsupportedMessage())
      return
    }

    setIsExportingAudio(true)
    try {
      const { blob, duration, fileName, types } = await createProjectAudioExport(
        project,
        masterVolume,
      )
      await saveFile(blob, fileName, types)
      setProjectMessage(formatAudioExportedMessage(duration))
    } catch {
      setProjectMessage(formatAudioExportFailedMessage())
    } finally {
      setIsExportingAudio(false)
    }
  }

  async function exportBundle() {
    try {
      setProjectMessage(formatBundlePackagingMessage())
      const { blob, fileName, types } = await createProjectBundleExport(project)
      await saveFile(blob, fileName, types)
      setProjectMessage(formatBundleExportedMessage())
    } catch {
      setProjectMessage(formatBundleExportFailedMessage())
    }
  }

  async function importBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setProjectMessage(formatProjectImportingMessage())
      const importedProject = await importProjectBundleFile(file)
      replaceState(importedProject)
      setActiveTrackId(resolveFirstProjectActiveTrackId(importedProject))
      setSelectedRecordedNoteId(null)
      setProjectMessage(formatProjectImportedMessage(importedProject.name))
    } catch {
      setProjectMessage(formatBundleImportFailedMessage())
    } finally {
      event.target.value = ""
    }
  }

  async function importProjectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const importedProject = await importProjectJsonFile(file)
      replaceState(importedProject)
      setActiveTrackId(resolveFirstProjectActiveTrackId(importedProject))
      setSelectedRecordedNoteId(null)
      setProjectMessage(formatProjectImportedMessage(importedProject.name))
    } catch {
      setProjectMessage(formatJsonImportFailedMessage())
    } finally {
      event.target.value = ""
    }
  }

  // ── Expose findRegisteredPluginByInstrumentId for instrument catalog ──────────
  function getPluginForInstrument(instrumentId: MathematicalInstrumentId) {
    return findRegisteredPluginByInstrumentId(instrumentId, project.pluginStates)
  }

  return {
    // history
    project,
    canUndo,
    canRedo,
    undoStack,
    applyUpdate,
    applyTransientUpdate,
    commitTransientUpdate,
    replaceState,
    // selection
    activeTrackId,
    selectedRecordedNoteId,
    setSelectedRecordedNoteId,
    // derived
    midiTracks,
    hasNoTracks,
    melodicTracks,
    percussionTracks,
    stepsTracks,
    primaryTrack,
    allRecordedNotes,
    projectTrackTimelineLength,
    primaryTrackNoteTimelineLength,
    primaryTrackNotes,
    activeClip,
    noteCount,
    isPrimaryTrackAudible,
    selectedRecordedNote,
    selectedNoteHistoryStatus,
    registeredPlugins,
    // UI state
    projectMessage,
    setProjectMessage,
    isExportingAudio,
    // dialogs
    isTrackRemovalConfirmOpen,
    isRestartConfirmOpen,
    isNewProjectConfirmOpen,
    setIsNewProjectConfirmOpen,
    setIsRestartConfirmOpen,
    // refs
    importInputRef,
    importBundleRef,
    // utility
    getTrackAutomationVolumeAtTime,
    getPluginForInstrument,
    // actions — track
    addTrack,
    addPadTrack,
    addStepsTrack,
    lastCreatedStepsTrackIdRef,
    removeStepsTrack,
    switchActiveTrack,
    switchTrackByOffset,
    updateProjectName,
    updateTrackName,
    updateTrackInstrumentId,
    updateTrackInstrumentCategory,
    updatePluginEnabled,
    updatePrimaryTrackEnvelope,
    updatePrimaryTrackVolume,
    updatePrimaryTrackPan,
    togglePrimaryTrackMuted,
    togglePrimaryTrackSolo,
    updatePrimaryTrackVolumeAutomation,
    confirmRemoveActiveTrack,
    cancelRemoveActiveTrack,
    acceptRemoveActiveTrack,
    // actions — notes
    selectRecordedNote,
    removeRecordedNote,
    updateRecordedNote,
    duplicateSelectedRecordedNote,
    revertSelectedNoteToLastCommit,
    updateSelectedNoteStartTime,
    updateSelectedNoteDuration,
    // actions — clips
    updateMidiClipStartTimeHandler,
    updateSamplerClipStartTimeHandler,
    updateAudioClipStartTimeHandler,
    updateAudioClipTrackMutedHandler,
    duplicateMidiClipHandler,
    duplicateSamplerClipHandler,
    removeMidiClipHandler,
    removeSamplerClipHandler,
    updateSamplerTrackMutedHandler,
    updateSamplerTrackSoloHandler,
    // actions — timeline duration
    updateProjectTrackTimelineDurationValue,
    resetProjectTrackTimelineDuration,
    updatePrimaryTrackNoteTimelineDurationValue,
    resetPrimaryTrackNoteTimelineDuration,
    compactPrimaryTrackNoteTimelineStart,
    // actions — undo/redo
    undoProjectEdit,
    redoProjectEdit,
    // actions — session
    clearSession,
    restartProject,
    // actions — import/export
    exportProject,
    exportProjectAudio,
    exportBundle,
    importBundle,
    importProjectFile,
  }
}
