import type { ADSREnvelope } from "../audio/audioEngine"
import type { MusicalNote } from "./notes"
import type { MathematicalInstrumentId } from "../audio/mathematicalInstruments"

export type MidiNoteEventType = "note-on" | "note-off"

export type SmcPadSoundId =
  | "kick" | "snare" | "hat" | "clap" | "tom" | "cowbell" | "rimshot" | "shaker"
  | "open-hat" | "crash" | "ride" | "floor-tom" | "hi-tom" | "conga" | "woodblock" | "sub"

export type PadSoundParams = {
  volume: number
  decay: number
  distortion: number
  tune?: number
  length?: number
  flicker?: boolean
}

export type MidiNoteEvent = {
  id: string
  type: MidiNoteEventType
  note: MusicalNote
  time: number
  velocity: number
}

export type MidiRecordedNote = {
  id: string
  note: MusicalNote
  startTime: number
  duration: number
  velocity: number
  instrumentId: MathematicalInstrumentId
  playbackSource?: "note" | "smc-pad"
  smcPadSoundId?: SmcPadSoundId
  playbackEnvelope?: Partial<ADSREnvelope>
  playbackPan?: number
  playbackTrackId?: string
  playbackVolume?: number
}

export function isSmcPadRecordedNote(note: MidiRecordedNote) {
  return note.playbackSource === "smc-pad"
}

export function createMidiNoteEvent(
  type: MidiNoteEventType,
  note: MusicalNote,
  time: number,
  velocity = 1,
): MidiNoteEvent {
  return {
    id: `${type}-${note}-${time.toFixed(3)}`,
    type,
    note,
    time,
    velocity,
  }
}

export function createMidiRecordedNote(
  noteOnEvent: MidiNoteEvent,
  noteOffTime: number,
  instrumentId: MathematicalInstrumentId,
  options: Partial<
    Pick<
      MidiRecordedNote,
      | "playbackEnvelope"
      | "playbackPan"
      | "playbackSource"
      | "playbackTrackId"
      | "playbackVolume"
      | "smcPadSoundId"
    >
  > = {},
): MidiRecordedNote {
  return {
    id: `note-${noteOnEvent.note}-${noteOnEvent.time.toFixed(3)}-${noteOffTime.toFixed(3)}`,
    note: noteOnEvent.note,
    startTime: noteOnEvent.time,
    duration: Math.max(noteOffTime - noteOnEvent.time, 0),
    velocity: noteOnEvent.velocity,
    instrumentId,
    playbackEnvelope: options.playbackEnvelope,
    playbackPan: options.playbackPan,
    playbackTrackId: options.playbackTrackId,
    playbackVolume: options.playbackVolume,
    playbackSource: options.playbackSource ?? "note",
    smcPadSoundId: options.smcPadSoundId,
  }
}
