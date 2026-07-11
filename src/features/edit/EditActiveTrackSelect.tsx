type EditActiveTrackOption = {
  id: string
  name: string
}

type EditActiveTrackSelectProps = {
  activeTrackId: string
  label: string
  onTrackChange: (trackId: string) => void
  tracks: EditActiveTrackOption[]
}

export function EditActiveTrackSelect({
  activeTrackId,
  label,
  onTrackChange,
  tracks,
}: EditActiveTrackSelectProps) {
  return (
    <select
      aria-label={label}
      className="ui-select"
      value={activeTrackId}
      onChange={(event) => onTrackChange(event.target.value)}
    >
      {tracks.map((track) => (
        <option key={track.id} value={track.id}>
          {track.name}
        </option>
      ))}
    </select>
  )
}
