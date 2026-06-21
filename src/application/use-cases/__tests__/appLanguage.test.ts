import { describe, expect, it, vi } from "vitest"
import type { SettingsRepository } from "../../ports/SettingsRepository"
import { getAppLanguageFromSearchWithRepository } from "../appLanguage"

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

describe("app language use-cases", () => {
  it("persists and returns a supported language from search params", () => {
    const repository = createSettingsRepository()

    const result = getAppLanguageFromSearchWithRepository(
      "?view=piano&lang=en",
      repository,
    )

    expect(result).toBe("en")
    expect(repository.setString).toHaveBeenCalledWith(
      "mimidi-language",
      "en",
    )
    expect(repository.getString).not.toHaveBeenCalled()
  })

  it("loads a supported stored language when search params do not include one", () => {
    const repository = createSettingsRepository({
      getString: vi.fn().mockReturnValue("en"),
    })

    const result = getAppLanguageFromSearchWithRepository("", repository)

    expect(result).toBe("en")
    expect(repository.getString).toHaveBeenCalledWith(
      "mimidi-language",
      "es",
    )
    expect(repository.setString).not.toHaveBeenCalled()
  })

  it("falls back to Spanish when search and stored language are unsupported", () => {
    const repository = createSettingsRepository({
      getString: vi.fn().mockReturnValue("fr"),
    })

    const result = getAppLanguageFromSearchWithRepository(
      "?lang=fr",
      repository,
    )

    expect(result).toBe("es")
  })
})
