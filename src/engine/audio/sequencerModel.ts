import type { SampleSlotMeta } from "./sampleModel"

export const SEQ_DEFAULT_BPM = 120
const SEQ_STORAGE_KEY = "mimidi-seq-pattern"

export type SequencerStep = { active: boolean }

export type SequencerLane = {
  slotDbId: string
  steps: SequencerStep[]
}

export type SequencerPattern = {
  bpm: number
  stepsPerBar: number
  lanes: SequencerLane[]
}

export function createDefaultPattern(): SequencerPattern {
  return { bpm: SEQ_DEFAULT_BPM, stepsPerBar: 16, lanes: [] }
}

export function syncPatternLanes(
  pattern: SequencerPattern,
  slots: (SampleSlotMeta | null)[],
): SequencerPattern {
  const filled = slots.filter((s): s is SampleSlotMeta => s !== null)
  const lanes = filled.map(slot => {
    const ex = pattern.lanes.find(l => l.slotDbId === slot.dbId)
    if (ex && ex.steps.length === pattern.stepsPerBar) return ex
    const steps = Array.from({ length: pattern.stepsPerBar }, (_, i) =>
      ex?.steps[i] ?? { active: false },
    )
    return { slotDbId: slot.dbId, steps }
  })
  return { ...pattern, lanes }
}

export function resizePatternSteps(
  pattern: SequencerPattern,
  stepsPerBar: number,
): SequencerPattern {
  if (pattern.stepsPerBar === stepsPerBar) return pattern
  const lanes = pattern.lanes.map(lane => ({
    ...lane,
    steps: Array.from({ length: stepsPerBar }, (_, i) => lane.steps[i] ?? { active: false }),
  }))
  return { ...pattern, stepsPerBar, lanes }
}

export function saveSeqPattern(p: SequencerPattern): void {
  localStorage.setItem(SEQ_STORAGE_KEY, JSON.stringify(p))
}

export function loadSeqPattern(): SequencerPattern {
  try {
    const raw = localStorage.getItem(SEQ_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SequencerPattern
  } catch { /* ignore */ }
  return createDefaultPattern()
}
