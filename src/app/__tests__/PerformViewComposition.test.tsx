import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PerformViewComposition } from "../PerformViewComposition"

const { LabApp } = vi.hoisted(() => ({
  LabApp: vi.fn(
    ({
      language,
      mode,
      settingsOpen,
    }: {
      language?: string
      mode?: string
      settingsOpen?: boolean
    }) => <div>{`${language}:${mode}:${settingsOpen ? "open" : "closed"}`}</div>,
  ),
}))

vi.mock("../../features/lab/LabApp", () => ({
  default: LabApp,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("PerformViewComposition", () => {
  it("keeps the perform screen behind the legacy Lab facade while the root is extracted", () => {
    const onSettingsClose = vi.fn()

    render(
      <PerformViewComposition
        language="en"
        onSettingsClose={onSettingsClose}
        settingsOpen={true}
      />,
    )

    expect(LabApp).toHaveBeenCalledWith(
      {
        language: "en",
        mode: "perform-only",
        onSettingsClose,
        settingsOpen: true,
      },
      undefined,
    )
    expect(screen.getByText("en:perform-only:open")).toBeTruthy()
  })
})
