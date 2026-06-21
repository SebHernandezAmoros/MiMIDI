import { describe, expect, it, vi } from "vitest"
import type { SettingsRepository } from "../../ports/SettingsRepository"
import {
  loadAppSettingsWithRepository,
  saveDarkModeWithRepository,
  saveMasterVolumeWithRepository,
  saveShowKeyLabelsWithRepository,
} from "../appSettings"

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

describe("app settings use-cases", () => {
  it("loads app settings with current defaults", () => {
    const repository = createSettingsRepository({
      getBoolean: vi
        .fn()
        .mockImplementation((_key: string, fallback: boolean) => fallback),
      getNumber: vi
        .fn()
        .mockImplementation((_key: string, fallback: number) => fallback),
    })

    const result = loadAppSettingsWithRepository(repository)

    expect(result).toEqual({
      darkMode: false,
      masterVolume: 0.8,
      showKeyLabels: true,
    })
    expect(repository.getBoolean).toHaveBeenCalledWith(
      "mimidi-dark-mode",
      false,
    )
    expect(repository.getBoolean).toHaveBeenCalledWith(
      "mimidi-show-key-labels",
      true,
    )
    expect(repository.getNumber).toHaveBeenCalledWith(
      "mimidi-master-volume",
      0.8,
    )
  })

  it("saves individual app settings through the repository", () => {
    const repository = createSettingsRepository()

    saveDarkModeWithRepository(repository, true)
    saveShowKeyLabelsWithRepository(repository, false)
    saveMasterVolumeWithRepository(repository, 0.5)

    expect(repository.setBoolean).toHaveBeenCalledWith(
      "mimidi-dark-mode",
      true,
    )
    expect(repository.setBoolean).toHaveBeenCalledWith(
      "mimidi-show-key-labels",
      false,
    )
    expect(repository.setNumber).toHaveBeenCalledWith(
      "mimidi-master-volume",
      0.5,
    )
  })
})
