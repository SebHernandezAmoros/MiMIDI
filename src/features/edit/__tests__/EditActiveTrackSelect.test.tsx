import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { EditActiveTrackSelect } from "../EditActiveTrackSelect"

describe("EditActiveTrackSelect", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders track options and reports the selected track id", () => {
    const onTrackChange = vi.fn()

    render(
      <EditActiveTrackSelect
        activeTrackId="track-1"
        label="Seleccionar pista"
        onTrackChange={onTrackChange}
        tracks={[
          { id: "track-1", name: "Lead" },
          { id: "track-2", name: "Bass" },
        ]}
      />,
    )

    const select = screen.getByLabelText("Seleccionar pista") as HTMLSelectElement

    expect(select.value).toBe("track-1")
    expect(screen.getByRole("option", { name: "Lead" }).getAttribute("value")).toBe(
      "track-1",
    )
    expect(screen.getByRole("option", { name: "Bass" }).getAttribute("value")).toBe(
      "track-2",
    )

    fireEvent.change(select, { target: { value: "track-2" } })

    expect(onTrackChange).toHaveBeenCalledWith("track-2")
  })
})
