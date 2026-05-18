import type { ADSREnvelope } from "../audio/audioEngine"
import { getAvailableMathematicalInstruments } from "../audio/instrumentCatalog"
import type { MathematicalInstrumentId } from "../audio/mathematicalInstruments"
import type { MidiRecordedNote, PadSoundParams, SmcPadSoundId } from "../midi/events"
import type { MusicalNote } from "../midi/notes"
import type { MiMIDIPluginId, MiMIDIPluginStateMap } from "../plugins/pluginModel"
import type { SequencerPattern } from "../audio/sequencerModel"
import {
  createDefaultPluginStates,
  isKnownPluginId,
  resolvePluginStates,
} from "../plugins/pluginRegistry"

// ─── Shared value types ────────────────────────────────────────────────────

export type TrackVolumeAutomationPoint = {
  time: number
  value: number
}

export type TrackVolumeAutomation = {
  enabled: boolean
  points: TrackVolumeAutomationPoint[]
}

export type ProjectTrackType = "melodic" | "percussion"

// ─── Timeline track types ──────────────────────────────────────────────────

export type MidiTrack = {
  kind: "midi"
  envelope: ADSREnvelope
  id: string
  instrumentId: MathematicalInstrumentId
  muted: boolean
  name: string
  noteTimelineDuration: number
  notes: MidiRecordedNote[]
  pan: number
  solo: boolean
  startTime: number
  trackType: ProjectTrackType
  volumeAutomation: TrackVolumeAutomation
  volume: number
}

export type SamplerTrack = {
  kind: "sampler"
  id: string
  name: string
  startTime: number
  pattern: SequencerPattern
}

export type TimelineTrack = MidiTrack | SamplerTrack

export function isMidiTrack(t: TimelineTrack): t is MidiTrack {
  return t.kind === "midi"
}

export function isSamplerTrack(t: TimelineTrack): t is SamplerTrack {
  return t.kind === "sampler"
}

export function getMidiTracks(timeline: TimelineTrack[]): MidiTrack[] {
  return timeline.filter(isMidiTrack)
}

export function getSamplerTracks(timeline: TimelineTrack[]): SamplerTrack[] {
  return timeline.filter(isSamplerTrack)
}

// Backward-compat aliases so external files need minimal changes
export type ProjectTrack = MidiTrack
export type SamplerMixTrack = SamplerTrack

export type { PadSoundParams, SmcPadSoundId }

// ─── Project ───────────────────────────────────────────────────────────────

export type MusicalProject = {
  id: string
  name: string
  padSoundSettings: Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>>
  padSettingsLocked: boolean
  pluginStates: MiMIDIPluginStateMap
  timeline: TimelineTrack[]
  trackTimelineDuration: number
}

export type ScheduledTrackNote = {
  absoluteStartTime: number
  note: MidiRecordedNote
  relativeStartTime: number
  track: MidiTrack
}

// ─── Private helpers ───────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function mapMidiTrack(
  project: MusicalProject,
  trackId: string,
  updater: (t: MidiTrack) => MidiTrack,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isMidiTrack(t) && t.id === trackId ? updater(t) : t,
    ),
  }
}

// ─── Sampler mix CRUD ──────────────────────────────────────────────────────

export function addSamplerMix(
  project: MusicalProject,
  pattern: SequencerPattern,
  name: string,
): MusicalProject {
  const mix: SamplerTrack = {
    kind: "sampler",
    id: `smix-${Date.now()}`,
    name,
    startTime: 0,
    pattern,
  }
  return { ...project, timeline: [...project.timeline, mix] }
}

export function removeSamplerMix(
  project: MusicalProject,
  mixId: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.filter((t) => t.id !== mixId),
  }
}

export function updateSamplerMixStartTime(
  project: MusicalProject,
  mixId: string,
  startTime: number,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isSamplerTrack(t) && t.id === mixId ? { ...t, startTime } : t,
    ),
  }
}

export function renameSamplerMix(
  project: MusicalProject,
  mixId: string,
  name: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isSamplerTrack(t) && t.id === mixId ? { ...t, name } : t,
    ),
  }
}

// ─── Project defaults ──────────────────────────────────────────────────────

export function createDefaultProject(): MusicalProject {
  return {
    id: "project-1",
    name: "MiMIDI Project",
    padSoundSettings: {},
    padSettingsLocked: false,
    pluginStates: createDefaultPluginStates(),
    timeline: [
      createProjectTrack(1, "melodic"),
      { ...createProjectTrack(2, "percussion"), name: "Pad 1" },
    ],
    trackTimelineDuration: 8,
  }
}

export function appendPadTrack(project: MusicalProject): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const padCount = midiTracks.filter((t) => t.trackType === "percussion").length
  const track = createProjectTrack(midiTracks.length + 1, "percussion")
  return {
    ...project,
    timeline: [...project.timeline, { ...track, name: `Pad ${padCount + 1}` }],
  }
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

export function createProjectTrack(
  index: number,
  trackType: ProjectTrackType = "melodic",
): MidiTrack {
  return {
    kind: "midi",
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
    startTime: 0,
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

// ─── Note CRUD ─────────────────────────────────────────────────────────────

export function appendNoteToTrack(
  project: MusicalProject,
  trackId: string,
  note: MidiRecordedNote,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    notes: [note, ...t.notes],
  }))
}

export function appendNotesToTrack(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    notes: [[...notes].reverse(), t.notes].flat(),
  }))
}

export function removeNoteFromTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    notes: t.notes.filter((n) => n.id !== noteId),
  }))
}

export function updateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  patch: Partial<Pick<MidiRecordedNote, "startTime" | "duration">>,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    notes: t.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
  }))
}

export function duplicateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  offsetSeconds = 0.05,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => {
    const sourceNote = t.notes.find((n) => n.id === noteId)

    if (!sourceNote) {
      return t
    }

    const copiedNote: MidiRecordedNote = {
      ...sourceNote,
      id: `note-${sourceNote.note}-${(sourceNote.startTime + offsetSeconds).toFixed(3)}-${Date.now()}`,
      startTime: Math.max(0, sourceNote.startTime + offsetSeconds),
    }

    return { ...t, notes: [copiedNote, ...t.notes] }
  })
}

export function clearTrackNotes(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({ ...t, notes: [] }))
}

export function clearAllTrackNotes(project: MusicalProject): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isMidiTrack(t) ? { ...t, notes: [] } : t,
    ),
  }
}

// ─── Track metadata CRUD ───────────────────────────────────────────────────

export function renameProject(
  project: MusicalProject,
  name: string,
): MusicalProject {
  return { ...project, name }
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
    timeline: project.timeline.map((t) =>
      t.id === trackId ? { ...t, name } : t,
    ),
  }
}

export function updateTrackNoteTimelineDuration(
  project: MusicalProject,
  trackId: string,
  duration: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    noteTimelineDuration: clamp(duration, 1, 9999),
  }))
}

export function compactTrackNotesStart(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => {
    if (t.notes.length === 0) return t

    const earliest = t.notes.reduce(
      (min, n) => Math.min(min, n.startTime),
      Number.POSITIVE_INFINITY,
    )

    if (!Number.isFinite(earliest) || earliest <= 0) return t

    return {
      ...t,
      notes: t.notes.map((n) => ({
        ...n,
        startTime: Math.max(0, n.startTime - earliest),
      })),
    }
  })
}

export function updateTrackInstrument(
  project: MusicalProject,
  trackId: string,
  instrumentId: MathematicalInstrumentId,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({ ...t, instrumentId }))
}

export function updateTrackEnvelope(
  project: MusicalProject,
  trackId: string,
  patch: Partial<ADSREnvelope>,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    envelope: { ...t.envelope, ...patch },
  }))
}

export function updateTrackVolume(
  project: MusicalProject,
  trackId: string,
  volume: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    volume: clamp(volume, 0, 1.5),
  }))
}

export function updateTrackPan(
  project: MusicalProject,
  trackId: string,
  pan: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    pan: clamp(pan, -1, 1),
  }))
}

export function updateTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({ ...t, muted }))
}

export function updateTrackSolo(
  project: MusicalProject,
  trackId: string,
  solo: boolean,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({ ...t, solo }))
}

export function updateTrackVolumeAutomation(
  project: MusicalProject,
  trackId: string,
  automation: TrackVolumeAutomation,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    volumeAutomation: {
      ...automation,
      points: [...automation.points].sort((a, b) => a.time - b.time),
    },
  }))
}

export function updateMidiTrackStartTime(
  project: MusicalProject,
  trackId: string,
  startTime: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    startTime: clamp(startTime, 0, 9999),
  }))
}

// ─── Plugin / instrument sync ──────────────────────────────────────────────

export function syncProjectTrackInstrumentsWithPluginCatalog(
  project: MusicalProject,
): MusicalProject {
  const availableInstruments = getAvailableMathematicalInstruments(
    project.pluginStates,
  )
  const fallbackInstrumentId = availableInstruments[0]?.id ?? "pure-sine"
  const availableInstrumentIds = new Set(
    availableInstruments.map((i) => i.id),
  )

  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isMidiTrack(t) && !availableInstrumentIds.has(t.instrumentId)
        ? { ...t, instrumentId: fallbackInstrumentId }
        : t,
    ),
  }
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

// ─── Track lifecycle ───────────────────────────────────────────────────────

export function appendTrack(project: MusicalProject): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const melodicCount = midiTracks.filter((t) => t.trackType === "melodic").length
  const track = createProjectTrack(midiTracks.length + 1, "melodic")
  return {
    ...project,
    timeline: [
      ...project.timeline,
      { ...track, name: `Track ${melodicCount + 1}` },
    ],
  }
}

export function removeTrack(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.filter((t) => t.id !== trackId),
  }
}

export function resetProject(project: MusicalProject): MusicalProject {
  return { ...createDefaultProject(), id: project.id }
}

// ─── Playback queries ──────────────────────────────────────────────────────

export function hasSoloTracks(tracks: MidiTrack[]): boolean {
  return tracks.some((t) => t.solo)
}

export function isTrackAudible(
  track: MidiTrack,
  allTracks: MidiTrack[],
): boolean {
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
    (a, b) => a.time - b.time,
  )
  const firstPoint = sortedPoints[0]
  const lastPoint = sortedPoints.at(-1) ?? firstPoint

  if (clampedTime <= firstPoint.time) {
    return clamp(firstPoint.value, 0, 1.5)
  }

  if (clampedTime >= lastPoint.time) {
    return clamp(lastPoint.value, 0, 1.5)
  }

  for (let i = 0; i < sortedPoints.length - 1; i += 1) {
    const cur = sortedPoints[i]
    const next = sortedPoints[i + 1]

    if (clampedTime < cur.time || clampedTime > next.time) continue

    const segmentDuration = Math.max(next.time - cur.time, 0.0001)
    const segmentProgress = (clampedTime - cur.time) / segmentDuration

    return clamp(
      cur.value + (next.value - cur.value) * segmentProgress,
      0,
      1.5,
    )
  }

  return 1
}

export function getTrackTimelineClipDuration(track: MidiTrack): number {
  const trackDuration = track.notes.reduce(
    (max, n) => Math.max(max, n.startTime + n.duration),
    0,
  )

  return Math.max(trackDuration, 0.25)
}

export function getTrackNoteTimelineContentLength(track: MidiTrack): number {
  const lastNoteEnd = track.notes.reduce(
    (max, n) => Math.max(max, n.startTime + n.duration),
    0,
  )

  return Math.max(lastNoteEnd, 1)
}

export function getTrackNoteTimelineLength(track: MidiTrack): number {
  return Math.max(
    track.noteTimelineDuration,
    getTrackNoteTimelineContentLength(track),
  )
}

export function getSamplerTrackDuration(track: SamplerTrack): number {
  const secondsPerStep = 60 / track.pattern.bpm / 4
  return track.pattern.stepsPerBar * secondsPerStep
}

export function getTracksTimelineLength(timeline: TimelineTrack[]): number {
  const lastEnd = timeline.reduce((max, t) => {
    if (isMidiTrack(t)) {
      return Math.max(max, t.startTime + getTrackTimelineClipDuration(t))
    }
    return Math.max(max, t.startTime + getSamplerTrackDuration(t))
  }, 0)

  return Math.max(lastEnd, 1)
}

export function getProjectTrackTimelineLength(
  project: MusicalProject,
): number {
  return Math.max(
    project.trackTimelineDuration,
    getTracksTimelineLength(project.timeline),
  )
}

export function getScheduledTrackNotes(
  project: MusicalProject,
): ScheduledTrackNote[] {
  return getMidiTracks(project.timeline).flatMap((track) =>
    track.notes.map((note) => ({
      absoluteStartTime: track.startTime + note.startTime,
      note,
      relativeStartTime: note.startTime,
      track,
    })),
  )
}

// ─── Parsing / migration ───────────────────────────────────────────────────

const SMC_PAD_SOUND_IDS: ReadonlySet<string> = new Set([
  "kick",
  "snare",
  "hat",
  "clap",
  "tom",
  "cowbell",
  "rimshot",
  "shaker",
  "open-hat",
  "crash",
  "ride",
  "floor-tom",
  "hi-tom",
  "conga",
  "woodblock",
  "sub",
])

function isValidSmcPadSoundId(value: unknown): value is SmcPadSoundId {
  return typeof value === "string" && SMC_PAD_SOUND_IDS.has(value)
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
    (typeof note.instrumentId === "string" ||
      typeof note.instrumentId === "undefined") &&
    (note.playbackPan === undefined || typeof note.playbackPan === "number") &&
    (typeof note.playbackTrackId === "string" ||
      typeof note.playbackTrackId === "undefined") &&
    (note.playbackVolume === undefined ||
      typeof note.playbackVolume === "number") &&
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
    (note.smcPadSoundId === undefined || isValidSmcPadSoundId(note.smcPadSoundId))
  )
}

function isMidiTrackData(value: unknown): boolean {
  if (!value || typeof value !== "object") return false

  const track = value as Record<string, unknown>

  return (
    typeof track.id === "string" &&
    typeof track.name === "string" &&
    Array.isArray(track.notes) &&
    track.notes.every(isRecordedNote) &&
    (typeof track.instrumentId === "string" ||
      typeof track.instrumentId === "undefined") &&
    typeof track.envelope === "object" &&
    track.envelope !== null
  )
}

function normalizeMidiTrackData(raw: Record<string, unknown>): MidiTrack {
  const rawEnvelope =
    typeof raw.envelope === "object" && raw.envelope !== null
      ? (raw.envelope as Record<string, unknown>)
      : null
  const rawAutomation =
    typeof raw.volumeAutomation === "object" && raw.volumeAutomation !== null
      ? (raw.volumeAutomation as Record<string, unknown>)
      : null
  const rawTimelineClip =
    typeof raw.timelineClip === "object" && raw.timelineClip !== null
      ? (raw.timelineClip as Record<string, unknown>)
      : null

  // Support both new format (raw.startTime) and old format (timelineClip.startTime)
  const startTime =
    typeof raw.startTime === "number"
      ? Math.max(raw.startTime, 0)
      : typeof rawTimelineClip?.startTime === "number"
        ? Math.max(rawTimelineClip.startTime as number, 0)
        : 0

  const normalizedAutomationPoints = Array.isArray(rawAutomation?.points)
    ? (rawAutomation.points as unknown[])
        .filter(
          (p): p is Record<string, unknown> =>
            !!p &&
            typeof p === "object" &&
            typeof (p as Record<string, unknown>).time === "number" &&
            typeof (p as Record<string, unknown>).value === "number",
        )
        .map((p) => ({
          time: Math.max(0, p.time as number),
          value: Math.min(Math.max(p.value as number, 0), 1.5),
        }))
        .sort((a, b) => a.time - b.time)
    : []

  const rawNotes = Array.isArray(raw.notes)
    ? (raw.notes as unknown[]).filter(isRecordedNote)
    : []

  return {
    kind: "midi",
    envelope: {
      attack:
        typeof rawEnvelope?.attack === "number" ? rawEnvelope.attack : 0.02,
      decay:
        typeof rawEnvelope?.decay === "number" ? rawEnvelope.decay : 0.12,
      sustain:
        typeof rawEnvelope?.sustain === "number" ? rawEnvelope.sustain : 0.68,
      release:
        typeof rawEnvelope?.release === "number" ? rawEnvelope.release : 0.24,
    },
    id: raw.id as string,
    instrumentId: (raw.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
    muted: typeof raw.muted === "boolean" ? raw.muted : false,
    name: raw.name as string,
    noteTimelineDuration:
      typeof raw.noteTimelineDuration === "number"
        ? Math.max(raw.noteTimelineDuration, 1)
        : 8,
    notes: rawNotes.map((note) => ({
      ...note,
      note: note.note as MusicalNote,
      instrumentId: (note.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
      playbackEnvelope:
        typeof note.playbackEnvelope === "object" &&
        note.playbackEnvelope !== null
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
      playbackPan:
        typeof note.playbackPan === "number" ? note.playbackPan : undefined,
      playbackTrackId:
        typeof note.playbackTrackId === "string"
          ? note.playbackTrackId
          : undefined,
      playbackVolume:
        typeof note.playbackVolume === "number"
          ? note.playbackVolume
          : undefined,
      playbackSource:
        note.playbackSource === "smc-pad" ? "smc-pad" : ("note" as const),
      smcPadSoundId: isValidSmcPadSoundId(note.smcPadSoundId)
        ? note.smcPadSoundId
        : undefined,
    })),
    pan:
      typeof raw.pan === "number" ? clamp(raw.pan, -1, 1) : 0,
    solo: typeof raw.solo === "boolean" ? raw.solo : false,
    startTime,
    trackType: raw.trackType === "percussion" ? "percussion" : "melodic",
    volumeAutomation: {
      enabled:
        typeof rawAutomation?.enabled === "boolean"
          ? rawAutomation.enabled
          : false,
      points:
        normalizedAutomationPoints.length > 0
          ? normalizedAutomationPoints
          : [
              { time: 0, value: 1 },
              { time: 4, value: 1 },
            ],
    },
    volume: typeof raw.volume === "number" ? raw.volume : 1,
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

function normalizePadSoundSettings(
  raw: unknown,
): Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>> {
  const result: Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>> = {}

  if (!raw || typeof raw !== "object") return result

  const rawSettings = raw as Record<string, unknown>

  for (const soundId of SMC_PAD_SOUND_IDS) {
    const entry = rawSettings[soundId] as Record<string, unknown> | undefined

    if (!entry || typeof entry !== "object") continue

    const padEntry: Partial<PadSoundParams> = {}

    if (typeof entry.volume === "number") padEntry.volume = entry.volume
    if (typeof entry.decay === "number") padEntry.decay = entry.decay
    if (typeof entry.distortion === "number")
      padEntry.distortion = entry.distortion
    if (typeof entry.tune === "number") padEntry.tune = entry.tune
    if (typeof entry.length === "number") padEntry.length = entry.length
    if (typeof entry.flicker === "boolean") padEntry.flicker = entry.flicker

    if (Object.keys(padEntry).length > 0) {
      result[soundId as SmcPadSoundId] = padEntry
    }
  }

  return result
}

export function parseImportedProject(projectJson: string): MusicalProject {
  const parsedProject = JSON.parse(projectJson) as unknown

  if (!parsedProject || typeof parsedProject !== "object") {
    throw new Error("Invalid project file")
  }

  const project = parsedProject as Record<string, unknown>

  if (typeof project.id !== "string" || typeof project.name !== "string") {
    throw new Error("Project JSON does not match MiMIDI format")
  }

  const hasTimeline = Array.isArray(project.timeline)
  const hasTracks = Array.isArray(project.tracks)

  if (!hasTimeline && !hasTracks) {
    throw new Error("Project JSON does not match MiMIDI format")
  }

  let timeline: TimelineTrack[]

  if (hasTimeline) {
    // New format: project.timeline contains TimelineTrack[]
    timeline = (project.timeline as unknown[])
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object",
      )
      .flatMap((item): TimelineTrack[] => {
        if (item.kind === "midi" && isMidiTrackData(item)) {
          return [normalizeMidiTrackData(item)]
        }

        if (
          item.kind === "sampler" &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          item.pattern
        ) {
          return [
            {
              kind: "sampler",
              id: item.id,
              name: item.name,
              startTime:
                typeof item.startTime === "number" ? item.startTime : 0,
              pattern: item.pattern as SequencerPattern,
            },
          ]
        }

        return []
      })
  } else {
    // Old format: migrate tracks[] + samplerMixes[] → timeline[]
    const midiTracks: MidiTrack[] = (project.tracks as unknown[])
      .filter(
        (t): t is Record<string, unknown> =>
          !!t && typeof t === "object" && isMidiTrackData(t),
      )
      .map(normalizeMidiTrackData)

    const rawMixes = Array.isArray(project.samplerMixes)
      ? project.samplerMixes
      : []

    const samplerTracks: SamplerTrack[] = (rawMixes as unknown[])
      .filter(
        (m): m is Record<string, unknown> =>
          !!m &&
          typeof m === "object" &&
          typeof (m as Record<string, unknown>).id === "string" &&
          typeof (m as Record<string, unknown>).name === "string" &&
          !!(m as Record<string, unknown>).pattern,
      )
      .map((m) => ({
        kind: "sampler" as const,
        id: m.id as string,
        name: m.name as string,
        startTime: typeof m.startTime === "number" ? m.startTime : 0,
        pattern: m.pattern as SequencerPattern,
      }))

    timeline = [...midiTracks, ...samplerTracks]
  }

  // Guarantee at least one midi track
  if (!timeline.some(isMidiTrack)) {
    timeline = [createProjectTrack(1), ...timeline]
  }

  return syncProjectTrackInstrumentsWithPluginCatalog({
    id: project.id,
    name: project.name,
    padSoundSettings: normalizePadSoundSettings(project.padSoundSettings),
    padSettingsLocked:
      typeof project.padSettingsLocked === "boolean"
        ? project.padSettingsLocked
        : false,
    pluginStates: normalizePluginStates(project.pluginStates),
    timeline,
    trackTimelineDuration:
      typeof project.trackTimelineDuration === "number"
        ? Math.max(project.trackTimelineDuration, 1)
        : 8,
  })
}
