import {
  createArpeggiatorSteps,
  getArpeggiatorNoteDuration,
  getArpeggiatorStepDuration,
  type ArpeggiatorSettings,
} from "../../engine/midi/arpeggiator"
import type { MusicalNote } from "../../engine/midi/notes"
import type { PlaybackTimerPort } from "../ports/PlaybackTimerPort"
import { createBrowserPlaybackTimerPort } from "../../infrastructure/timing/browserPlaybackTimerPort"

export type ArpeggiatorHandle = {
  stop: () => void
}

const browserPlaybackTimerPort = createBrowserPlaybackTimerPort()

type StartArpeggiatorPlaybackOptions = {
  maxSteps?: number
  onComplete?: () => void
  onStep: (notes: MusicalNote[], noteDuration: number, stepIndex: number) => void
  settings: ArpeggiatorSettings
  sourceNotes: MusicalNote[]
  timerPort?: PlaybackTimerPort
}

export function startArpeggiatorPlayback({
  maxSteps,
  onComplete,
  onStep,
  settings,
  sourceNotes,
  timerPort = browserPlaybackTimerPort,
}: StartArpeggiatorPlaybackOptions): ArpeggiatorHandle {
  const baseSteps = createArpeggiatorSteps(sourceNotes, settings)

  if (baseSteps.length === 0) {
    return {
      stop: () => {},
    }
  }

  const noteDuration = getArpeggiatorNoteDuration(settings)
  const stepDuration = getArpeggiatorStepDuration(settings.rate)
  let isStopped = false
  let stepIndex = 0
  let timerId: number | null = null

  const runStep = () => {
    if (isStopped) {
      return
    }

    const step =
      settings.mode === "random"
        ? createArpeggiatorSteps(sourceNotes, settings)[0]
        : baseSteps[stepIndex % baseSteps.length]

    onStep(step.notes, noteDuration, stepIndex)
    stepIndex += 1

    if (typeof maxSteps === "number" && stepIndex >= maxSteps) {
      isStopped = true
      onComplete?.()
      return
    }

    timerId = timerPort.setTimeout(runStep, stepDuration * 1000)
  }

  runStep()

  return {
    stop: () => {
      isStopped = true

      if (timerId !== null) {
        timerPort.clearTimeout(timerId)
      }
    },
  }
}
