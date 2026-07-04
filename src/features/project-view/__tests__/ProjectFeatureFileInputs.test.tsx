import { createRef } from "react"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ProjectFeatureFileInputs } from "../ProjectFeatureFileInputs"

afterEach(cleanup)

describe("ProjectFeatureFileInputs", () => {
  it("preserves accepted formats, refs and change handlers", () => {
    const jsonInputRef = createRef<HTMLInputElement>()
    const bundleInputRef = createRef<HTMLInputElement>()
    const onJsonChange = vi.fn()
    const onBundleChange = vi.fn()
    const { container } = render(
      <ProjectFeatureFileInputs
        bundleInputRef={bundleInputRef}
        jsonInputRef={jsonInputRef}
        onBundleChange={onBundleChange}
        onJsonChange={onJsonChange}
      />,
    )

    const jsonInput = container.querySelector<HTMLInputElement>(
      'input[accept=".json,application/json"]',
    )
    const bundleInput = container.querySelector<HTMLInputElement>(
      'input[accept=".mimidi"]',
    )

    expect(jsonInput).not.toBeNull()
    expect(bundleInput).not.toBeNull()
    expect(jsonInput?.hidden).toBe(true)
    expect(bundleInput?.hidden).toBe(true)
    expect(jsonInputRef.current).toBe(jsonInput)
    expect(bundleInputRef.current).toBe(bundleInput)

    fireEvent.change(jsonInput as HTMLInputElement, {
      target: { files: [new File(["{}"], "project.json")] },
    })
    fireEvent.change(bundleInput as HTMLInputElement, {
      target: { files: [new File(["bundle"], "project.mimidi")] },
    })

    expect(onJsonChange).toHaveBeenCalledOnce()
    expect(onBundleChange).toHaveBeenCalledOnce()
  })
})
