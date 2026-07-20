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
import { clearSampleSlots } from "../../application/use-cases/sampleSlots"
import {
  getProjectSessionRestoreMessage,
  loadProjectSessionInitialProject,
  saveProjectSession,
} from "../../application/use-cases/projectSessionPersistence"
import {
  resolvePrimaryTrack,
  resolveSelectedRecordedNote,
} from "../../application/use-cases/projectSelection"
import type { MathematicalInstrument, MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import {
  createProjectTrack,
  getMidiTracks,
  resetProject,
  updateProjectPluginEnabled,
} from "../../engine/project/projectModel"
import { findRegisteredPluginByInstrumentId, getRegisteredPluginSummaries, subscribeToPluginRegistry } from "../../engine/plugins/pluginRegistry"
import { resolveTrackCreation } from "../project-session/projectSessionTrackCreation"
import {
  resolveActiveTrackRemoval,
  type ActiveTrackRemovalResolution,
  resolveStepsTrackRemoval,
} from "../project-session/projectSessionTrackRemoval"
import {
  formatPluginEnabledMessage,
} from "../project-session/projectSessionMessages"
import { resolveInstrumentIdByCategory } from "../project-session/projectSessionInstrumentSelection"
import { resolveActiveTrackIdAfterTrackListChange } from "../project-session/projectSessionTrackSelection"
import { getBeatsTracks, getPadTracks } from "../../domain/project/percussionTrackRoles"
import { useProjectAudioClipTrackMixEditing } from "../project-session/useProjectAudioClipTrackMixEditing"
import { useProjectAudioTransfer } from "../project-session/useProjectAudioTransfer"
import { useProjectClipDuplication } from "../project-session/useProjectClipDuplication"
import { useProjectClipRemoval } from "../project-session/useProjectClipRemoval"
import { useProjectClipStartTimeEditing } from "../project-session/useProjectClipStartTimeEditing"
import { useProjectBundleTransfer } from "../project-session/useProjectBundleTransfer"
import { useProjectHistoryController } from "../project-session/useProjectHistoryController"
import { useProjectJsonTransfer } from "../project-session/useProjectJsonTransfer"
import { useProjectMetadataEditing } from "../project-session/useProjectMetadataEditing"
import { useProjectMessages } from "../project-session/useProjectMessages"
import { useProjectNoteEditing } from "../project-session/useProjectNoteEditing"
import { useProjectPrimaryTrackMixEditing } from "../project-session/useProjectPrimaryTrackMixEditing"
import { useProjectPrimaryTrackSoundEditing } from "../project-session/useProjectPrimaryTrackSoundEditing"
import { useProjectPersistenceSync } from "../project-session/useProjectPersistenceSync"
import { useProjectSelection } from "../project-session/useProjectSelection"
import { useProjectSessionLifecycle } from "../project-session/useProjectSessionLifecycle"
import { useProjectSamplerTrackMixEditing } from "../project-session/useProjectSamplerTrackMixEditing"
import { useProjectSessionState } from "../project-session/useProjectSessionState"
import { useProjectTrackSelection } from "../project-session/useProjectTrackSelection"
import { useProjectTimelineDurationEditing } from "../project-session/useProjectTimelineDurationEditing"
import { useProjectTimelineReadModel } from "../project-session/useProjectTimelineReadModel"

export type LabAppMode =
  | "full"
  | "edit-only"
  | "project-only"
  | "perform-only"
  | "plugins-only"
  | "plugin-workspace"
  | "sampler-only"

const EMPTY_MIDI_TRACK = createProjectTrack(0)

function getInitialProject() {
  return loadProjectSessionInitialProject()
}

function getInitialProjectMessage() {
  return getProjectSessionRestoreMessage()
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
  const {
    activeTrackId,
    selectedRecordedNoteId,
    setActiveTrackId,
    setSelectedRecordedNoteId,
  } = useProjectSelection({
    loadInitialProject: getInitialProject,
    mode,
  })
  const { projectMessage, setProjectMessage } = useProjectMessages(
    getInitialProjectMessage,
  )
  const [isTrackRemovalConfirmOpen, setIsTrackRemovalConfirmOpen] = useState(false)
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false)
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false)

  const {
    project,
    undoStack,
    canUndo,
    canRedo,
    applyUpdate,
    applyTransientUpdate,
    commitTransientUpdate,
    undo,
    redo,
    replaceState,
  } = useProjectSessionState(getInitialProject())

  const undoActionRef = useRef<() => void>(() => {})
  const redoActionRef = useRef<() => void>(() => {})
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const importBundleRef = useRef<HTMLInputElement | null>(null)

  // ── Derived values ──────────────────────────────────────────────────────────
  const midiTracks = getMidiTracks(project.timeline)
  const hasNoTracks = midiTracks.length === 0
  const melodicTracks = midiTracks.filter((t) => t.trackType === "melodic")
  const percussionTracks = midiTracks.filter((t) => t.trackType === "percussion")
  const padTracks = getPadTracks(midiTracks)
  const beatsTracks = getBeatsTracks(midiTracks)
  const stepsTracks = midiTracks.filter((t) => t.trackType === "steps")

  const primaryTrack = resolvePrimaryTrack({
    activeTrackId,
    emptyTrack: EMPTY_MIDI_TRACK,
    melodicTracks,
    midiTracks,
    mode,
    percussionTracks,
  })

  const {
    activeClip,
    allRecordedNotes,
    getTrackAutomationVolumeAtTime,
    isPrimaryTrackAudible,
    noteCount,
    primaryTrackNoteTimelineLength,
    primaryTrackNotes,
    projectTrackTimelineLength,
  } = useProjectTimelineReadModel({
    midiTracks,
    primaryTrack,
    project,
  })
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

  // ── Effects ─────────────────────────────────────────────────────────────────
  useProjectPersistenceSync({
    project,
    saveProjectSession,
  })

  useEffect(() => {
    const tracks = getMidiTracks(project.timeline)
    const nextActiveTrackId = resolveActiveTrackIdAfterTrackListChange({
      currentTrackId: activeTrackId,
      tracks,
    })
    if (nextActiveTrackId) {
      setActiveTrackId(nextActiveTrackId)
    }
  }, [project.timeline, activeTrackId, setActiveTrackId])

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
  // ── Track selection ──────────────────────────────────────────────────────────
  const {
    switchActiveTrack,
    switchTrackByOffset,
  } = useProjectTrackSelection({
    currentTrackId: primaryTrack.id,
    setActiveTrackId,
    setSelectedRecordedNoteId,
    tracks: mode === "perform-only" ? melodicTracks : midiTracks,
  })

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

  function addBeatsTrack() {
    applyUpdate((currentProject) => {
      const result = resolveTrackCreation({
        project: currentProject,
        trackType: "beats",
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
  const {
    updateProjectName,
    updateTrackName,
  } = useProjectMetadataEditing({
    applyUpdate,
    primaryTrack,
  })

  function updateTrackInstrumentCategory(
    category: MathematicalInstrument["category"],
    availableInstruments: MathematicalInstrument[],
  ) {
    const instrumentId = resolveInstrumentIdByCategory(category, availableInstruments)
    if (!instrumentId) return
    updateTrackInstrumentId(instrumentId)
  }

  function updatePluginEnabled(pluginId: string, enabled: boolean) {
    const pluginName =
      registeredPlugins.find((plugin) => plugin.id === pluginId)?.name ?? pluginId
    applyUpdate((p) => updateProjectPluginEnabled(p, pluginId, enabled))
    setProjectMessage(formatPluginEnabledMessage(pluginName, enabled))
  }

  const {
    togglePrimaryTrackMuted,
    togglePrimaryTrackSolo,
    updatePrimaryTrackPan,
    updatePrimaryTrackVolume,
    updatePrimaryTrackVolumeAutomation,
  } = useProjectPrimaryTrackMixEditing({
    applyUpdate,
    primaryTrack,
  })

  const {
    updatePrimaryTrackEnvelope,
    updateTrackInstrumentId,
  } = useProjectPrimaryTrackSoundEditing({
    applyUpdate,
    primaryTrack,
  })

  // ── Note editing ─────────────────────────────────────────────────────────────
  const {
    duplicateSelectedRecordedNote,
    removeRecordedNote,
    revertSelectedNoteToLastCommit,
    selectRecordedNote,
    selectedNoteHistoryStatus,
    updateRecordedNote,
    updateSelectedNoteDuration,
    updateSelectedNoteStartTime,
  } = useProjectNoteEditing({
    applyTransientUpdate,
    applyUpdate,
    commitTransientUpdate,
    primaryTrack,
    primaryTrackNotes,
    project,
    selectedRecordedNote,
    selectedRecordedNoteId,
    setProjectMessage,
    setSelectedRecordedNoteId,
    timelineSnapEnabled,
    timelineSnapStep,
    undoStack,
  })

  // ── Clip handlers ────────────────────────────────────────────────────────────
  const {
    updateAudioClipStartTimeHandler,
    updateMidiClipStartTimeHandler,
    updateSamplerClipStartTimeHandler,
  } = useProjectClipStartTimeEditing({
    applyTransientUpdate,
    commitTransientUpdate,
    timelineSnapEnabled,
    timelineSnapStep,
  })

  const {
    duplicateMidiClipHandler,
    duplicateSamplerClipHandler,
  } = useProjectClipDuplication({ applyUpdate })

  const {
    removeMidiClipHandler,
    removeSamplerClipHandler,
  } = useProjectClipRemoval({ applyUpdate })

  const {
    updateAudioClipTrackMutedHandler,
  } = useProjectAudioClipTrackMixEditing({ applyUpdate })

  const {
    updateSamplerTrackMutedHandler,
    updateSamplerTrackSoloHandler,
  } = useProjectSamplerTrackMixEditing({ applyUpdate })

  // ── Timeline duration ────────────────────────────────────────────────────────
  const {
    compactPrimaryTrackNoteTimelineStart,
    resetPrimaryTrackNoteTimelineDuration,
    resetProjectTrackTimelineDuration,
    updatePrimaryTrackNoteTimelineDurationValue,
    updateProjectTrackTimelineDurationValue,
  } = useProjectTimelineDurationEditing({
    applyUpdate,
    primaryTrackId: primaryTrack.id,
    primaryTrackName: primaryTrack.name,
    primaryTrackNotes,
    setProjectMessage,
  })

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  const {
    redoProjectEdit,
    undoProjectEdit,
  } = useProjectHistoryController({
    activeTrackId,
    redo,
    setActiveTrackId,
    setProjectMessage,
    setSelectedRecordedNoteId,
    undo,
  })

  useEffect(() => {
    undoActionRef.current = undoProjectEdit
    redoActionRef.current = redoProjectEdit
  })

  // ── Session management ───────────────────────────────────────────────────────
  const {
    clearSession,
    restartProject,
  } = useProjectSessionLifecycle({
    applyUpdate,
    clearSampleSlots,
    resetProject,
    setActiveTrackId,
    setProjectMessage,
    setSelectedRecordedNoteId,
  })

  // ── Import / Export ──────────────────────────────────────────────────────────
  const {
    exportProject,
    importProjectFile,
  } = useProjectJsonTransfer({
    dependencies: {
      createProjectJsonExport,
      importProjectJsonFile,
      saveFile,
    },
    project,
    replaceState,
    setActiveTrackId,
    setProjectMessage,
    setSelectedRecordedNoteId,
  })
  const {
    exportBundle,
    importBundle,
  } = useProjectBundleTransfer({
    dependencies: {
      createProjectBundleExport,
      importProjectBundleFile,
      saveFile,
    },
    project,
    replaceState,
    setActiveTrackId,
    setProjectMessage,
    setSelectedRecordedNoteId,
  })

  const {
    isExportingAudio,
    exportProjectAudio,
  } = useProjectAudioTransfer({
    dependencies: {
      createProjectAudioExport,
      isOfflineAudioSupported: () =>
        typeof OfflineAudioContext !== "undefined",
      saveFile,
    },
    hasRecordedNotes: allRecordedNotes.length > 0,
    project,
    setProjectMessage,
  })

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
    padTracks,
    beatsTracks,
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
    addBeatsTrack,
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
