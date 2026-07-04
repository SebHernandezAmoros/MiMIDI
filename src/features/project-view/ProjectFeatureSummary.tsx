import { useProjectSession } from "../project-session/useProjectSession"

type ProjectFeatureSummaryProps = {
  notesLabel: string
  projectLabel: string
  projectNamePlaceholder: string
  tracksLabel: string
}

export function ProjectFeatureSummary({
  notesLabel,
  projectLabel,
  projectNamePlaceholder,
  tracksLabel,
}: ProjectFeatureSummaryProps) {
  const { projectFeature } = useProjectSession()
  const { metadata } = projectFeature.commands
  const { noteCount, samplerMixCount, trackCount } = projectFeature.readModel

  return (
    <div className="project-compact-name-row">
      <label className="project-compact-label" htmlFor="project-view-name">
        {projectLabel}
      </label>
      <input
        className="project-compact-name-input"
        data-tutorial="project-name-input"
        id="project-view-name"
        onChange={(event) => metadata.changeProjectName(event.target.value)}
        placeholder={projectNamePlaceholder}
        type="text"
        value={projectFeature.projectName}
      />
      <p className="project-compact-stats">
        {trackCount} {tracksLabel}
        {" · "}
        {samplerMixCount} mix{samplerMixCount !== 1 ? "es" : ""}
        {" · "}
        {noteCount} {notesLabel}
      </p>
    </div>
  )
}
