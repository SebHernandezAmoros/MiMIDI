import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  PluginsCatalogDevelopmentTools,
  PluginsCatalogImportToolbar,
} from "../PluginsCatalogToolbar"

afterEach(cleanup)

describe("PluginsCatalogToolbar", () => {
  it("delegates .mimod selection and keeps the SDK download", () => {
    const onMimodFile = vi.fn()
    const { container } = render(
      <PluginsCatalogImportToolbar onMimodFile={onMimodFile} />,
    )
    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    )
    const file = new File(["plugin"], "demo.mimod")

    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [file] } })

    expect(onMimodFile).toHaveBeenCalledWith(file)
    expect(input?.value).toBe("")
    expect(
      screen.getByRole("link", { name: "SDK .d.ts" }).getAttribute("download"),
    ).toBe("mimidi-plugin-sdk.d.ts")
  })

  it("delegates folder import and reflects browser support", () => {
    const onPluginFolder = vi.fn()
    const { rerender } = render(
      <PluginsCatalogDevelopmentTools
        onPluginFolder={onPluginFolder}
        supportsDirectoryPicker
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "PLUGIN FOLDER" }))
    expect(onPluginFolder).toHaveBeenCalledOnce()

    rerender(
      <PluginsCatalogDevelopmentTools
        onPluginFolder={onPluginFolder}
        supportsDirectoryPicker={false}
      />,
    )

    expect(
      (screen.getByRole("button", {
        name: "PLUGIN FOLDER",
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
