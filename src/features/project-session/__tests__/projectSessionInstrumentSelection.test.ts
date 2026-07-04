import { describe, expect, it } from "vitest"
import { resolveInstrumentIdByCategory } from "../projectSessionInstrumentSelection"

describe("projectSessionInstrumentSelection", () => {
  it("resolves the first instrument id for a category or null when unavailable", () => {
    const instruments = [
      { id: "pure-sine", category: "base" },
      { id: "fm-bell", category: "advanced" },
      { id: "warm-pad", category: "advanced" },
    ] as const

    expect(resolveInstrumentIdByCategory("advanced", instruments)).toBe(
      "fm-bell",
    )
    expect(resolveInstrumentIdByCategory("missing", instruments)).toBeNull()
  })
})
