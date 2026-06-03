import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  PAD_SOUND_DEFAULTS,
  playSmcPadHit,
} from "../../application/use-cases/playSmcPadHit"
import type { PadSoundParams, SmcPadSoundDescriptor, SmcPadSoundId } from "../../application/use-cases/playSmcPadHit"
import type { MidiRecordedNote } from "../../engine/midi/events"
import { calcStepDurationSec } from "../step-sequencer/useMelodicSequencer"
import type { StepCount, StepSubdivision } from "../step-sequencer/useMelodicSequencer"

const MAX_STEPS = 64

function makeGrid(rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array<boolean>(MAX_STEPS).fill(false))
}

export function usePadBeats({
  sounds,
  bpm,
  stepSubdivision = 4,
  clipNotes,
  padSoundSettings,
  onToggleStep,
  onClearAll,
}: {
  sounds: SmcPadSoundDescriptor[]
  bpm: number
  stepSubdivision?: StepSubdivision
  clipNotes: MidiRecordedNote[]
  padSoundSettings: Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>>
  onToggleStep: (row: number, col: number) => void
  onClearAll: () => void
}) {
  const [stepCount, setStepCountState] = useState<StepCount>(16)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)

  // Grid derivado del clip MIDI — única fuente de verdad
  const grid = useMemo<boolean[][]>(() => {
    const stepDurationSec = calcStepDurationSec(bpm, stepSubdivision)
    const tolerance = stepDurationSec * 0.5
    const g = makeGrid(sounds.length)
    for (const n of clipNotes) {
      const rowIdx = sounds.findIndex((s) => s.note === n.note)
      if (rowIdx < 0) continue
      const colIdx = Math.round(n.startTime / stepDurationSec)
      if (colIdx < 0 || colIdx >= MAX_STEPS) continue
      if (Math.abs(n.startTime - colIdx * stepDurationSec) >= tolerance) continue
      g[rowIdx][colIdx] = true
    }
    return g
  }, [clipNotes, sounds, bpm, stepSubdivision])

  const gridRef = useRef(grid)
  const soundsRef = useRef(sounds)
  const bpmRef = useRef(bpm)
  const subdivisionRef = useRef(stepSubdivision)
  const stepCountRef = useRef(stepCount)
  const padSoundSettingsRef = useRef(padSoundSettings)

  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { soundsRef.current = sounds }, [sounds])
  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { subdivisionRef.current = stepSubdivision }, [stepSubdivision])
  useEffect(() => { stepCountRef.current = stepCount }, [stepCount])
  useEffect(() => { padSoundSettingsRef.current = padSoundSettings }, [padSoundSettings])

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
      setActiveStep(step)

      gridRef.current.forEach((row, rowIdx) => {
        if (!row[step]) return
        const sound = soundsRef.current[rowIdx]
        if (!sound) return
        const settings = {
          ...PAD_SOUND_DEFAULTS[sound.id],
          ...padSoundSettingsRef.current[sound.id],
        }
        playSmcPadHit(sound.id, settings.volume ?? 1, 0, settings)
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
