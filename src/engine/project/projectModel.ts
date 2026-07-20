import { getAvailableMathematicalInstruments } from "../audio/instrumentCatalog"
import type { PadSoundParams, SmcPadSoundId } from "../midi/events"
import type { MiMIDIPluginId } from "../plugins/pluginModel"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import {
  createDefaultProjectWithPluginStates,
  resetProjectWithPluginStates,
  syncProjectTrackInstruments,
} from "../../domain/project/projectDefaults"
import type {
  MidiTrack,
  MusicalProject,
  TimelineTrack,
} from "../../domain/project/projectTypes"
import { createDefaultPluginStates } from "../plugins/pluginRegistry"

export {
  getAudioClipTracks,
  getMidiTracks,
  getSamplerTracks,
  isAudioClipTrack,
  isMidiTrack,
  isSamplerTrack,
} from "../../domain/project/timelineQueries"
export {
  createAudioClip,
  createMidiClip,
  createProjectTrack,
  createSamplerClip,
} from "../../domain/project/projectFactories"
export {
  addAudioClipTrack,
  updateAudioClipStartTime,
  updateAudioClipTrackMuted,
} from "../../domain/project/audioClipTrackMutations"
export {
  addSamplerMix,
  duplicateSamplerClip,
  removeSamplerClip,
  removeSamplerMix,
  renameSamplerMix,
  updateSamplerClipStartTime,
  updateSamplerMixStartTime,
  updateSamplerTrackMuted,
  updateSamplerTrackSolo,
} from "../../domain/project/samplerTrackMutations"
export {
  createRecordingClip,
  duplicateMidiClip,
  removeMidiClip,
  resetTrackClips,
  updateMidiClipStartTime,
  updateMidiTrackStartTime,
} from "../../domain/project/midiClipMutations"
export {
  appendNotesToTrack,
  appendNoteToTrack,
  clearAllTrackNotes,
  clearTrackNotes,
  duplicateNoteInTrack,
  removeNoteFromTrack,
  toggleStepNoteInTrack,
  updateNoteInTrack,
} from "../../domain/project/midiNoteMutations"
export {
  compactTrackNotesStart,
  renameProject,
  renameTrack,
  updateProjectTrackTimelineDuration,
  updateTrackEnvelope,
  updateTrackInstrument,
  updateTrackMuted,
  updateTrackNoteTimelineDuration,
  updateTrackPan,
  updateTrackSolo,
  updateTrackVolume,
  updateTrackVolumeAutomation,
} from "../../domain/project/projectTrackMutations"
export {
  appendPadTrack,
  appendBeatsTrack,
  appendPercussionTrack,
  appendStepsTrack,
  appendTrack,
  appendTrackWithNotes,
  bakeOrReplaceTrackNotes,
  removeTrack,
  replaceTrackNotes,
} from "../../domain/project/projectTrackLifecycle"
export { parseImportedProject } from "../../domain/project/projectParsing"
export {
  createDefaultProjectWithPluginStates,
  resetProjectWithPluginStates,
  syncProjectTrackInstruments,
} from "../../domain/project/projectDefaults"
export {
  getActiveClip,
  getMidiClipDuration,
  getMidiTrackNoteCount,
  getMidiTrackNotes,
  getProjectTrackTimelineLength,
  getSamplerTrackDuration,
  getScheduledTrackNotes,
  getTrackNoteTimelineContentLength,
  getTrackNoteTimelineLength,
  getTrackTimelineClipDuration,
  getTracksTimelineLength,
  getTrackVolumeAutomationValue,
  hasSoloTracks,
  isTrackAudible,
} from "../../domain/project/timelineDurationQueries"
export type {
  AudioClip,
  AudioClipTrack,
  MidiClip,
  MidiTrack,
  MusicalProject,
  ProjectTrack,
  ProjectTrackType,
  SamplerClip,
  SamplerMixTrack,
  SamplerTrack,
  ScheduledTrackNote,
  TimelineTrack,
  TrackVolumeAutomation,
  TrackVolumeAutomationPoint,
} from "../../domain/project/projectTypes"

export type { PadSoundParams, SmcPadSoundId }

export function createDefaultProject(): MusicalProject {
  return createDefaultProjectWithPluginStates(createDefaultPluginStates())
}

export function getStepsTracks(timeline: TimelineTrack[]): MidiTrack[] {
  return getMidiTracks(timeline).filter((track) => track.trackType === "steps")
}

export function updatePadSoundSetting(
  project: MusicalProject,
  soundId: SmcPadSoundId,
  patch: Partial<PadSoundParams>,
): MusicalProject {
  return {
    ...project,
    padSoundSettings: {
      ...project.padSoundSettings,
      [soundId]: { ...project.padSoundSettings[soundId], ...patch },
    },
  }
}

export function syncProjectTrackInstrumentsWithPluginCatalog(
  project: MusicalProject,
): MusicalProject {
  const availableInstruments = getAvailableMathematicalInstruments(
    project.pluginStates,
  )
  return syncProjectTrackInstruments(project, {
    fallbackInstrumentId: availableInstruments[0]?.id ?? "pure-sine",
    instrumentIds: new Set(availableInstruments.map((instrument) => instrument.id)),
  })
}

export function updateProjectPluginEnabled(
  project: MusicalProject,
  pluginId: MiMIDIPluginId,
  enabled: boolean,
): MusicalProject {
  return syncProjectTrackInstrumentsWithPluginCatalog({
    ...project,
    pluginStates: { ...project.pluginStates, [pluginId]: enabled },
  })
}

export function resetProject(project: MusicalProject): MusicalProject {
  return resetProjectWithPluginStates(project, createDefaultPluginStates())
}
