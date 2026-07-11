import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SamplerViewComposition } from "../SamplerViewComposition"

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

describe("SamplerViewComposition", () => {
  it("keeps the sampler screen behind the legacy Lab facade while the root is extracted", () => {
    const onSettingsClose = vi.fn()

    render(
      <SamplerViewComposition
        language="en"
        onSettingsClose={onSettingsClose}
        settingsOpen={true}
      />,
    )

    expect(LabApp).toHaveBeenCalledWith(
      {
        language: "en",
        mode: "sampler-only",
        onSettingsClose,
        settingsOpen: true,
      },
      undefined,
    )
    expect(screen.getByText("en:sampler-only:open")).toBeTruthy()
  })
})
