import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { PerformWebWorkspace } from "../PerformWebWorkspace"

afterEach(() => {
  cleanup()
})

describe("PerformWebWorkspace", () => {
  it("renders injected perform content inside the web workspace shell", () => {
    render(
      <PerformWebWorkspace
        performContent={<div>Contenido Perform Web legacy</div>}
      />,
    )

    const workspace = screen.getByLabelText("Workspace Perform Web")

    expect(workspace.className).toContain("perform-workspace-web")
    expect(screen.getByText("Contenido Perform Web legacy")).toBeTruthy()
  })
})
