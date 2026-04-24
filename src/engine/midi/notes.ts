export type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B"

export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type MusicalNote = `${NoteName}${Octave}`

const NOTE_OFFSETS: Record<NoteName, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
}

export const chromaticNoteNames: NoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

export const pianoPreviewNotes: MusicalNote[] = [
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
]

export const availableNotes = pianoPreviewNotes

export function noteToMidiNumber(note: MusicalNote) {
  const [, noteName, octaveText] = note.match(/^([A-G]#?)([0-8])$/) ?? []

  if (!noteName || !octaveText) {
    throw new Error(`Invalid musical note: ${note}`)
  }

  const octave = Number(octaveText)
  const noteOffset = NOTE_OFFSETS[noteName as NoteName]

  return (octave + 1) * 12 + noteOffset
}

export function noteToFrequency(note: MusicalNote) {
  const midiNumber = noteToMidiNumber(note)
  const frequency = 440 * 2 ** ((midiNumber - 69) / 12)

  return Number(frequency.toFixed(2))
}

export function midiNumberToNote(midiNumber: number): MusicalNote {
  if (midiNumber < 12 || midiNumber > 119) {
    throw new Error(`MIDI note out of supported range: ${midiNumber}`)
  }

  const octave = Math.floor(midiNumber / 12) - 1
  const noteName = chromaticNoteNames[midiNumber % 12]

  return `${noteName}${octave}` as MusicalNote
}

export function transposeNote(note: MusicalNote, semitones: number) {
  return midiNumberToNote(noteToMidiNumber(note) + semitones)
}
