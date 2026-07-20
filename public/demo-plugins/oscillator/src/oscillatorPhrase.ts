import {
  getOscillatorInstrumentId,
  normalizeOscillatorSettings,
  type OscillatorSettings,
} from "./oscillatorModel"

type MidiRecordedNote = {
  id: string
  note: string
  startTime: number
  duration: number
  velocity: number
  instrumentId: string
  playbackSource?: "note"
  playbackEnvelope?: {
    attack?: number
    decay?: number
    sustain?: number
    release?: number
  }
}

export type OscillatorPhrase = {
  name: string
  instrumentId: string
  notes: MidiRecordedNote[]
}

const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const NOTE_NAMES = ["C", "C#","D", "D#","E", "F", "F#","G", "G#","A", "A#","B"]

const PATTERN_INTERVALS: Record<OscillatorSettings["pattern"], number[]> = {
  rise: [0, 2, 4, 7, 9, 7, 4, 2],
  pulse: [0, 0, 7, 0, 12, 7, 0, 7],
  stairs: [0, 4, 7, 12, 7, 4, 2, 0],
}

function noteFromMidi(midi: number) {
  const note = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}

export function createOscillatorPhrase(
  rawSettings: Partial<OscillatorSettings>,
  bpm: number,
): OscillatorPhrase {
  const settings = normalizeOscillatorSettings(rawSettings)
  const safeBpm = Math.min(Math.max(Math.round(bpm || 120), 40), 240)
  const beatDuration = 60 / safeBpm
  const stepDuration = beatDuration / 2
  const rootMidi = (settings.octave + 1) * 12 + NOTE_OFFSETS[settings.rootNote]
  const instrumentId = getOscillatorInstrumentId()
  const intervals = PATTERN_INTERVALS[settings.pattern]

  return {
    name: `Oscillator ${settings.waveform} ${settings.rootNote}${settings.octave}`,
    instrumentId,
    notes: intervals.map((interval, index) => {
      const startTime = Number((index * stepDuration).toFixed(3))
      const duration = Number((stepDuration * 0.82).toFixed(3))
      const note = noteFromMidi(rootMidi + interval)

      return {
        id: `osc-${settings.waveform}-${settings.pattern}-${note}-${startTime}`,
        note,
        startTime,
        duration,
        velocity: index % 2 === 0 ? 0.92 : 0.74,
        instrumentId,
        playbackSource: "note",
        playbackEnvelope: {
          attack: settings.attack,
          decay: settings.decay,
          sustain: settings.sustain,
          release: settings.release,
        },
      }
    }),
  }
}
