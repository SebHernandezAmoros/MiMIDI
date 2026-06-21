import type { ADSREnvelope } from "../../engine/audio/audioEngine"
import type { MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import type { SequencerPattern } from "../../engine/audio/sequencerModel"
import type { MidiRecordedNote, PadSoundParams, SmcPadSoundId } from "../../engine/midi/events"
import type { MiMIDIPluginStateMap } from "../../engine/plugins/pluginModel"

export type TrackVolumeAutomationPoint = {
  time: number
  value: number
}

export type TrackVolumeAutomation = {
  enabled: boolean
  points: TrackVolumeAutomationPoint[]
}

export type ProjectTrackType = "melodic" | "percussion" | "steps"

export type MidiClip = {
  id: string
  notes: MidiRecordedNote[]
  startTime: number
}

export type SamplerClip = {
  id: string
  startTime: number
}

export type AudioClip = {
  id: string
  startTime: number
}

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
  kind: "audio-clip"
  id: string
  name: string
  dbId: string
  duration: number
  clips: AudioClip[]
  muted: boolean
}

export type TimelineTrack = MidiTrack | SamplerTrack | AudioClipTrack

export type ProjectTrack = MidiTrack
export type SamplerMixTrack = SamplerTrack

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
