import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditTrackNameInput } from "../EditTrackNameInput"

describe("EditTrackNameInput", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the current name and reports edits on blur", () => {
    const onNameCommit = vi.fn()

    render(
      <EditTrackNameInput
        label="Nombre de pista"
        name="Lead"
        onNameCommit={onNameCommit}
      />,
    )

    const input = screen.getByLabelText("Nombre de pista") as HTMLInputElement

    expect(input.value).toBe("Lead")

    fireEvent.change(input, { target: { value: "Lead edited" } })
    fireEvent.blur(input)

    expect(onNameCommit).toHaveBeenCalledWith("Lead edited")
  })

  it("commits through blur when Enter is pressed", () => {
    const onNameCommit = vi.fn()

    render(
      <EditTrackNameInput
        label="Nombre de pista"
        name="Bass"
        onNameCommit={onNameCommit}
      />,
    )

    const input = screen.getByLabelText("Nombre de pista") as HTMLInputElement

    input.focus()
    fireEvent.change(input, { target: { value: "Bass edited" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onNameCommit).toHaveBeenCalledWith("Bass edited")
  })
})
