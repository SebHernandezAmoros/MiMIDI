import { describe, expect, it } from "vitest"
import { createOscillatorPhrase } from "./oscillatorPhrase"

describe("oscillatorPhrase", () => {
  it("generates ordered MIDI notes for the selected waveform instrument", () => {
    const phrase = createOscillatorPhrase(
      { waveform: "triangle", rootNote: "D", octave: 4, pattern: "stairs" },
      120,
    )

    expect(phrase.instrumentId).toBe("oscillator")
    expect(phrase.notes).toHaveLength(8)
    expect(phrase.notes[0].note).toBe("D4")
    expect(phrase.notes[1].startTime).toBeGreaterThan(phrase.notes[0].startTime)
    expect(phrase.notes.every((note) => note.duration > 0)).toBe(true)
    expect(phrase.notes.every((note) => note.instrumentId === "oscillator")).toBe(true)
  })

  it("uses BPM to calculate step duration", () => {
    const slow = createOscillatorPhrase({ pattern: "rise" }, 60)
    const fast = createOscillatorPhrase({ pattern: "rise" }, 120)

    expect(slow.notes[1].startTime).toBe(0.5)
    expect(fast.notes[1].startTime).toBe(0.25)
  })
})
