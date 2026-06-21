import { describe, expect, it, vi } from "vitest"
import type { SettingsRepository } from "../../ports/SettingsRepository"
import {
  isCompleteTutorialSeenWithRepository,
  isTutorialSeenWithRepository,
  markCompleteTutorialSeenWithRepository,
  markTutorialSeenWithRepository,
} from "../tutorialProgress"

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

describe("tutorial progress use-cases", () => {
  it("loads tutorial progress as unseen by default", () => {
    const repository = createSettingsRepository({
      getBoolean: vi
        .fn()
        .mockImplementation((_key: string, fallback: boolean) => fallback),
    })

    expect(isTutorialSeenWithRepository(repository)).toBe(false)
    expect(isCompleteTutorialSeenWithRepository(repository)).toBe(false)
    expect(repository.getBoolean).toHaveBeenCalledWith(
      "mimidi-tutorial-seen",
      false,
    )
    expect(repository.getBoolean).toHaveBeenCalledWith(
      "mimidi-complete-tutorial-seen",
      false,
    )
  })

  it("marks tutorial progress through the repository", () => {
    const repository = createSettingsRepository()

    markTutorialSeenWithRepository(repository)
    markCompleteTutorialSeenWithRepository(repository)

    expect(repository.setBoolean).toHaveBeenCalledWith(
      "mimidi-tutorial-seen",
      true,
    )
    expect(repository.setBoolean).toHaveBeenCalledWith(
      "mimidi-complete-tutorial-seen",
      true,
    )
  })
})
