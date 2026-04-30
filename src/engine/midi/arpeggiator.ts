import { transposeNote, type MusicalNote } from "./notes"

export type ArpeggiatorMode = "up" | "down" | "up-down" | "random" | "chord"
export type ArpeggiatorRate = "1/4" | "1/8" | "1/16" | "1/8T"

export type ArpeggiatorSettings = {
  enabled: boolean
  gate: number
  latch: boolean
  mode: ArpeggiatorMode
  octaveRange: number
  rate: ArpeggiatorRate
}

export type ArpeggiatorStep = {
  notes: MusicalNote[]
}

const RATE_DURATIONS: Record<ArpeggiatorRate, number> = {
  "1/4": 0.6,
  "1/8": 0.3,
  "1/16": 0.15,
  "1/8T": 0.2,
}

export const defaultArpeggiatorSettings: ArpeggiatorSettings = {
  enabled: false,
  gate: 0.78,
  latch: false,
  mode: "up",
  octaveRange: 1,
  rate: "1/8",
}

function uniqueNotes(notes: MusicalNote[]) {
  return Array.from(new Set(notes))
}

export function getArpeggiatorStepDuration(rate: ArpeggiatorRate) {
  return RATE_DURATIONS[rate]
}

export function getArpeggiatorNoteDuration(settings: ArpeggiatorSettings) {
  return Math.max(getArpeggiatorStepDuration(settings.rate) * settings.gate, 0.04)
}

export function expandArpeggiatorNotes(
  sourceNotes: MusicalNote[],
  octaveRange: number,
) {
  const range = Math.min(Math.max(octaveRange, 1), 3)
  const dedupedNotes = uniqueNotes(sourceNotes)

  return Array.from({ length: range }, (_, octaveIndex) => octaveIndex).flatMap(
    (octaveIndex) =>
      dedupedNotes.map((note) => transposeNote(note, octaveIndex * 12)),
  )
}

export function createArpeggiatorSteps(
  sourceNotes: MusicalNote[],
  settings: ArpeggiatorSettings,
) {
  const expandedNotes = expandArpeggiatorNotes(sourceNotes, settings.octaveRange)

  if (expandedNotes.length === 0) {
    return []
  }

  if (settings.mode === "chord") {
    return [{ notes: expandedNotes }] satisfies ArpeggiatorStep[]
  }

  if (settings.mode === "random") {
    return expandedNotes.map(() => ({
      notes: [expandedNotes[Math.floor(Math.random() * expandedNotes.length)]],
    }))
  }

  if (settings.mode === "down") {
    return [...expandedNotes].reverse().map((note) => ({ notes: [note] }))
  }

  if (settings.mode === "up-down") {
    const ascending = expandedNotes.map((note) => ({ notes: [note] }))
    const descending = expandedNotes
      .slice(1, -1)
      .reverse()
      .map((note) => ({ notes: [note] }))

    return [...ascending, ...descending]
  }

  return expandedNotes.map((note) => ({ notes: [note] }))
}
