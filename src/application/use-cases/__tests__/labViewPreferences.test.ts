import { describe, expect, it, vi } from "vitest"
import type { SettingsRepository } from "../../ports/SettingsRepository"
import {
  clampLabSeqBpm,
  clearLabActiveStepsTrackIdWithRepository,
  loadLabActiveStepsTrackIdWithRepository,
  loadLabStepCountWithRepository,
  loadLabPadViewModeWithRepository,
  loadLabPianoViewModeWithRepository,
  loadLabSeqBpmWithRepository,
  loadLabSeqSubdivisionWithRepository,
  resetLabProjectViewPreferencesWithRepository,
  saveLabStepCountWithRepository,
  saveLabPadViewModeWithRepository,
  saveLabPianoViewModeWithRepository,
  saveLabSeqBpmWithRepository,
  saveLabSeqSubdivisionWithRepository,
  saveLabActiveStepsTrackIdWithRepository,
} from "../labViewPreferences"

function createSettingsRepository(
  overrides: Partial<SettingsRepository> = {},
): SettingsRepository {
  return {
    getBoolean: vi.fn(),
    getNumber: vi.fn(),
    getString: vi.fn(),
    remove: vi.fn(),
    setBoolean: vi.fn(),
    setNumber: vi.fn(),
    setString: vi.fn(),
    ...overrides,
  }
}

describe("lab view preferences use-cases", () => {
  it("loads lab view modes with current defaults", () => {
    const repository = createSettingsRepository({
      getString: vi
        .fn()
        .mockImplementation((_key: string, fallback: string) => fallback),
    })

    expect(loadLabPadViewModeWithRepository(repository)).toBe("pads")
    expect(loadLabPianoViewModeWithRepository(repository)).toBe("keys")
    expect(repository.getString).toHaveBeenCalledWith(
      "mimidi-pad-view-mode",
      "pads",
    )
    expect(repository.getString).toHaveBeenCalledWith(
      "mimidi-piano-view-mode",
      "keys",
    )
  })

  it("loads only supported stored lab view modes", () => {
    const repository = createSettingsRepository({
      getString: vi.fn((key: string) =>
        key === "mimidi-pad-view-mode" ? "beats" : "steps",
      ),
    })

    expect(loadLabPadViewModeWithRepository(repository)).toBe("beats")
    expect(loadLabPianoViewModeWithRepository(repository)).toBe("steps")
  })

  it("falls back when stored lab view modes are unsupported", () => {
    const repository = createSettingsRepository({
      getString: vi.fn().mockReturnValue("unexpected"),
    })

    expect(loadLabPadViewModeWithRepository(repository)).toBe("pads")
    expect(loadLabPianoViewModeWithRepository(repository)).toBe("keys")
  })

  it("saves lab view modes through the repository", () => {
    const repository = createSettingsRepository()

    saveLabPadViewModeWithRepository(repository, "beats")
    saveLabPianoViewModeWithRepository(repository, "steps")

    expect(repository.setString).toHaveBeenCalledWith(
      "mimidi-pad-view-mode",
      "beats",
    )
    expect(repository.setString).toHaveBeenCalledWith(
      "mimidi-piano-view-mode",
      "steps",
    )
  })

  it("loads sequencer preferences with current defaults", () => {
    const repository = createSettingsRepository({
      getNumber: vi
        .fn()
        .mockImplementation((_key: string, fallback: number) => fallback),
    })

    expect(loadLabSeqBpmWithRepository(repository)).toBe(120)
    expect(loadLabSeqSubdivisionWithRepository(repository)).toBe(4)
    expect(repository.getNumber).toHaveBeenCalledWith("mimidi-seq-bpm", 120)
    expect(repository.getNumber).toHaveBeenCalledWith(
      "mimidi-seq-subdivision",
      4,
    )
  })

  it("clamps sequencer bpm to the current supported range", () => {
    expect(clampLabSeqBpm(20)).toBe(40)
    expect(clampLabSeqBpm(120)).toBe(120)
    expect(clampLabSeqBpm(300)).toBe(240)
  })

  it("loads only supported sequencer subdivisions", () => {
    const repository = createSettingsRepository({
      getNumber: vi.fn().mockReturnValue(8),
    })

    expect(loadLabSeqSubdivisionWithRepository(repository)).toBe(8)

    const invalidRepository = createSettingsRepository({
      getNumber: vi.fn().mockReturnValue(3),
    })

    expect(loadLabSeqSubdivisionWithRepository(invalidRepository)).toBe(4)
  })

  it("saves sequencer preferences through the repository", () => {
    const repository = createSettingsRepository()

    expect(saveLabSeqBpmWithRepository(repository, 300)).toBe(240)
    saveLabSeqSubdivisionWithRepository(repository, 2)

    expect(repository.setNumber).toHaveBeenCalledWith("mimidi-seq-bpm", 240)
    expect(repository.setNumber).toHaveBeenCalledWith(
      "mimidi-seq-subdivision",
      2,
    )
  })

  it("loads step count with current defaults and supported values", () => {
    const defaultRepository = createSettingsRepository({
      getNumber: vi
        .fn()
        .mockImplementation((_key: string, fallback: number) => fallback),
    })

    expect(loadLabStepCountWithRepository(defaultRepository)).toBe(16)
    expect(defaultRepository.getNumber).toHaveBeenCalledWith(
      "mimidi-seq-steps",
      16,
    )

    const storedRepository = createSettingsRepository({
      getNumber: vi.fn().mockReturnValue(32),
    })

    expect(loadLabStepCountWithRepository(storedRepository)).toBe(32)
  })

  it("falls back when stored step count is unsupported", () => {
    const repository = createSettingsRepository({
      getNumber: vi.fn().mockReturnValue(10),
    })

    expect(loadLabStepCountWithRepository(repository)).toBe(16)
  })

  it("saves step count through the repository", () => {
    const repository = createSettingsRepository()

    saveLabStepCountWithRepository(repository, 24)

    expect(repository.setNumber).toHaveBeenCalledWith("mimidi-seq-steps", 24)
  })

  it("loads active steps track id as null by default", () => {
    const repository = createSettingsRepository({
      getString: vi
        .fn()
        .mockImplementation((_key: string, fallback: string) => fallback),
    })

    expect(loadLabActiveStepsTrackIdWithRepository(repository)).toBeNull()
    expect(repository.getString).toHaveBeenCalledWith(
      "mimidi-seq-active-steps-track",
      "",
    )
  })

  it("loads active steps track id when stored", () => {
    const repository = createSettingsRepository({
      getString: vi.fn().mockReturnValue("track-123"),
    })

    expect(loadLabActiveStepsTrackIdWithRepository(repository)).toBe(
      "track-123",
    )
  })

  it("saves and clears active steps track id through the repository", () => {
    const repository = createSettingsRepository()

    saveLabActiveStepsTrackIdWithRepository(repository, "track-123")
    clearLabActiveStepsTrackIdWithRepository(repository)

    expect(repository.setString).toHaveBeenCalledWith(
      "mimidi-seq-active-steps-track",
      "track-123",
    )
    expect(repository.remove).toHaveBeenCalledWith(
      "mimidi-seq-active-steps-track",
    )
  })

  it("resets project view preferences and visible state in the current order", () => {
    const calls: string[] = []
    const repository = createSettingsRepository({
      remove: vi.fn(() => {
        calls.push("remove-active-steps-track")
      }),
      setString: vi.fn(() => {
        calls.push("save-piano-view-mode")
      }),
    })

    resetLabProjectViewPreferencesWithRepository(repository, {
      clearActiveStepsTrack: () => {
        calls.push("clear-active-steps-track")
      },
      resetPianoViewMode: () => {
        calls.push("reset-piano-view-mode")
      },
    })

    expect(calls).toEqual([
      "reset-piano-view-mode",
      "save-piano-view-mode",
      "clear-active-steps-track",
      "remove-active-steps-track",
    ])
    expect(repository.setString).toHaveBeenCalledWith(
      "mimidi-piano-view-mode",
      "keys",
    )
    expect(repository.remove).toHaveBeenCalledWith(
      "mimidi-seq-active-steps-track",
    )
  })
})
