import type { EditTimelineView } from "./useEditTimelineView"

type EditTimelineViewToggleProps = {
  disabledNotes?: boolean
  disabledNotesTitle?: string
  notesLabel: string
  onTimelineViewChange: (view: EditTimelineView) => void
  timelineView: EditTimelineView
  tracksLabel: string
}

export function EditTimelineViewToggle({
  disabledNotes = false,
  disabledNotesTitle,
  notesLabel,
  onTimelineViewChange,
  timelineView,
  tracksLabel,
}: EditTimelineViewToggleProps) {
  return (
    <div className="ui-toggle-group" role="group" aria-label={`${notesLabel}/${tracksLabel}`}>
      <button
        aria-pressed={timelineView === "notes"}
        disabled={disabledNotes}
        onClick={() => onTimelineViewChange("notes")}
        title={disabledNotes ? disabledNotesTitle : undefined}
        type="button"
      >
        {notesLabel}
      </button>
      <button
        aria-pressed={timelineView === "tracks"}
        data-tutorial="view-tracks-tab"
        onClick={() => onTimelineViewChange("tracks")}
        type="button"
      >
        {tracksLabel}
      </button>
    </div>
  )
}
