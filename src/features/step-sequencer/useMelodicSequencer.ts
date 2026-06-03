import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { playNote } from "../../application/use-cases/playNote"
import type { PlayNoteOptions } from "../../application/use-cases/playNote"
import type { MidiRecordedNote } from "../../engine/midi/events"
import type { MusicalNote } from "../../engine/midi/notes"

export type StepCount = 4 | 8 | 12 | 16 | 24 | 32 | 64
export const STEP_COUNT_OPTIONS: StepCount[] = [4, 8, 12, 16, 24, 32, 64]
const MAX_STEPS = 64

// Divisor de subdivisión: 1=negra(1/4), 2=corchea(1/8), 4=semicorchea(1/16), 8=fusa(1/32)
export type StepSubdivision = 1 | 2 | 4 | 8
export const STEP_SUBDIVISION_OPTIONS: { value: StepSubdivision; label: string }[] = [
  { value: 1, label: "1/4" },
  { value: 2, label: "1/8" },
  { value: 4, label: "1/16" },
  { value: 8, label: "1/32" },
]

const STEPS_KEY = "mimidi-seq-steps"

function makeGrid(rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array<boolean>(MAX_STEPS).fill(false))
}

const VALID_STEP_COUNTS = new Set<number>(STEP_COUNT_OPTIONS)

function loadStepCount(): StepCount {
  try {
    const n = Number(localStorage.getItem(STEPS_KEY))
    if (VALID_STEP_COUNTS.has(n)) return n as StepCount
  } catch {}
  return 16
}

/** Duración de un paso en segundos dada la subdivisión y el BPM. */
export function calcStepDurationSec(bpm: number, subdivision: StepSubdivision): number {
  return (60 / bpm) / subdivision
}

export function useMelodicSequencer({
  notes,
  playOptions,
  bpm,
  stepSubdivision = 4,
  clipNotes,
  onToggleStep,
  onClearAll,
}: {
  notes: MusicalNote[]
  playOptions: PlayNoteOptions
  bpm: number
  stepSubdivision?: StepSubdivision
  clipNotes: MidiRecordedNote[]
  onToggleStep: (row: number, col: number) => void
  onClearAll: () => void
}) {
  const [stepCount, setStepCountState] = useState<StepCount>(() => loadStepCount())
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)

  // El grid se deriva del clip MIDI — única fuente de verdad
  const grid = useMemo<boolean[][]>(() => {
    const stepDurationSec = calcStepDurationSec(bpm, stepSubdivision)
    const tolerance = stepDurationSec * 0.5
    const g = makeGrid(notes.length)
    for (const n of clipNotes) {
      const noteIdx = notes.indexOf(n.note as MusicalNote)
      if (noteIdx < 0) continue
      const colIdx = Math.round(n.startTime / stepDurationSec)
      if (colIdx < 0 || colIdx >= MAX_STEPS) continue
      if (Math.abs(n.startTime - colIdx * stepDurationSec) >= tolerance) continue
      const rowIdx = notes.length - 1 - noteIdx
      g[rowIdx][colIdx] = true
    }
    return g
  }, [clipNotes, notes, bpm, stepSubdivision])

  const gridRef = useRef(grid)
  const notesRef = useRef(notes)
  const playOptionsRef = useRef(playOptions)
  const stepCountRef = useRef(stepCount)
  const bpmRef = useRef(bpm)
  const subdivisionRef = useRef(stepSubdivision)

  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { notesRef.current = notes }, [notes])
  useEffect(() => { playOptionsRef.current = playOptions }, [playOptions])
  useEffect(() => { stepCountRef.current = stepCount }, [stepCount])
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { subdivisionRef.current = stepSubdivision }, [stepSubdivision])

  useEffect(() => {
    try { localStorage.setItem(STEPS_KEY, String(stepCount)) } catch {}
  }, [stepCount])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    stepRef.current = 0
    setActiveStep(null)
    setIsPlaying(false)
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    const stepMs = calcStepDurationSec(bpmRef.current, subdivisionRef.current) * 1000

    intervalRef.current = setInterval(() => {
      const step = stepRef.current
      const currentNotes = notesRef.current
      const noteDuration = calcStepDurationSec(bpmRef.current, subdivisionRef.current) * 0.8

      setActiveStep(step)

      gridRef.current.forEach((row, rowIdx) => {
        if (row[step]) {
          const noteIdx = currentNotes.length - 1 - rowIdx
          playNote(currentNotes[noteIdx], noteDuration, playOptionsRef.current)
        }
      })

      stepRef.current = (step + 1) % stepCountRef.current
    }, stepMs)

    setIsPlaying(true)
  }, [])

  useEffect(() => () => stop(), [stop])

  const togglePlay = useCallback(() => {
    if (isPlaying) stop()
    else start()
  }, [isPlaying, start, stop])

  const toggleStep = useCallback((row: number, col: number) => {
    onToggleStep(row, col)
  }, [onToggleStep])

  const clearGrid = useCallback(() => {
    stop()
    onClearAll()
  }, [stop, onClearAll])

  const setStepCount = useCallback((sc: StepCount) => {
    setStepCountState(sc)
    stepRef.current = 0
    setActiveStep(null)
  }, [])

  return {
    grid,
    stepCount,
    activeStep,
    isPlaying,
    toggleStep,
    clearGrid,
    togglePlay,
    stop,
    setStepCount,
  }
}
