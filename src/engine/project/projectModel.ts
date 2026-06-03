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

export type ProjectTrackType = "melodic" | "percussion" | "steps"

// ─── Clip types ────────────────────────────────────────────────────────────

export type MidiClip = {
  id: string
  notes: MidiRecordedNote[]  // timestamps relative to this clip's startTime
  startTime: number           // position in the track timeline (seconds)
}

export type SamplerClip = {
  id: string
  startTime: number           // position in the track timeline (seconds)
}

export type AudioClip = {
  id:        string
  startTime: number           // position in the track timeline (seconds)
}

// ─── Timeline track types ──────────────────────────────────────────────────

export type MidiTrack = {
  kind: "midi"
  clips: MidiClip[]
  envelope: ADSREnvelope
  id: string
  instrumentId: MathematicalInstrumentId
  muted: boolean
  name: string
  noteTimelineDuration: number
  pan: number
  solo: boolean
  trackType: ProjectTrackType
  volumeAutomation: TrackVolumeAutomation
  volume: number
}

export type SamplerTrack = {
  kind: "sampler"
  clips: SamplerClip[]
  id: string
  muted: boolean
  solo?: boolean
  name: string
  pattern: SequencerPattern
}

export type AudioClipTrack = {
  kind:     "audio-clip"
  id:       string
  name:     string
  dbId:     string
  duration: number
  clips:    AudioClip[]
  muted:    boolean
}

export type TimelineTrack = MidiTrack | SamplerTrack | AudioClipTrack

export function isMidiTrack(t: TimelineTrack): t is MidiTrack {
  return t.kind === "midi"
}

export function isSamplerTrack(t: TimelineTrack): t is SamplerTrack {
  return t.kind === "sampler"
}

export function isAudioClipTrack(t: TimelineTrack): t is AudioClipTrack {
  return t.kind === "audio-clip"
}

export function getMidiTracks(timeline: TimelineTrack[]): MidiTrack[] {
  return timeline.filter(isMidiTrack)
}

export function getSamplerTracks(timeline: TimelineTrack[]): SamplerTrack[] {
  return timeline.filter(isSamplerTrack)
}

export function getAudioClipTracks(timeline: TimelineTrack[]): AudioClipTrack[] {
  return timeline.filter(isAudioClipTrack)
}

export function addAudioClipTrack(
  project: MusicalProject,
  entry: { name: string; dbId: string; duration: number },
): MusicalProject {
  const track: AudioClipTrack = {
    kind: "audio-clip",
    id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: entry.name,
    dbId: entry.dbId,
    duration: entry.duration,
    clips: [createAudioClip(0)],
    muted: false,
  }
  return { ...project, timeline: [...project.timeline, track] }
}

export function updateAudioClipStartTime(
  project: MusicalProject,
  trackId: string,
  clipId: string,
  startTime: number,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isAudioClipTrack(t) && t.id === trackId
        ? {
            ...t,
            clips: t.clips.map((c) =>
              c.id === clipId ? { ...c, startTime: Math.max(0, startTime) } : c,
            ),
          }
        : t,
    ),
  }
}

export function updateAudioClipTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isAudioClipTrack(t) && t.id === trackId ? { ...t, muted } : t,
    ),
  }
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
  clip: MidiClip
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

function mapSamplerTrack(
  project: MusicalProject,
  trackId: string,
  updater: (t: SamplerTrack) => SamplerTrack,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isSamplerTrack(t) && t.id === trackId ? updater(t) : t,
    ),
  }
}

// ─── Clip helpers ──────────────────────────────────────────────────────────

export function createMidiClip(startTime = 0): MidiClip {
  return { id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, notes: [], startTime }
}

export function createSamplerClip(startTime = 0): SamplerClip {
  return { id: `sclip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, startTime }
}

export function createAudioClip(startTime = 0): AudioClip {
  return { id: `aclip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, startTime }
}

export function getMidiClipDuration(clip: MidiClip): number {
  return Math.max(
    clip.notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0),
    0.25,
  )
}

export function getMidiTrackNotes(track: MidiTrack): MidiRecordedNote[] {
  return track.clips.flatMap((c) => c.notes)
}

export function getActiveClip(track: MidiTrack): MidiClip | null {
  return track.clips.at(-1) ?? null
}

export function getMidiTrackNoteCount(track: MidiTrack): number {
  return track.clips.reduce((sum, c) => sum + c.notes.length, 0)
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
    clips: [createSamplerClip(0)],
    muted: false,
    solo: false,
    name,
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

export function updateSamplerClipStartTime(
  project: MusicalProject,
  trackId: string,
  clipId: string,
  startTime: number,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId ? { ...c, startTime: Math.max(0, startTime) } : c,
    ),
  }))
}

/** @deprecated Use updateSamplerClipStartTime */
export function updateSamplerMixStartTime(
  project: MusicalProject,
  mixId: string,
  startTime: number,
): MusicalProject {
  const track = project.timeline.find((t) => isSamplerTrack(t) && t.id === mixId) as SamplerTrack | undefined
  const clipId = track?.clips[0]?.id
  if (!clipId) return project
  return updateSamplerClipStartTime(project, mixId, clipId, startTime)
}

export function duplicateSamplerClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (track) => {
    const sourceClip = track.clips.find((c) => c.id === clipId)
    if (!sourceClip) return track
    const samplerDuration = getSamplerTrackDuration(track)
    const newClip = createSamplerClip(sourceClip.startTime + samplerDuration)
    return { ...track, clips: [...track.clips, newClip].sort((a, b) => a.startTime - b.startTime) }
  })
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
      { ...createProjectTrack(3, "steps"), name: "Steps 1" },
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

export function resetTrackClips(project: MusicalProject, trackId: string): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: [createMidiClip(0)],
  }))
}

export function appendStepsTrack(project: MusicalProject): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const stepsCount = midiTracks.filter((t) => t.trackType === "steps").length
  const track = createProjectTrack(midiTracks.length + 1, "steps")
  return {
    ...project,
    timeline: [...project.timeline, { ...track, name: `Steps ${stepsCount + 1}` }],
  }
}

export function getStepsTracks(timeline: TimelineTrack[]): MidiTrack[] {
  return getMidiTracks(timeline).filter((t) => t.trackType === "steps")
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
    clips: [],
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
    pan: 0,
    solo: false,
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

function ensureLastClip(track: MidiTrack): MidiTrack {
  if (track.clips.length > 0) return track
  return { ...track, clips: [createMidiClip(0)] }
}

export function appendNoteToTrack(
  project: MusicalProject,
  trackId: string,
  note: MidiRecordedNote,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => {
    const track = ensureLastClip(t)
    const clips = track.clips.slice()
    const last = { ...clips[clips.length - 1] }
    last.notes = [note, ...last.notes]
    clips[clips.length - 1] = last
    return { ...track, clips }
  })
}

export function appendNotesToTrack(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => {
    const track = ensureLastClip(t)
    const clips = track.clips.slice()
    const last = { ...clips[clips.length - 1] }
    last.notes = [[...notes].reverse(), last.notes].flat()
    clips[clips.length - 1] = last
    return { ...track, clips }
  })
}

export function toggleStepNoteInTrack(
  project: MusicalProject,
  trackId: string,
  note: MusicalNote,
  colIdx: number,
  bpm: number,
  instrumentId: MathematicalInstrumentId,
  stepSubdivision = 4,
): MusicalProject {
  const stepDurationSec = (60 / bpm) / stepSubdivision
  const noteDuration = stepDurationSec * 0.85
  const targetStartTime = colIdx * stepDurationSec
  const tolerance = stepDurationSec * 0.5

  return mapMidiTrack(project, trackId, (t) => {
    const track = ensureLastClip(t)
    const clip = track.clips[0]
    const existingIdx = clip.notes.findIndex(
      n => n.note === note && Math.abs(n.startTime - targetStartTime) < tolerance,
    )
    const newNotes = existingIdx >= 0
      ? clip.notes.filter((_, i) => i !== existingIdx)
      : [...clip.notes, {
          id: `step-${note}-${colIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          note,
          startTime: targetStartTime,
          duration: noteDuration,
          velocity: 0.8,
          instrumentId,
        }]
    return { ...track, clips: [{ ...clip, notes: newNotes }] }
  })
}

export function removeNoteFromTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.map((c) => ({
      ...c,
      notes: c.notes.filter((n) => n.id !== noteId),
    })),
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
    clips: t.clips.map((c) => ({
      ...c,
      notes: c.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
    })),
  }))
}

export function duplicateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  offsetSeconds = 0.05,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.map((c) => {
      const sourceNote = c.notes.find((n) => n.id === noteId)
      if (!sourceNote) return c
      const copiedNote: MidiRecordedNote = {
        ...sourceNote,
        id: `note-${sourceNote.note}-${(sourceNote.startTime + offsetSeconds).toFixed(3)}-${Date.now()}`,
        startTime: Math.max(0, sourceNote.startTime + offsetSeconds),
      }
      return { ...c, notes: [copiedNote, ...c.notes] }
    }),
  }))
}

export function clearTrackNotes(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.map((c) => ({ ...c, notes: [] })),
  }))
}

export function clearAllTrackNotes(project: MusicalProject): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      isMidiTrack(t)
        ? { ...t, clips: t.clips.map((c) => ({ ...c, notes: [] })) }
        : t,
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
    if (t.clips.length === 0) return t
    const lastIdx = t.clips.length - 1
    const lastClip = t.clips[lastIdx]
    if (lastClip.notes.length === 0) return t

    const earliest = lastClip.notes.reduce(
      (min, n) => Math.min(min, n.startTime),
      Number.POSITIVE_INFINITY,
    )

    if (!Number.isFinite(earliest) || earliest <= 0) return t

    const newClips = t.clips.slice()
    newClips[lastIdx] = {
      ...lastClip,
      notes: lastClip.notes.map((n) => ({
        ...n,
        startTime: Math.max(0, n.startTime - earliest),
      })),
    }

    return { ...t, clips: newClips }
  })
}

export function updateMidiClipStartTime(
  project: MusicalProject,
  trackId: string,
  clipId: string,
  startTime: number,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId ? { ...c, startTime: Math.max(0, startTime) } : c,
    ),
  }))
}

/** @deprecated Use updateMidiClipStartTime */
export function updateMidiTrackStartTime(
  project: MusicalProject,
  trackId: string,
  startTime: number,
): MusicalProject {
  const track = project.timeline.find((t) => isMidiTrack(t) && t.id === trackId) as MidiTrack | undefined
  const clipId = track?.clips[0]?.id
  if (!clipId) return project
  return updateMidiClipStartTime(project, trackId, clipId, startTime)
}

export function removeMidiClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.filter((c) => c.id !== clipId),
  }))
}

export function removeSamplerClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapSamplerTrack(project, trackId, (t) => ({
    ...t,
    clips: t.clips.filter((c) => c.id !== clipId),
  }))
}

export function duplicateMidiClip(
  project: MusicalProject,
  trackId: string,
  clipId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    const sourceClip = track.clips.find((c) => c.id === clipId)
    if (!sourceClip) return track
    const clipDuration = getMidiClipDuration(sourceClip)
    const newClip = createMidiClip(sourceClip.startTime + clipDuration)
    newClip.notes = sourceClip.notes.map((n) => ({
      ...n,
      id: `${n.id}-dup-${Date.now()}`,
    }))
    return {
      ...track,
      clips: [...track.clips, newClip].sort((a, b) => a.startTime - b.startTime),
    }
  })
}

export function createRecordingClip(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    const lastClip = track.clips.at(-1)
    const startTime = lastClip
      ? lastClip.startTime + getMidiClipDuration(lastClip)
      : 0
    return { ...track, clips: [...track.clips, createMidiClip(startTime)] }
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

export function updateSamplerTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      t.kind === "sampler" && t.id === trackId ? { ...t, muted } : t,
    ),
  }
}

export function updateSamplerTrackSolo(
  project: MusicalProject,
  trackId: string,
  solo: boolean,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((t) =>
      t.kind === "sampler" && t.id === trackId ? { ...t, solo } : t,
    ),
  }
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

export function appendTrackWithNotes(
  project: MusicalProject,
  name: string,
  instrumentId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const base = createProjectTrack(midiTracks.length + 1, "melodic")
  const clip = createMidiClip(0)
  clip.notes = notes
  const track: MidiTrack = { ...base, name, instrumentId, clips: [clip] }
  return { ...project, timeline: [...project.timeline, track] }
}

/** Reemplaza las notas del primer clip de un track melódico existente. */
export function replaceTrackNotes(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    const clip = track.clips[0] ?? createMidiClip(0)
    return { ...track, clips: [{ ...clip, notes }] }
  })
}

/**
 * Hornea notas en el timeline melódico.
 * Si ya existe un track melódico con el mismo nombre, reemplaza sus notas.
 * Si no existe, crea uno nuevo.
 * Devuelve [proyecto actualizado, id del track resultante].
 */
export function bakeOrReplaceTrackNotes(
  project: MusicalProject,
  name: string,
  instrumentId: string,
  notes: MidiRecordedNote[],
): [MusicalProject, string] {
  const existing = getMidiTracks(project.timeline).find(
    (t) => t.trackType === "melodic" && t.name === name,
  )
  if (existing) {
    return [replaceTrackNotes(project, existing.id, notes), existing.id]
  }
  const updated = appendTrackWithNotes(project, name, instrumentId, notes)
  const newTrack = getMidiTracks(updated.timeline).filter(t => t.trackType === "melodic").at(-1)!
  return [updated, newTrack.id]
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
  return track.clips.reduce((max, c) => Math.max(max, getMidiClipDuration(c)), 0.25)
}

export function getTrackNoteTimelineContentLength(track: MidiTrack): number {
  const activeClip = getActiveClip(track)
  if (!activeClip) return 1
  return Math.max(getMidiClipDuration(activeClip), 1)
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
      return t.clips.reduce(
        (m, c) => Math.max(m, c.startTime + getMidiClipDuration(c)),
        max,
      )
    }
    if (isAudioClipTrack(t)) {
      return t.clips.reduce((m, c) => Math.max(m, c.startTime + t.duration), max)
    }
    const samplerDuration = getSamplerTrackDuration(t)
    return t.clips.reduce(
      (m, c) => Math.max(m, c.startTime + samplerDuration),
      max,
    )
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
    track.clips.flatMap((clip) =>
      clip.notes.map((note) => ({
        absoluteStartTime: clip.startTime + note.startTime,
        clip,
        note,
        relativeStartTime: note.startTime,
        track,
      })),
    ),
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
    (Array.isArray(track.clips) || Array.isArray(track.notes)) &&
    (typeof track.instrumentId === "string" ||
      typeof track.instrumentId === "undefined") &&
    typeof track.envelope === "object" &&
    track.envelope !== null
  )
}

function normalizeRawNote(note: MidiRecordedNote): MidiRecordedNote {
  return {
    ...note,
    note: note.note as MusicalNote,
    instrumentId: (note.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
    playbackEnvelope:
      typeof note.playbackEnvelope === "object" && note.playbackEnvelope !== null
        ? {
            attack: typeof note.playbackEnvelope.attack === "number" ? note.playbackEnvelope.attack : undefined,
            decay: typeof note.playbackEnvelope.decay === "number" ? note.playbackEnvelope.decay : undefined,
            sustain: typeof note.playbackEnvelope.sustain === "number" ? note.playbackEnvelope.sustain : undefined,
            release: typeof note.playbackEnvelope.release === "number" ? note.playbackEnvelope.release : undefined,
          }
        : undefined,
    playbackPan: typeof note.playbackPan === "number" ? note.playbackPan : undefined,
    playbackTrackId: typeof note.playbackTrackId === "string" ? note.playbackTrackId : undefined,
    playbackVolume: typeof note.playbackVolume === "number" ? note.playbackVolume : undefined,
    playbackSource: note.playbackSource === "smc-pad" ? "smc-pad" : ("note" as const),
    smcPadSoundId: isValidSmcPadSoundId(note.smcPadSoundId) ? note.smcPadSoundId : undefined,
  }
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

  // Normalize clips: support new format (clips[]) or migrate from old (notes + startTime)
  let clips: MidiClip[]

  if (Array.isArray(raw.clips)) {
    clips = (raw.clips as unknown[])
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .map((c) => ({
        id: typeof c.id === "string" ? c.id : `clip-migrated-${Date.now()}`,
        startTime: typeof c.startTime === "number" ? Math.max(c.startTime, 0) : 0,
        notes: Array.isArray(c.notes)
          ? (c.notes as unknown[]).filter(isRecordedNote).map(normalizeRawNote)
          : [],
      }))
  } else {
    // Old format: flat notes + startTime → single clip
    const legacyStartTime =
      typeof raw.startTime === "number"
        ? Math.max(raw.startTime, 0)
        : typeof rawTimelineClip?.startTime === "number"
          ? Math.max(rawTimelineClip.startTime as number, 0)
          : 0
    const rawNotes = Array.isArray(raw.notes)
      ? (raw.notes as unknown[]).filter(isRecordedNote).map(normalizeRawNote)
      : []
    clips = rawNotes.length > 0 || legacyStartTime > 0
      ? [{ id: `clip-migrated-${raw.id as string}`, notes: rawNotes, startTime: legacyStartTime }]
      : []
  }

  return {
    kind: "midi",
    clips,
    envelope: {
      attack: typeof rawEnvelope?.attack === "number" ? rawEnvelope.attack : 0.02,
      decay: typeof rawEnvelope?.decay === "number" ? rawEnvelope.decay : 0.12,
      sustain: typeof rawEnvelope?.sustain === "number" ? rawEnvelope.sustain : 0.68,
      release: typeof rawEnvelope?.release === "number" ? rawEnvelope.release : 0.24,
    },
    id: raw.id as string,
    instrumentId: (raw.instrumentId as MathematicalInstrumentId) ?? "pure-sine",
    muted: typeof raw.muted === "boolean" ? raw.muted : false,
    name: raw.name as string,
    noteTimelineDuration:
      typeof raw.noteTimelineDuration === "number"
        ? Math.max(raw.noteTimelineDuration, 1)
        : 8,
    pan: typeof raw.pan === "number" ? clamp(raw.pan, -1, 1) : 0,
    solo: typeof raw.solo === "boolean" ? raw.solo : false,
    trackType: raw.trackType === "percussion"
      ? "percussion"
      : raw.trackType === "steps"
        ? "steps"
        : "melodic",
    volumeAutomation: {
      enabled: typeof rawAutomation?.enabled === "boolean" ? rawAutomation.enabled : false,
      points:
        normalizedAutomationPoints.length > 0
          ? normalizedAutomationPoints
          : [{ time: 0, value: 1 }, { time: 4, value: 1 }],
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
          // Support new format (clips[]) or migrate from old (startTime flat)
          let samplerClips: SamplerClip[]
          if (Array.isArray(item.clips)) {
            samplerClips = (item.clips as unknown[])
              .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
              .map((c) => ({
                id: typeof c.id === "string" ? c.id : `sclip-migrated-${Date.now()}`,
                startTime: typeof c.startTime === "number" ? Math.max(c.startTime, 0) : 0,
              }))
          } else {
            const legacyStart = typeof item.startTime === "number" ? item.startTime : 0
            samplerClips = [createSamplerClip(legacyStart)]
          }
          return [
            {
              kind: "sampler",
              id: item.id,
              clips: samplerClips,
              muted: typeof item.muted === "boolean" ? item.muted : false,
              name: item.name,
              pattern: item.pattern as SequencerPattern,
            },
          ]
        }

        if (
          item.kind === "audio-clip" &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.dbId === "string" &&
          typeof item.duration === "number"
        ) {
          let audioClips: AudioClip[]
          if (Array.isArray(item.clips)) {
            audioClips = (item.clips as unknown[])
              .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
              .map((c) => ({
                id: typeof c.id === "string" ? c.id : `aclip-migrated-${Date.now()}`,
                startTime: typeof c.startTime === "number" ? Math.max(c.startTime, 0) : 0,
              }))
          } else {
            // Migrate old format: startTime on the track itself
            audioClips = [createAudioClip(typeof item.startTime === "number" ? item.startTime : 0)]
          }
          return [{
            kind: "audio-clip",
            id: item.id,
            name: item.name,
            dbId: item.dbId,
            duration: item.duration,
            clips: audioClips,
            muted: typeof item.muted === "boolean" ? item.muted : false,
          }]
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
        clips: [createSamplerClip(typeof m.startTime === "number" ? m.startTime : 0)],
        muted: typeof m.muted === "boolean" ? m.muted : false,
        name: m.name as string,
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
