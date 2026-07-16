import { describe, expect, it, vi } from "vitest"
import { appendNoteToTrack } from "../../../domain/project/midiNoteMutations"
import { getMidiTracks } from "../../../domain/project/timelineQueries"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { playRecordedNotes } from "../playRecordedNotes"

describe("play recorded notes use-case", () => {
  it("schedules note playback and completion through an injected timer port", () => {
    const project = createDefaultProject()
    const [track] = getMidiTracks(project.timeline)
    const projectWithNote = appendNoteToTrack(project, track.id, {
      duration: 0.5,
      id: "note-c4",
      instrumentId: "pure-sine",
      note: "C4",
      playbackSource: "note",
      startTime: 0.25,
      velocity: 1,
    })
    let nextTimerId = 1
    const timerPort = {
      setTimeout: vi.fn((_callback: () => void, _delayMs: number) => nextTimerId++),
      clearTimeout: vi.fn(),
    }

    const handle = playRecordedNotes(projectWithNote, {
      fromZero: true,
      timerPort,
    })

    expect(timerPort.setTimeout).toHaveBeenCalledTimes(2)
    expect(timerPort.setTimeout.mock.calls.map(([, delayMs]) => delayMs)).toEqual([
      250,
      750,
    ])

    handle.cancel()

    expect(timerPort.clearTimeout).toHaveBeenCalledWith(1)
    expect(timerPort.clearTimeout).toHaveBeenCalledWith(2)
  })
})
