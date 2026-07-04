import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProjectWorkspace } from "../ProjectWorkspace"

afterEach(cleanup)

describe("ProjectWorkspace", () => {
  it("renders project content supplied by the app composition root", () => {
    render(
      <ProjectWorkspace
        body="Project body"
        projectContent={<div>Independent project content</div>}
        title="Project title"
      />,
    )

    expect(screen.getByLabelText("Workspace Project")).not.toBeNull()
    expect(screen.getByText("Independent project content")).not.toBeNull()
  })
})
