import type { SettingsRepository } from "../ports/SettingsRepository"

export type LabPadViewMode = "pads" | "beats"
export type LabPianoViewMode = "keys" | "steps"
export type LabStepCount = 4 | 8 | 12 | 16 | 24 | 32 | 64
export type LabStepSubdivision = 1 | 2 | 4 | 8

export const LAB_VIEW_PREFERENCE_KEYS = {
  padViewMode: "mimidi-pad-view-mode",
  pianoViewMode: "mimidi-piano-view-mode",
  seqBpm: "mimidi-seq-bpm",
  seqActiveStepsTrack: "mimidi-seq-active-steps-track",
  seqSteps: "mimidi-seq-steps",
  seqSubdivision: "mimidi-seq-subdivision",
} as const

const LAB_DEFAULT_SEQ_BPM = 120
const LAB_MAX_SEQ_BPM = 240
const LAB_MIN_SEQ_BPM = 40
export const LAB_STEP_COUNT_OPTIONS: readonly LabStepCount[] = [
  4,
  8,
  12,
  16,
  24,
  32,
  64,
]
const LAB_STEP_SUBDIVISIONS: readonly LabStepSubdivision[] = [1, 2, 4, 8]

export function clampLabSeqBpm(bpm: number): number {
  return Math.max(LAB_MIN_SEQ_BPM, Math.min(LAB_MAX_SEQ_BPM, bpm))
}

export function loadLabPadViewModeWithRepository(
  repository: SettingsRepository,
): LabPadViewMode {
  return repository.getString(LAB_VIEW_PREFERENCE_KEYS.padViewMode, "pads") ===
    "beats"
    ? "beats"
    : "pads"
}

export function saveLabPadViewModeWithRepository(
  repository: SettingsRepository,
  mode: LabPadViewMode,
): void {
  repository.setString(LAB_VIEW_PREFERENCE_KEYS.padViewMode, mode)
}

export function loadLabPianoViewModeWithRepository(
  repository: SettingsRepository,
): LabPianoViewMode {
  return repository.getString(
    LAB_VIEW_PREFERENCE_KEYS.pianoViewMode,
    "keys",
  ) === "steps"
    ? "steps"
    : "keys"
}

export function saveLabPianoViewModeWithRepository(
  repository: SettingsRepository,
  mode: LabPianoViewMode,
): void {
  repository.setString(LAB_VIEW_PREFERENCE_KEYS.pianoViewMode, mode)
}

export function loadLabSeqBpmWithRepository(
  repository: SettingsRepository,
): number {
  return clampLabSeqBpm(
    repository.getNumber(LAB_VIEW_PREFERENCE_KEYS.seqBpm, LAB_DEFAULT_SEQ_BPM),
  )
}

export function saveLabSeqBpmWithRepository(
  repository: SettingsRepository,
  bpm: number,
): number {
  const clamped = clampLabSeqBpm(bpm)
  repository.setNumber(LAB_VIEW_PREFERENCE_KEYS.seqBpm, clamped)
  return clamped
}

export function loadLabSeqSubdivisionWithRepository(
  repository: SettingsRepository,
): LabStepSubdivision {
  const stored = repository.getNumber(
    LAB_VIEW_PREFERENCE_KEYS.seqSubdivision,
    4,
  )

  return LAB_STEP_SUBDIVISIONS.includes(stored as LabStepSubdivision)
    ? (stored as LabStepSubdivision)
    : 4
}

export function saveLabSeqSubdivisionWithRepository(
  repository: SettingsRepository,
  subdivision: LabStepSubdivision,
): void {
  repository.setNumber(LAB_VIEW_PREFERENCE_KEYS.seqSubdivision, subdivision)
}

export function loadLabStepCountWithRepository(
  repository: SettingsRepository,
): LabStepCount {
  const stored = repository.getNumber(LAB_VIEW_PREFERENCE_KEYS.seqSteps, 16)

  return LAB_STEP_COUNT_OPTIONS.includes(stored as LabStepCount)
    ? (stored as LabStepCount)
    : 16
}

export function saveLabStepCountWithRepository(
  repository: SettingsRepository,
  stepCount: LabStepCount,
): void {
  repository.setNumber(LAB_VIEW_PREFERENCE_KEYS.seqSteps, stepCount)
}

export function loadLabActiveStepsTrackIdWithRepository(
  repository: SettingsRepository,
): string | null {
  const stored = repository.getString(
    LAB_VIEW_PREFERENCE_KEYS.seqActiveStepsTrack,
    "",
  )

  return stored === "" ? null : stored
}

export function saveLabActiveStepsTrackIdWithRepository(
  repository: SettingsRepository,
  trackId: string,
): void {
  repository.setString(LAB_VIEW_PREFERENCE_KEYS.seqActiveStepsTrack, trackId)
}

export function clearLabActiveStepsTrackIdWithRepository(
  repository: SettingsRepository,
): void {
  repository.remove(LAB_VIEW_PREFERENCE_KEYS.seqActiveStepsTrack)
}

export function resetLabProjectViewPreferencesWithRepository(
  repository: SettingsRepository,
  {
    clearActiveStepsTrack,
    resetPianoViewMode,
  }: {
    clearActiveStepsTrack: () => void
    resetPianoViewMode: () => void
  },
): void {
  resetPianoViewMode()
  saveLabPianoViewModeWithRepository(repository, "keys")
  clearActiveStepsTrack()
  clearLabActiveStepsTrackIdWithRepository(repository)
}
