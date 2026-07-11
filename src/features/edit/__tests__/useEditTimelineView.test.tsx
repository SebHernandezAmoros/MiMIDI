import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  resolveInitialEditTimelineView,
  useEditTimelineView,
} from "../useEditTimelineView"

function TimelineViewProbe({
  hasNoTracks = false,
  onLeaveTracksView = vi.fn(),
}: {
  hasNoTracks?: boolean
  onLeaveTracksView?: () => void
}) {
  const { timelineView, setTimelineView } = useEditTimelineView({
    hasNoTracks,
    onLeaveTracksView,
  })

  return (
    <>
      <span data-testid="timeline-view">{timelineView}</span>
      <button type="button" onClick={() => setTimelineView("notes")}>
        notes
      </button>
      <button type="button" onClick={() => setTimelineView("tracks")}>
        tracks
      </button>
    </>
  )
}

describe("useEditTimelineView", () => {
  afterEach(() => {
    cleanup()
    window.history.pushState({}, "", "/")
  })

  it("resolves the initial timeline view from the URL search params", () => {
    expect(resolveInitialEditTimelineView("?timelineView=tracks")).toBe(
      "tracks",
    )
    expect(resolveInitialEditTimelineView("?timelineView=notes")).toBe("notes")
    expect(resolveInitialEditTimelineView("?timelineView=other")).toBe("notes")
  })

  it("initializes tracks view from the current URL", () => {
    window.history.pushState({}, "", "/?timelineView=tracks")

    render(<TimelineViewProbe />)

    expect(screen.getByTestId("timeline-view").textContent).toBe("tracks")
  })

  it("forces tracks view when the project has no tracks", () => {
    render(<TimelineViewProbe hasNoTracks />)

    expect(screen.getByTestId("timeline-view").textContent).toBe("tracks")
  })

  it("syncs the view when browser navigation changes the URL", () => {
    render(<TimelineViewProbe />)
    expect(screen.getByTestId("timeline-view").textContent).toBe("notes")

    window.history.pushState({}, "", "/?timelineView=tracks")
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"))
    })

    expect(screen.getByTestId("timeline-view").textContent).toBe("tracks")
  })

  it("clears track-lane state when leaving tracks view", () => {
    const onLeaveTracksView = vi.fn()
    window.history.pushState({}, "", "/?timelineView=tracks")

    render(<TimelineViewProbe onLeaveTracksView={onLeaveTracksView} />)
    expect(onLeaveTracksView).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "notes" }))

    expect(onLeaveTracksView).toHaveBeenCalledTimes(1)
  })
})
