import type { LabAppMode } from "../features/lab/useLabProject"
import { useLabPlayback } from "../features/lab/useLabPlayback"
import { useLabProject } from "../features/lab/useLabProject"

type ProjectPlaybackCompositionOptions = {
  mode: LabAppMode
  timelineSnapEnabled: boolean
  timelineSnapStep: number
}

export function useProjectPlaybackComposition(
  options: ProjectPlaybackCompositionOptions,
) {
  const projectSession = useLabProject(options)
  const playback = useLabPlayback({ project: projectSession.project })

  return { playback, projectSession }
}
