import type { ReactNode } from "react"
import type { EditTimelineView } from "./useEditTimelineView"
import { EditActiveTrackSelect } from "./EditActiveTrackSelect"
import { EditTimelineViewToggle } from "./EditTimelineViewToggle"

type EditTimelineToolbarTrack = {
  id: string
  name: string
}

type EditTimelineToolbarProps = {
  activeTrackId: string
  activeTrackSelectLabel: string
  addMidiTrackDisabledTitle: string
  hasNoTracks: boolean
  isNoteEditMode: boolean
  noteEditControls?: ReactNode
  notesLabel: string
  onTimelineViewChange: (view: EditTimelineView) => void
  onTrackChange: (trackId: string) => void
  timelineView: EditTimelineView
  trackNameControl?: ReactNode
  tracks: EditTimelineToolbarTrack[]
  tracksLabel: string
}

export function EditTimelineToolbar({
  activeTrackId,
  activeTrackSelectLabel,
  addMidiTrackDisabledTitle,
  hasNoTracks,
  isNoteEditMode,
  noteEditControls,
  notesLabel,
  onTimelineViewChange,
  onTrackChange,
  timelineView,
  trackNameControl,
  tracks,
  tracksLabel,
}: EditTimelineToolbarProps) {
  return (
    <>
      {!isNoteEditMode && (
        <>
          <EditTimelineViewToggle
            disabledNotes={hasNoTracks}
            disabledNotesTitle={addMidiTrackDisabledTitle}
            notesLabel={notesLabel}
            onTimelineViewChange={onTimelineViewChange}
            timelineView={timelineView}
            tracksLabel={tracksLabel}
          />
          <span aria-hidden="true" className="perform-mode-transport-divider" />
        </>
      )}
      {timelineView === "notes" && !isNoteEditMode && (
        <EditActiveTrackSelect
          activeTrackId={activeTrackId}
          label={activeTrackSelectLabel}
          onTrackChange={onTrackChange}
          tracks={tracks}
        />
      )}
      {timelineView === "tracks" && trackNameControl}
      {noteEditControls}
    </>
  )
}
