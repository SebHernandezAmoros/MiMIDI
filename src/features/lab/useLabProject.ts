import type { ChangeEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { exportProjectAudio as exportProjectAudioUseCase } from "../../application/use-cases/exportProjectAudio"
import { exportProjectBundle } from "../../application/use-cases/exportProjectBundle"
import { saveFile } from "../../application/use-cases/saveFile"
import { importProjectBundle } from "../../application/use-cases/importProjectBundle"
import type { ADSREnvelope } from "../../engine/audio/audioEngine"
import type { MathematicalInstrument, MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import { loadSlotMetas, saveSlotMetas, NUM_SLOTS } from "../../engine/audio/sampleModel"
import { deleteSampleBuffer } from "../../engine/audio/sampleStorage"
import { isSmcPadRecordedNote } from "../../engine/midi/events"
import {
  appendPadTrack,
  appendTrack,
  clearAllTrackNotes,
  compactTrackNotesStart,
  createDefaultProject,
  createProjectTrack,
  duplicateMidiClip,
  duplicateNoteInTrack,
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
  parseImportedProject,
  removeMidiClip,
  removeNoteFromTrack,
  removeSamplerClip,
  removeTrack,
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
  type ProjectTrackType,
  type TrackVolumeAutomation,
} from "../../engine/project/projectModel"
import { loadStoredProject, saveProject } from "../../engine/project/projectStorage"
import { findRegisteredPluginByInstrumentId, getRegisteredPluginSummaries, subscribeToPluginRegistry } from "../../engine/plugins/pluginRegistry"
import { useProjectHistory } from "../history/useProjectHistory"

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
  return loadStoredProject() ?? createDefaultProject()
}

function getInitialProjectMessage() {
  const storedProject = loadStoredProject()
  if (!storedProject) return ""
  return getMidiTracks(storedProject.timeline).some((track) => getMidiTrackNotes(track).length > 0)
    ? `Proyecto restaurado: ${storedProject.name}.`
    : ""
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
    const project = getInitialProject()
    const tracks = getMidiTracks(project.timeline)
    const targetType: ProjectTrackType = mode === "sampler-only" ? "percussion" : "melodic"
    return tracks.find((t) => t.trackType === targetType)?.id ?? tracks[0]?.id ?? "track-1"
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

  const primaryTrack = (() => {
    if (mode === "sampler-only") {
      return (
        percussionTracks.find((t) => t.id === activeTrackId) ??
        percussionTracks[0] ??
        midiTracks[0] ??
        EMPTY_MIDI_TRACK
      )
    }
    if (mode === "perform-only") {
      return (
        melodicTracks.find((t) => t.id === activeTrackId) ??
        melodicTracks[0] ??
        EMPTY_MIDI_TRACK
      )
    }
    return (
      midiTracks.find((t) => t.id === activeTrackId) ??
      melodicTracks[0] ??
      midiTracks[0] ??
      EMPTY_MIDI_TRACK
    )
  })()

  const allRecordedNotes = midiTracks.flatMap((track) => getMidiTrackNotes(track))
  const projectTrackTimelineLength = getProjectTrackTimelineLength(project)
  const primaryTrackNoteTimelineLength = getTrackNoteTimelineLength(primaryTrack)
  const primaryTrackNotes = getMidiTrackNotes(primaryTrack)
  const activeClip = getActiveClip(primaryTrack)
  const noteCount = primaryTrackNotes.length
  const isPrimaryTrackAudible = isTrackAudible(primaryTrack, midiTracks)
  const selectedRecordedNote =
    primaryTrackNotes.find((note) => note.id === selectedRecordedNoteId) ?? null

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
    saveProject(project)
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

  function removeActiveTrack() {
    if (hasNoTracks) return
    const isPercussion = primaryTrack.trackType === "percussion"
    const isLastPercussionTrack = isPercussion && percussionTracks.length === 1
    const isLastMidiTrack = midiTracks.length === 1
    const trackName = primaryTrack.name
    const currentIndex = midiTracks.findIndex((track) => track.id === primaryTrack.id)
    const fallbackTrackId =
      midiTracks[currentIndex - 1]?.id ?? midiTracks[currentIndex + 1]?.id
    const freshPadId = `track-${midiTracks.length}`

    applyUpdate((currentProject) => {
      const withoutTrack = removeTrack(currentProject, primaryTrack.id)
      if (isLastPercussionTrack) return appendPadTrack(withoutTrack)
      if (!isLastMidiTrack) return withoutTrack
      return { ...withoutTrack, timeline: [createProjectTrack(1), ...withoutTrack.timeline] }
    })
    setActiveTrackId(
      isLastPercussionTrack
        ? freshPadId
        : isLastMidiTrack
          ? "track-1"
          : (fallbackTrackId ?? ""),
    )
    setSelectedRecordedNoteId(null)
    setProjectMessage(
      isLastPercussionTrack
        ? `${trackName} eliminada. Pad 1 listo para usar.`
        : isLastMidiTrack
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
    setProjectMessage(enabled ? `Plugin activado: ${pluginName}.` : `Plugin desactivado: ${pluginName}.`)
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
    applyUpdate((p) => removeNoteFromTrack(p, primaryTrack.id, noteId))
    if (selectedRecordedNoteId === noteId) setSelectedRecordedNoteId(null)
    setProjectMessage(`Nota eliminada de ${primaryTrack.name}.`)
  }

  function updateRecordedNote(
    noteId: string,
    patch: Partial<{ startTime: number; duration: number }>,
    historyMode: "transient" | "commit" = "commit",
  ) {
    const noteToUpdate = primaryTrackNotes.find((note) => note.id === noteId)
    if (!noteToUpdate) return

    if (typeof patch.duration === "number" && isSmcPadRecordedNote(noteToUpdate)) {
      if (historyMode === "commit") {
        setProjectMessage("Los golpes SMC Pad se pueden mover, pero no redimensionar.")
      }
      return
    }

    const quantize = (value: number) =>
      timelineSnapEnabled ? Math.round(value / timelineSnapStep) * timelineSnapStep : value
    const safePatch: Partial<{ startTime: number; duration: number }> = {}
    if (typeof patch.startTime === "number") safePatch.startTime = Math.max(0, quantize(patch.startTime))
    if (typeof patch.duration === "number") safePatch.duration = Math.max(0.01, quantize(patch.duration))

    if (historyMode === "transient") {
      applyTransientUpdate((p) => updateNoteInTrack(p, primaryTrack.id, noteId, safePatch))
      return
    }
    commitTransientUpdate((p) => updateNoteInTrack(p, primaryTrack.id, noteId, safePatch))
  }

  function duplicateSelectedRecordedNote() {
    if (!selectedRecordedNote) return
    applyUpdate((p) =>
      duplicateNoteInTrack(
        p,
        primaryTrack.id,
        selectedRecordedNote.id,
        timelineSnapEnabled ? timelineSnapStep : 0.05,
      ),
    )
    setProjectMessage(`Nota duplicada en ${primaryTrack.name}.`)
  }

  function revertSelectedNoteToLastCommit() {
    if (!selectedRecordedNoteId) return
    const candidateIndex = [...undoStack]
      .map((snapshot) => ({ snapshot }))
      .reverse()
      .find(({ snapshot }) => {
        const snapshotTrack = getMidiTracks(snapshot.timeline).find(
          (track) => track.id === primaryTrack.id,
        )
        const snapshotNote = snapshotTrack
          ? getMidiTrackNotes(snapshotTrack).find((note) => note.id === selectedRecordedNoteId)
          : undefined
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
    const snapshotNote = snapshotTrack
      ? getMidiTrackNotes(snapshotTrack).find((note) => note.id === selectedRecordedNoteId)
      : undefined

    if (!snapshotNote) {
      setProjectMessage("No se encontro version anterior para esta nota.")
      return
    }

    applyUpdate((p) =>
      updateNoteInTrack(p, primaryTrack.id, selectedRecordedNoteId, {
        startTime: snapshotNote.startTime,
        duration: snapshotNote.duration,
      }),
    )
    setProjectMessage(`Nota revertida en ${primaryTrack.name}.`)
  }

  function updateSelectedNoteStartTime(value: number) {
    if (!selectedRecordedNote) return
    updateRecordedNote(selectedRecordedNote.id, { startTime: Number.isFinite(value) ? value : 0 })
  }

  function updateSelectedNoteDuration(value: number) {
    if (!selectedRecordedNote) return
    if (isSmcPadRecordedNote(selectedRecordedNote)) {
      setProjectMessage("Los golpes SMC Pad se pueden mover, pero no redimensionar.")
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

  // ── Session management ───────────────────────────────────────────────────────
  function clearSession() {
    applyUpdate((p) => clearAllTrackNotes(p))
    setSelectedRecordedNoteId(null)
    setProjectMessage("Notas limpiadas. Pistas y nombre conservados.")
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
    setProjectMessage("Proyecto reiniciado desde cero.")
  }

  // ── Import / Export ──────────────────────────────────────────────────────────
  async function exportProject() {
    const projectJson = JSON.stringify(project, null, 2)
    const blob = new Blob([projectJson], { type: "application/json" })
    const suggestedName = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`
    await saveFile(blob, suggestedName, [
      { description: "Proyecto MiMIDI", accept: { "application/json": [".json"] } },
    ])
    setProjectMessage("Proyecto exportado a JSON.")
  }

  async function exportProjectAudio(masterVolume: number) {
    if (allRecordedNotes.length === 0 && getSamplerTracks(project.timeline).length === 0) return
    if (isExportingAudio) return

    if (typeof OfflineAudioContext === "undefined") {
      setProjectMessage("Este navegador no soporta exportacion offline de audio.")
      return
    }

    setIsExportingAudio(true)
    try {
      const { blob, duration, fileName } = await exportProjectAudioUseCase(project, {
        bitDepth: 32,
        float: true,
        masterVolume,
      })
      await saveFile(blob, fileName, [
        { description: "Audio WAV", accept: { "audio/wav": [".wav"] } },
      ])
      setProjectMessage(`Audio exportado a WAV (${duration.toFixed(2)}s).`)
    } catch {
      setProjectMessage("No se pudo exportar el audio del proyecto.")
    } finally {
      setIsExportingAudio(false)
    }
  }

  async function exportBundle() {
    try {
      setProjectMessage("Empaquetando proyecto...")
      const blob = await exportProjectBundle(project)
      const suggestedName = `${project.name.replace(/\s+/g, "-").toLowerCase()}.mimidi`
      await saveFile(blob, suggestedName, [
        { description: "Bundle MiMIDI", accept: { "application/octet-stream": [".mimidi"] } },
      ])
      setProjectMessage("Proyecto guardado como .mimidi (incluye muestras).")
    } catch {
      setProjectMessage("No se pudo exportar el bundle.")
    }
  }

  async function importBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setProjectMessage("Importando proyecto...")
      const importedProject = await importProjectBundle(file)
      replaceState(importedProject)
      setActiveTrackId(getMidiTracks(importedProject.timeline)[0]?.id ?? "track-1")
      setSelectedRecordedNoteId(null)
      setProjectMessage(`Proyecto importado: ${importedProject.name}.`)
    } catch {
      setProjectMessage("No se pudo importar el archivo .mimidi.")
    } finally {
      event.target.value = ""
    }
  }

  async function importProjectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const projectJson = await file.text()
      const importedProject = parseImportedProject(projectJson)
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
