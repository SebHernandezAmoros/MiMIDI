import {
  playFrequency,
  startFrequency,
  stopVoice,
  type PlayFrequencyOptions,
  type VoiceId,
} from "../../engine/audio/audioEngine"
import { noteToFrequency, type MusicalNote } from "../../engine/midi/notes"

export type PlayNoteOptions = PlayFrequencyOptions
export type ActiveNoteId = VoiceId

export function playNote(
  note: MusicalNote,
  duration = 1,
  options: PlayNoteOptions = {},
) {
  return playFrequency(noteToFrequency(note), duration, options)
}

export function playNotes(
  notes: MusicalNote[],
  duration = 1,
  options: PlayNoteOptions = {},
) {
  return notes.map((note) => playNote(note, duration, options))
}

export function startNote(note: MusicalNote, options: PlayNoteOptions = {}) {
  return startFrequency(noteToFrequency(note), options)
}

export function stopNote(activeNoteId: ActiveNoteId) {
  stopVoice(activeNoteId)
}
