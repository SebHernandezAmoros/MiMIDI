import { getAvailableMathematicalInstruments } from "../../engine/audio/instrumentCatalog"
import type { MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import type { SequencerPattern } from "../../engine/audio/sequencerModel"
import type { MidiRecordedNote, PadSoundParams, SmcPadSoundId } from "../../engine/midi/events"
import type { MusicalNote } from "../../engine/midi/notes"
import type { MiMIDIPluginStateMap } from "../../engine/plugins/pluginModel"
import {
  createDefaultPluginStates,
  isKnownPluginId,
  resolvePluginStates,
} from "../../engine/plugins/pluginRegistry"
import { syncProjectTrackInstruments } from "./projectDefaults"
import { createAudioClip, createProjectTrack, createSamplerClip } from "./projectFactories"
import { isMidiTrack } from "./timelineQueries"
import type {
  AudioClip,
  MidiClip,
  MidiTrack,
  MusicalProject,
  SamplerClip,
  SamplerTrack,
  TimelineTrack,
} from "./projectTypes"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

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
  if (!value || typeof value !== "object") return false

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
      typeof note.playbackTrackId === "string" ? note.playbackTrackId : undefined,
    playbackVolume:
      typeof note.playbackVolume === "number" ? note.playbackVolume : undefined,
    playbackSource: note.playbackSource === "smc-pad" ? "smc-pad" : "note",
    smcPadSoundId: isValidSmcPadSoundId(note.smcPadSoundId)
      ? note.smcPadSoundId
      : undefined,
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
          (point): point is Record<string, unknown> => {
            if (!point || typeof point !== "object") return false
            const record = point as Record<string, unknown>
            return (
              typeof record.time === "number" &&
              typeof record.value === "number"
            )
          },
        )
        .map((point) => ({
          time: Math.max(0, point.time as number),
          value: clamp(point.value as number, 0, 1.5),
        }))
        .sort((left, right) => left.time - right.time)
    : []

  let clips: MidiClip[]

  if (Array.isArray(raw.clips)) {
    clips = (raw.clips as unknown[])
      .filter((clip): clip is Record<string, unknown> => !!clip && typeof clip === "object")
      .map((clip) => ({
        id: typeof clip.id === "string" ? clip.id : `clip-migrated-${Date.now()}`,
        startTime: typeof clip.startTime === "number" ? Math.max(clip.startTime, 0) : 0,
        notes: Array.isArray(clip.notes)
          ? (clip.notes as unknown[]).filter(isRecordedNote).map(normalizeRawNote)
          : [],
      }))
  } else {
    const legacyStartTime =
      typeof raw.startTime === "number"
        ? Math.max(raw.startTime, 0)
        : typeof rawTimelineClip?.startTime === "number"
          ? Math.max(rawTimelineClip.startTime as number, 0)
          : 0
    const rawNotes = Array.isArray(raw.notes)
      ? (raw.notes as unknown[]).filter(isRecordedNote).map(normalizeRawNote)
      : []
    clips =
      rawNotes.length > 0 || legacyStartTime > 0
        ? [
            {
              id: `clip-migrated-${raw.id as string}`,
              notes: rawNotes,
              startTime: legacyStartTime,
            },
          ]
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
    trackType:
      raw.trackType === "percussion"
        ? "percussion"
        : raw.trackType === "steps"
          ? "steps"
          : "melodic",
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
    volume: typeof raw.volume === "number" ? raw.volume : 1,
  }
}

function normalizePluginStates(value: unknown) {
  if (!value || typeof value !== "object") return createDefaultPluginStates()

  const rawStates = value as Record<string, unknown>
  const pluginStatePatch: Partial<MiMIDIPluginStateMap> = {}

  for (const [pluginId, pluginState] of Object.entries(rawStates)) {
    if (!isKnownPluginId(pluginId) || typeof pluginState !== "boolean") continue
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
    if (typeof entry.distortion === "number") padEntry.distortion = entry.distortion
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
    timeline = (project.timeline as unknown[])
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
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
          let samplerClips: SamplerClip[]
          if (Array.isArray(item.clips)) {
            samplerClips = (item.clips as unknown[])
              .filter((clip): clip is Record<string, unknown> => !!clip && typeof clip === "object")
              .map((clip) => ({
                id: typeof clip.id === "string" ? clip.id : `sclip-migrated-${Date.now()}`,
                startTime: typeof clip.startTime === "number" ? Math.max(clip.startTime, 0) : 0,
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
              .filter((clip): clip is Record<string, unknown> => !!clip && typeof clip === "object")
              .map((clip) => ({
                id: typeof clip.id === "string" ? clip.id : `aclip-migrated-${Date.now()}`,
                startTime: typeof clip.startTime === "number" ? Math.max(clip.startTime, 0) : 0,
              }))
          } else {
            audioClips = [
              createAudioClip(typeof item.startTime === "number" ? item.startTime : 0),
            ]
          }
          return [
            {
              kind: "audio-clip",
              id: item.id,
              name: item.name,
              dbId: item.dbId,
              duration: item.duration,
              clips: audioClips,
              muted: typeof item.muted === "boolean" ? item.muted : false,
            },
          ]
        }

        return []
      })
  } else {
    const midiTracks: MidiTrack[] = (project.tracks as unknown[])
      .filter(
        (track): track is Record<string, unknown> =>
          !!track && typeof track === "object" && isMidiTrackData(track),
      )
      .map(normalizeMidiTrackData)

    const rawMixes = Array.isArray(project.samplerMixes)
      ? project.samplerMixes
      : []

    const samplerTracks: SamplerTrack[] = (rawMixes as unknown[])
      .filter(
        (mix): mix is Record<string, unknown> => {
          if (!mix || typeof mix !== "object") return false
          const record = mix as Record<string, unknown>
          return (
            typeof record.id === "string" &&
            typeof record.name === "string" &&
            !!record.pattern
          )
        },
      )
      .map((mix) => ({
        kind: "sampler" as const,
        id: mix.id as string,
        clips: [createSamplerClip(typeof mix.startTime === "number" ? mix.startTime : 0)],
        muted: typeof mix.muted === "boolean" ? mix.muted : false,
        name: mix.name as string,
        pattern: mix.pattern as SequencerPattern,
      }))

    timeline = [...midiTracks, ...samplerTracks]
  }

  if (!timeline.some(isMidiTrack)) {
    timeline = [createProjectTrack(1), ...timeline]
  }

  const importedProject: MusicalProject = {
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
  }
  const availableInstruments = getAvailableMathematicalInstruments(
    importedProject.pluginStates,
  )

  return syncProjectTrackInstruments(importedProject, {
    fallbackInstrumentId: availableInstruments[0]?.id ?? "pure-sine",
    instrumentIds: new Set(availableInstruments.map((instrument) => instrument.id)),
  })
}
