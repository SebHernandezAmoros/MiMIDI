import { Download, Folder, Play, Square, Upload } from "lucide-react"
import { useProjectSession } from "../project-session/useProjectSession"

type ProjectFeatureActionsProps = {
  exportBundleLabel: string
  exportingLabel: string
  exportWavLabel: string
  importBundleLabel: string
  newProjectLabel: string
  playLabel: string
  stopLabel: string
}

export function ProjectFeatureActions({
  exportBundleLabel,
  exportingLabel,
  exportWavLabel,
  importBundleLabel,
  newProjectLabel,
  playLabel,
  stopLabel,
}: ProjectFeatureActionsProps) {
  const { projectFeature } = useProjectSession()
  const { audio, bundle, newProject, playback } = projectFeature.commands
  const { hasPlayableContent } = projectFeature.readModel
  const { isExportingAudio, isMixOnlyPlaying, isPlaying } = projectFeature.status
  const isPlaybackActive = isPlaying || isMixOnlyPlaying

  return (
    <div className="project-compact-grid">
      <button
        className="project-export-btn project-export-btn-play project-compact-btn-wide"
        disabled={!hasPlayableContent && !isPlaybackActive}
        onClick={playback.togglePlayback}
        type="button"
      >
        {isPlaybackActive ? (
          <>
            <Square size={13} /> {stopLabel}
          </>
        ) : (
          <>
            <Play size={13} /> {playLabel}
          </>
        )}
      </button>
      <button
        className="project-export-btn project-export-btn-primary project-compact-btn-wide"
        data-tutorial="export-wav-button"
        disabled={!hasPlayableContent || isExportingAudio}
        onClick={audio.exportWav}
        type="button"
      >
        <Download size={13} />
        {isExportingAudio ? exportingLabel : exportWavLabel}
      </button>
      <button
        className="project-export-btn project-compact-btn-wide"
        onClick={bundle.exportBundle}
        type="button"
      >
        <Folder size={13} /> {exportBundleLabel}
      </button>
      <button
        className="project-export-btn project-compact-btn-wide"
        onClick={bundle.requestBundleImport}
        type="button"
      >
        <Upload size={13} /> {importBundleLabel}
      </button>
      <button
        className="project-export-btn project-export-btn-reset project-compact-btn-wide project-compact-btn-full"
        onClick={newProject.requestNewProject}
        type="button"
      >
        {newProjectLabel}
      </button>
    </div>
  )
}
