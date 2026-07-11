import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useProjectPlaybackComposition } from "../useProjectPlaybackComposition"

const { useLabPlayback, useLabProject } = vi.hoisted(() => ({
  useLabPlayback: vi.fn(),
  useLabProject: vi.fn(),
}))

vi.mock("../../features/lab/useLabProject", () => ({
  useLabProject,
}))

vi.mock("../../features/lab/useLabPlayback", () => ({
  useLabPlayback,
}))

describe("useProjectPlaybackComposition", () => {
  it("composes the project session with playback for the same project", () => {
    const project = { id: "project-1" }
    const projectSession = { project }
    const playback = { stopAll: vi.fn() }
    useLabProject.mockReturnValue(projectSession)
    useLabPlayback.mockReturnValue(playback)

    const { result } = renderHook(() =>
      useProjectPlaybackComposition({
        mode: "plugin-workspace",
        timelineSnapEnabled: false,
        timelineSnapStep: 0.1,
      }),
    )

    expect(useLabProject).toHaveBeenCalledWith({
      mode: "plugin-workspace",
      timelineSnapEnabled: false,
      timelineSnapStep: 0.1,
    })
    expect(useLabPlayback).toHaveBeenCalledWith({ project })
    expect(result.current).toEqual({ playback, projectSession })
  })
})
