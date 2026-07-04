import { createRef } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../domain/project/midiNoteMutations"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import { createDefaultProject } from "../../engine/project/projectModel"
import { ProjectViewComposition } from "../ProjectViewComposition"

const {
  exportProjectAudio,
  playAll,
  stopAll,
  useLabPlayback,
  useLabProject,
} = vi.hoisted(() => ({
  exportProjectAudio: vi.fn(),
  playAll: vi.fn(),
  stopAll: vi.fn(),
  useLabPlayback: vi.fn(),
  useLabProject: vi.fn(),
}))

vi.mock("../../features/lab/useLabProject", () => ({
  useLabProject,
}))

vi.mock("../../features/lab/useLabPlayback", () => ({
  useLabPlayback,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("ProjectViewComposition", () => {
  it("uses only the project facade, playback and supplied master volume", () => {
    const defaultProject = createDefaultProject()
    const track = getMidiTracks(defaultProject.timeline)[0]
    const project = appendNoteToTrack(defaultProject, track.id, {
      duration: 0.5,
      id: "note-1",
      instrumentId: "pure-sine",
      note: "C4",
      startTime: 0,
      velocity: 0.8,
    })
    useLabProject.mockReturnValue({
      exportBundle: vi.fn(),
      exportProjectAudio,
      importBundle: vi.fn(),
      importBundleRef: createRef<HTMLInputElement>(),
      importInputRef: createRef<HTMLInputElement>(),
      importProjectFile: vi.fn(),
      isExportingAudio: false,
      isNewProjectConfirmOpen: false,
      project,
      restartProject: vi.fn(),
      setIsNewProjectConfirmOpen: vi.fn(),
      updateProjectName: vi.fn(),
    })
    useLabPlayback.mockReturnValue({
      isMixOnlyPlaying: false,
      playAll,
      playbackTransport: { isPlaying: false },
      stopAll,
    })

    render(
      <ProjectViewComposition language="en" masterVolume={0.35} />,
    )

    expect(useLabProject).toHaveBeenCalledWith({
      mode: "project-only",
      timelineSnapEnabled: false,
      timelineSnapStep: 0.1,
    })
    expect(useLabPlayback).toHaveBeenCalledWith({ project })

    fireEvent.click(screen.getByRole("button", { name: "Export WAV" }))
    expect(exportProjectAudio).toHaveBeenCalledWith(0.35)
  })
})
