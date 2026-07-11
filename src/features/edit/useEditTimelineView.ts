import { useEffect, useState } from "react"

export type EditTimelineView = "notes" | "tracks"

export function resolveInitialEditTimelineView(search: string): EditTimelineView {
  const view = new URLSearchParams(search).get("timelineView")
  return view === "tracks" ? "tracks" : "notes"
}

function resolveNavigatedEditTimelineView(search: string): EditTimelineView | null {
  const view = new URLSearchParams(search).get("timelineView")
  return view === "tracks" || view === "notes" ? view : null
}

export function useEditTimelineView({
  hasNoTracks,
  onLeaveTracksView,
}: {
  hasNoTracks: boolean
  onLeaveTracksView: () => void
}) {
  const [timelineView, setTimelineView] = useState<EditTimelineView>(() =>
    typeof window === "undefined"
      ? "notes"
      : resolveInitialEditTimelineView(window.location.search),
  )

  useEffect(() => {
    if (hasNoTracks && timelineView === "notes") {
      setTimelineView("tracks")
    }
  }, [hasNoTracks, timelineView])

  useEffect(() => {
    function syncTimelineView() {
      const nextView = resolveNavigatedEditTimelineView(window.location.search)
      if (nextView) setTimelineView(nextView)
    }

    window.addEventListener("popstate", syncTimelineView)
    return () => window.removeEventListener("popstate", syncTimelineView)
  }, [])

  useEffect(() => {
    if (timelineView !== "tracks") {
      onLeaveTracksView()
    }
  }, [onLeaveTracksView, timelineView])

  return { timelineView, setTimelineView }
}
