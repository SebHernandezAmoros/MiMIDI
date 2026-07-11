type EditTrackNameInputProps = {
  label: string
  name: string
  onNameCommit: (name: string) => void
}

export function EditTrackNameInput({
  label,
  name,
  onNameCommit,
}: EditTrackNameInputProps) {
  return (
    <input
      aria-label={label}
      className="edit-note-input edit-track-name-input"
      defaultValue={name}
      onBlur={(event) => onNameCommit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      type="text"
    />
  )
}
