import type { ADSREnvelope } from "../audio/audioEngine"
import { getAvailableMathematicalInstruments } from "../audio/instrumentCatalog"
import type { MathematicalInstrumentId } from "../audio/mathematicalInstruments"
import type { MidiRecordedNote } from "../midi/events"
import type { MusicalNote } from "../midi/notes"
import type { MiMIDIPluginId, MiMIDIPluginStateMap } from "../plugins/pluginModel"
import {
  createDefaultPluginStates,
  isKnownPluginId,
  resolvePluginStates,
} from "../plugins/pluginRegistry"

export type TrackVolumeAutomationPoint = {
  time: number
  value: number
}

export type TrackVolumeAutomation = {
  enabled: boolean
  points: TrackVolumeAutomationPoint[]
}

export type TrackTimelineClip = {
  id: string
  startTime: number
}

export type ProjectTrackType = "melodic" | "percussion"

export type ProjectTrack = {
  envelope: ADSREnvelope
  id: string
  instrumentId: MathematicalInstrumentId
  muted: boolean
  name: string
  noteTimelineDuration: number
  notes: MidiRecordedNote[]
  pan: number
  solo: boolean
  timelineClip: TrackTimelineClip
  trackType: ProjectTrackType
  volumeAutomation: TrackVolumeAutomation
  volume: number
}

export type PadSynthSettings = {
  decayScale: number
  distortion: number
  hatLength: number
  kickTune: number
  hatFlicker: boolean
}

const DEFAULT_PAD_SYNTH_SETTINGS: PadSynthSettings = {
  decayScale: 1,
  distortion: 0,
  hatLength: 0.045,
  kickTune: 42,
  hatFlicker: false,
}

export type MusicalProject = {
  id: string
  name: string
  padSynthSettings: PadSynthSettings
  pluginStates: MiMIDIPluginStateMap
  trackTimelineDuration: number
  tracks: ProjectTrack[]
}

export type ScheduledTrackNote = {
  absoluteStartTime: number
  note: MidiRecordedNote
  relativeStartTime: number
  track: ProjectTrack
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function createDefaultProject(): MusicalProject {
  return {
    id: "project-1",
    name: "MiMIDI Project",
    padSynthSettings: { ...DEFAULT_PAD_SYNTH_SETTINGS },
    pluginStates: createDefaultPluginStates(),
    trackTimelineDuration: 8,
    tracks: [
      createProjectTrack(1, "melodic"),
      { ...createProjectTrack(2, "percussion"), name: "Pad 1" },
    ],
  }
}

export function appendPadTrack(project: MusicalProject): MusicalProject {
  const padCount = project.tracks.filter((t) => t.trackType === "percussion").length
  const track = createProjectTrack(project.tracks.length + 1, "percussion")
  return {
    ...project,
    tracks: [...project.tracks, { ...track, name: `Pad ${padCount + 1}` }],
  }
}

export function updatePadSynthSettings(
  project: MusicalProject,
  patch: Partial<PadSynthSettings>,
): MusicalProject {
  return { ...project, padSynthSettings: { ...project.padSynthSettings, ...patch } }
}

export function createProjectTrack(index: number, trackType: ProjectTrackType = "melodic"): ProjectTrack {
  return {
    envelope: {
      attack: 0.02,
      decay: 0.12,
      sustain: 0.68,
      release: 0.24,
    },
    id: `track-${index}`,
    instrumentId: "pure-sine",
    muted: false,
    name: `Track ${index}`,
    noteTimelineDuration: 8,
    notes: [],
    pan: 0,
    solo: false,
    timelineClip: {
      id: `track-${index}-clip-1`,
      startTime: 0,
    },
    trackType,
    volumeAutomation: {
      enabled: false,
      points: [
        { time: 0, value: 1 },
        { time: 4, value: 1 },
      ],
    },
    volume: 1,
  }
}

export function appendNoteToTrack(
  project: MusicalProject,
  trackId: string,
  note: MidiRecordedNote,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: [note, ...track.notes],
          }
        : track,
    ),
  }
}

export function appendNotesToTrack(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: [[...notes].reverse(), track.notes].flat(),
          }
        : track,
    ),
  }
}

export function removeNoteFromTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: track.notes.filter((note) => note.id !== noteId),
          }
        : track,
    ),
  }
}

export function updateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  patch: Partial<Pick<MidiRecordedNote, "startTime" | "duration">>,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: track.notes.map((note) =>
              note.id === noteId
                ? {
                    ...note,
                    ...patch,
                  }
                : note,
            ),
          }
        : track,
    ),
  }
}

export function duplicateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  offsetSeconds = 0.05,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => {
      if (track.id !== trackId) {
        return track
      }

      const sourceNote = track.notes.find((note) => note.id === noteId)

      if (!sourceNote) {
        return track
      }

      const copiedNote: MidiRecordedNote = {
        ...sourceNote,
        id: `note-${sourceNote.note}-${(sourceNote.startTime + offsetSeconds).toFixed(3)}-${Date.now()}`,
        startTime: Math.max(0, sourceNote.startTime + offsetSeconds),
      }

      return {
        ...track,
        notes: [copiedNote, ...track.notes],
      }
    }),
  }
}

export function clearTrackNotes(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            notes: [],
          }
        : track,
    ),
  }
}

export function clearAllTrackNotes(project: MusicalProject): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      notes: [],
    })),
  }
}

export function renameProject(
  project: MusicalProject,
  name: string,
): MusicalProject {
  return {
    ...project,
    name,
  }
}

export function updateProjectTrackTimelineDuration(
  project: MusicalProject,
  duration: number,
): MusicalProject {
  return {
    ...project,
    trackTimelineDuration: clamp(duration, 1, 9999),
  }
}

export function renameTrack(
  project: MusicalProject,
  trackId: string,
  name: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            name,
          }
        : track,
    ),
  }
}

export function updateTrackNoteTimelineDuration(
  project: MusicalProject,
  trackId: string,
  duration: number,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            noteTimelineDuration: clamp(duration, 1, 9999),
          }
        : track,
    ),
  }
}

export function compactTrackNotesStart(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => {
      if (track.id !== trackId || track.notes.length === 0) {
        return track
      }

      const earliestStartTime = track.notes.reduce(
        (minimumStartTime, note) => Math.min(minimumStartTime, note.startTime),
        Number.POSITIVE_INFINITY,
      )

      if (!Number.isFinite(earliestStartTime) || earliestStartTime <= 0) {
        return track
      }

      return {
        ...track,
        notes: track.notes.map((note) => ({
          ...note,
          startTime: Math.max(0, note.startTime - earliestStartTime),
        })),
      }
    }),
  }
}

export function updateTrackInstrument(
  project: MusicalProject,
  trackId: string,
  instrumentId: MathematicalInstrumentId,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            instrumentId,
          }
        : track,
    ),
  }
}

export function updateTrackEnvelope(
  project: MusicalProject,
  trackId: string,
  patch: Partial<ADSREnvelope>,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            envelope: {
              ...track.envelope,
              ...patch,
            },
          }
        : track,
    ),
  }
}

export function updateTrackVolume(
  project: MusicalProject,
  trackId: string,
  volume: number,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            volume: clamp(volume, 0, 1.5),
          }
        : track,
    ),
  }
}

export function updateTrackPan(
  project: MusicalProject,
  trackId: string,
  pan: number,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            pan: clamp(pan, -1, 1),
          }
        : track,
    ),
  }
}

export function updateTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            muted,
          }
        : track,
    ),
  }
}

export function updateTrackSolo(
  project: MusicalProject,
  trackId: string,
  solo: boolean,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            solo,
          }
        : track,
    ),
  }
}

export function updateTrackVolumeAutomation(
  project: MusicalProject,
  trackId: string,
  automation: TrackVolumeAutomation,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            volumeAutomation: {
              ...automation,
              points: [...automation.points].sort((firstPoint, secondPoint) => firstPoint.time - secondPoint.time),
            },
          }
        : track,
    ),
  }
}

export function updateTrackTimelineClip(
  project: MusicalProject,
  trackId: string,
  patch: Partial<Pick<TrackTimelineClip, "startTime">>,
): MusicalProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            timelineClip: {
              ...track.timelineClip,
              ...patch,
              startTime: clamp(patch.startTime ?? track.timelineClip.startTime, 0, 9999),
            },
          }
        : track,
    ),
  }
}

export function syncProjectTrackInstrumentsWithPluginCatalog(
  project: MusicalProject,
): MusicalProject {
  const availableInstruments = getAvailableMathematicalInstruments(project.pluginStates)
  const fallbackInstrumentId = availableInstruments[0]?.id ?? "pure-sine"
  const availableInstrumentIds = new Set(
    availableInstruments.map((instrument) => instrument.id),
  )

  return {
    ...project,
    tracks: project.tracks.map((track) =>
      availableInstrumentIds.has(track.instrumentId)
        ? track
        : {
            ...track,
            instrumentId: fallbackInstrumentId,
          },
    ),
  }
}

export function updateProjectPluginEnabled(
  project: MusicalProject,
  pluginId: MiMIDIPluginId,
  enabled: boolean,
): MusicalProject {
  const nextProject = {
    ...project,
    pluginStates: {
      ...project.pluginStates,
      [pluginId]: enabled,
    },
  }

  return syncProjectTrackInstrumentsWithPluginCatalog(nextProject)
}

export function appendTrack(project: MusicalProject): MusicalProject {
  const melodicCount = project.tracks.filter((t) => t.trackType === "melodic").length
  const track = createProjectTrack(project.tracks.length + 1, "melodic")
  return {
    ...project,
    tracks: [...project.tracks, { ...track, name: `Track ${melodicCount + 1}` }],
  }
}

export function hasSoloTracks(tracks: ProjectTrack[]) {
  return tracks.some((track) => track.solo)
}

export function isTrackAudible(track: ProjectTrack, allTracks: ProjectTrack[]) {
  if (hasSoloTracks(allTracks)) {
    return track.solo && !track.muted
  }

  return !track.muted
}

export function getTrackVolumeAutomationValue(
  automation: TrackVolumeAutomation,
  time: number,
) {
  if (!automation.enabled || automation.points.length === 0) {
    return 1
  }

  const clampedTime = Math.max(time, 0)
  const sortedPoints = [...automation.points].sort(
    (firstPoint, secondPoint) => firstPoint.time - secondPoint.time,
  )
  const firstPoint = sortedPoints[0]
  const lastPoint = sortedPoints.at(-1) ?? firstPoint

  if (clampedTime <= firstPoint.time) {
    return clamp(firstPoint.value, 0, 1.5)
  }

  if (clampedTime >= lastPoint.time) {
    return clamp(lastPoint.value, 0, 1.5)
  }

  for (let pointIndex = 0; pointIndex < sortedPoints.length - 1; pointIndex += 1) {
    const currentPoint = sortedPoints[pointIndex]
    const nextPoint = sortedPoints[pointIndex + 1]

    if (clampedTime < currentPoint.time || clampedTime > nextPoint.time) {
      continue
    }

    const segmentDuration = Math.max(nextPoint.time - currentPoint.time, 0.0001)
    const segmentProgress = (clampedTime - currentPoint.time) / segmentDuration

    return clamp(
      currentPoint.value + (nextPoint.value - currentPoint.value) * segmentProgress,
      0,
      1.5,
    )
  }

  return 1
}

export function getTrackTimelineClipDuration(track: ProjectTrack) {
  const trackDuration = track.notes.reduce(
    (maxEndTime, note) => Math.max(maxEndTime, note.startTime + note.duration),
    0,
  )

  return Math.max(trackDuration, 0.25)
}

export function getTrackNoteTimelineContentLength(track: ProjectTrack) {
  const lastNoteEnd = track.notes.reduce(
    (latestEnd, note) => Math.max(latestEnd, note.startTime + note.duration),
    0,
  )

  return Math.max(lastNoteEnd, 1)
}

export function getTrackNoteTimelineLength(track: ProjectTrack) {
  return Math.max(track.noteTimelineDuration, getTrackNoteTimelineContentLength(track))
}

export function getTracksTimelineLength(tracks: ProjectTrack[]) {
  const lastTrackEnd = tracks.reduce((maxEndTime, track) => {
    const trackEnd = track.timelineClip.startTime + getTrackTimelineClipDuration(track)

    return Math.max(maxEndTime, trackEnd)
  }, 0)

  return Math.max(lastTrackEnd, 1)
}

export function getProjectTrackTimelineLength(project: MusicalProject) {
  return Math.max(project.trackTimelineDuration, getTracksTimelineLength(project.tracks))
}

export function getScheduledTrackNotes(project: MusicalProject) {
  return project.tracks.flatMap((track) =>
    track.notes.map((note) => ({
      absoluteStartTime: track.timelineClip.startTime + note.startTime,
      note,
      relativeStartTime: note.startTime,
      track,
    })),
  )
}

export function removeTrack(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  if (project.tracks.length <= 1) {
    return project
  }

  return {
    ...project,
    tracks: project.tracks.filter((track) => track.id !== trackId),
  }
}

export function resetProject(project: MusicalProject): MusicalProject {
  const defaultProject = createDefaultProject()

  return {
    ...defaultProject,
    id: project.id,
  }
}

function normalizePluginStates(value: unknown) {
  if (!value || typeof value !== "object") {
    return createDefaultPluginStates()
  }

  const rawStates = value as Record<string, unknown>
  const pluginStatePatch: Partial<MiMIDIPluginStateMap> = {}

  for (const [pluginId, pluginState] of Object.entries(rawStates)) {
    if (!isKnownPluginId(pluginId) || typeof pluginState !== "boolean") {
      continue
    }

    pluginStatePatch[pluginId] = pluginState
  }

  return resolvePluginStates(pluginStatePatch)
}

function isRecordedNote(value: unknown): value is MidiRecordedNote {
  if (!value || typeof value !== "object") {
    return false
  }

  const note = value as Record<string, unknown>
  const playbackEnvelope =
    typeof note.playbackEnvelope === "object" && note.playbackEnvelope !== null
      ? (note.playbackEnvelope as Record<string, unknown>)
      : null

  return (
    typeof note.id === "string" &&
    typeof note.note === "string" &&
    typeof note.startTime === "number" &&
    typeof note.duration === "number" &&
    typeof note.velocity === "number" &&
    (typeof note.instrumentId === "string" || typeof note.instrumentId === "undefined") &&
    (note.playbackPan === undefined || typeof note.playbackPan === "number") &&
    (typeof note.playbackTrackId === "string" || typeof note.playbackTrackId === "undefined") &&
    (note.playbackVolume === undefined || typeof note.playbackVolume === "number") &&
    (note.playbackEnvelope === undefined ||
      (playbackEnvelope !== null &&
        (playbackEnvelope.attack === undefined ||
          typeof playbackEnvelope.attack === "number") &&
        (playbackEnvelope.decay === undefined ||
          typeof playbackEnvelope.decay === "number") &&
        (playbackEnvelope.sustain === undefined ||
          typeof playbackEnvelope.sustain === "number") &&
        (playbackEnvelope.release === undefined ||
          typeof playbackEnvelope.release === "number"))) &&
    (note.playbackSource === undefined ||
      note.playbackSource === "note" ||
      note.playbackSource === "smc-pad") &&
    (note.smcPadSoundId === undefined ||
      note.smcPadSoundId === "kick" ||
      note.smcPadSoundId === "snare" ||
      note.smcPadSoundId === "hat" ||
      note.smcPadSoundId === "clap" ||
      note.smcPadSoundId === "tom" ||
      note.smcPadSoundId === "cowbell" ||
      note.smcPadSoundId === "rimshot" ||
      note.smcPadSoundId === "shaker")
  )
}

function isProjectTrack(value: unknown): value is ProjectTrack {
  if (!value || typeof value !== "object") {
    return false
  }

  const track = value as Record<string, unknown>

  return (
    typeof track.id === "string" &&
    (typeof track.instrumentId === "string" ||
      typeof track.instrumentId === "undefined") &&
    typeof track.envelope === "object" &&
    track.envelope !== null &&
    typeof (track.envelope as Record<string, unknown>).attack === "number" &&
    typeof (track.envelope as Record<string, unknown>).decay === "number" &&
    typeof (track.envelope as Record<string, unknown>).sustain === "number" &&
    typeof (track.envelope as Record<string, unknown>).release === "number" &&
    (track.timelineClip === undefined ||
      (typeof track.timelineClip === "object" &&
        track.timelineClip !== null &&
        typeof (track.timelineClip as Record<string, unknown>).id === "string" &&
        typeof (track.timelineClip as Record<string, unknown>).startTime === "number")) &&
    (typeof track.muted === "boolean" || typeof track.muted === "undefined") &&
    (typeof track.pan === "number" || typeof track.pan === "undefined") &&
    (typeof track.solo === "boolean" || typeof track.solo === "undefined") &&
    (typeof track.volume === "number" || typeof track.volume === "undefined") &&
    (track.volumeAutomation === undefined ||
      (typeof track.volumeAutomation === "object" &&
        track.volumeAutomation !== null &&
        (track.volumeAutomation as Record<string, unknown>).enabled !== undefined &&
        typeof (track.volumeAutomation as Record<string, unknown>).enabled === "boolean" &&
        Array.isArray((track.volumeAutomation as Record<string, unknown>).points))) &&
    typeof track.name === "string" &&
    (track.trackType === undefined ||
      track.trackType === "melodic" ||
      track.trackType === "percussion") &&
    Array.isArray(track.notes) &&
    track.notes.every(isRecordedNote)
  )
}

function normalizeTrackNotes(track: ProjectTrack): ProjectTrack {
  const rawEnvelope =
    typeof (track as Record<string, unknown>).envelope === "object" &&
    (track as Record<string, unknown>).envelope !== null
      ? ((track as Record<string, unknown>).envelope as Record<string, unknown>)
      : null
  const rawAutomation =
    typeof (track as Record<string, unknown>).volumeAutomation === "object" &&
    (track as Record<string, unknown>).volumeAutomation !== null
      ? ((track as Record<string, unknown>).volumeAutomation as Record<string, unknown>)
      : null
  const rawTimelineClip =
    typeof (track as Record<string, unknown>).timelineClip === "object" &&
    (track as Record<string, unknown>).timelineClip !== null
      ? ((track as Record<string, unknown>).timelineClip as Record<string, unknown>)
      : null
  const normalizedAutomationPoints = Array.isArray(rawAutomation?.points)
    ? rawAutomation.points
        .filter(
          (point): point is Record<string, unknown> =>
            !!point &&
            typeof point === "object" &&
            typeof (point as Record<string, unknown>).time === "number" &&
            typeof (point as Record<string, unknown>).value === "number",
        )
        .map((point) => ({
          time: Math.max(0, point.time as number),
          value: Math.min(Math.max(point.value as number, 0), 1.5),
        }))
        .sort((firstPoint, secondPoint) => firstPoint.time - secondPoint.time)
    : []

  return {
    ...track,
    envelope: {
      attack: typeof rawEnvelope?.attack === "number" ? rawEnvelope.attack : 0.02,
      decay: typeof rawEnvelope?.decay === "number" ? rawEnvelope.decay : 0.12,
      sustain: typeof rawEnvelope?.sustain === "number" ? rawEnvelope.sustain : 0.68,
      release: typeof rawEnvelope?.release === "number" ? rawEnvelope.release : 0.24,
    },
    instrumentId: (track.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
    muted: typeof (track as Record<string, unknown>).muted === "boolean" ? track.muted : false,
    noteTimelineDuration:
      typeof (track as Record<string, unknown>).noteTimelineDuration === "number"
        ? Math.max(track.noteTimelineDuration, 1)
        : 8,
    pan: typeof (track as Record<string, unknown>).pan === "number"
      ? Math.min(Math.max(track.pan, -1), 1)
      : 0,
    solo: typeof (track as Record<string, unknown>).solo === "boolean" ? track.solo : false,
    trackType: (track as Record<string, unknown>).trackType === "percussion" ? "percussion" : "melodic",
    timelineClip: {
      id:
        typeof rawTimelineClip?.id === "string"
          ? rawTimelineClip.id
          : `${track.id}-clip-1`,
      startTime:
        typeof rawTimelineClip?.startTime === "number"
          ? Math.max(rawTimelineClip.startTime, 0)
          : 0,
    },
    volume: typeof (track as Record<string, unknown>).volume === "number"
      ? track.volume
      : 1,
    volumeAutomation: {
      enabled: typeof rawAutomation?.enabled === "boolean" ? rawAutomation.enabled : false,
      points:
        normalizedAutomationPoints.length > 0
          ? normalizedAutomationPoints
          : [
              { time: 0, value: 1 },
              { time: 4, value: 1 },
            ],
    },
    notes: track.notes.map((note) => ({
      ...note,
      note: note.note as MusicalNote,
      instrumentId: (note.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
      playbackEnvelope:
        typeof note.playbackEnvelope === "object" && note.playbackEnvelope !== null
          ? {
              attack:
                typeof note.playbackEnvelope.attack === "number"
                  ? note.playbackEnvelope.attack
                  : undefined,
              decay:
                typeof note.playbackEnvelope.decay === "number"
                  ? note.playbackEnvelope.decay
                  : undefined,
              sustain:
                typeof note.playbackEnvelope.sustain === "number"
                  ? note.playbackEnvelope.sustain
                  : undefined,
              release:
                typeof note.playbackEnvelope.release === "number"
                  ? note.playbackEnvelope.release
                  : undefined,
            }
          : undefined,
      playbackPan: typeof note.playbackPan === "number" ? note.playbackPan : undefined,
      playbackTrackId: typeof note.playbackTrackId === "string" ? note.playbackTrackId : undefined,
      playbackVolume:
        typeof note.playbackVolume === "number" ? note.playbackVolume : undefined,
      playbackSource: note.playbackSource === "smc-pad" ? "smc-pad" : "note",
      smcPadSoundId:
        note.smcPadSoundId === "kick" ||
        note.smcPadSoundId === "snare" ||
        note.smcPadSoundId === "hat" ||
        note.smcPadSoundId === "clap" ||
        note.smcPadSoundId === "tom" ||
        note.smcPadSoundId === "cowbell" ||
        note.smcPadSoundId === "rimshot" ||
        note.smcPadSoundId === "shaker"
          ? note.smcPadSoundId
          : undefined,
    })),
  }
}

export function parseImportedProject(projectJson: string): MusicalProject {
  const parsedProject = JSON.parse(projectJson) as unknown

  if (!parsedProject || typeof parsedProject !== "object") {
    throw new Error("Invalid project file")
  }

  const project = parsedProject as Record<string, unknown>

  if (
    typeof project.id !== "string" ||
    typeof project.name !== "string" ||
    (project.trackTimelineDuration !== undefined &&
      typeof project.trackTimelineDuration !== "number") ||
    !Array.isArray(project.tracks) ||
    !project.tracks.every((track) => {
      if (!track || typeof track !== "object") {
        return false
      }

      const rawTrack = track as Record<string, unknown>

      const hasLegacyShape =
        typeof rawTrack.id === "string" &&
        (typeof rawTrack.instrumentId === "string" ||
          typeof rawTrack.instrumentId === "undefined") &&
        typeof rawTrack.name === "string" &&
        Array.isArray(rawTrack.notes) &&
        rawTrack.notes.every(isRecordedNote)

      return isProjectTrack(track) || hasLegacyShape
    })
  ) {
    throw new Error("Project JSON does not match MiMIDI format")
  }

  const rawPad = project.padSynthSettings as Record<string, unknown> | undefined
  const padSynthSettings: PadSynthSettings = {
    decayScale: typeof rawPad?.decayScale === "number" ? rawPad.decayScale : DEFAULT_PAD_SYNTH_SETTINGS.decayScale,
    distortion: typeof rawPad?.distortion === "number" ? rawPad.distortion : DEFAULT_PAD_SYNTH_SETTINGS.distortion,
    hatLength: typeof rawPad?.hatLength === "number" ? rawPad.hatLength : DEFAULT_PAD_SYNTH_SETTINGS.hatLength,
    kickTune: typeof rawPad?.kickTune === "number" ? rawPad.kickTune : DEFAULT_PAD_SYNTH_SETTINGS.kickTune,
    hatFlicker: typeof rawPad?.hatFlicker === "boolean" ? rawPad.hatFlicker : DEFAULT_PAD_SYNTH_SETTINGS.hatFlicker,
  }

  return {
    ...syncProjectTrackInstrumentsWithPluginCatalog({
      id: project.id,
      name: project.name,
      padSynthSettings,
      pluginStates: normalizePluginStates(project.pluginStates),
      trackTimelineDuration:
        typeof project.trackTimelineDuration === "number"
          ? Math.max(project.trackTimelineDuration, 1)
          : 8,
      tracks: project.tracks.map((track) => normalizeTrackNotes(track)),
    }),
  }
}
