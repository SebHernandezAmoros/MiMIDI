import type { ComponentProps } from "react"
import { ProjectSessionProvider } from "../project-session/ProjectSessionProvider"
import type { ProjectFeatureContract } from "./projectFeatureContract"
import { ProjectFeatureFileInputs } from "./ProjectFeatureFileInputs"
import { ProjectFeatureRoot } from "./ProjectFeatureRoot"

type ProjectFeatureViewProps = Omit<
  ComponentProps<typeof ProjectFeatureRoot>,
  "children"
> & {
  fileInputs: ComponentProps<typeof ProjectFeatureFileInputs>
  projectFeature: ProjectFeatureContract
}

export function ProjectFeatureView({
  actions,
  currentProjectLabel,
  fileInputs,
  newProjectDialog,
  projectFeature,
  summary,
}: ProjectFeatureViewProps) {
  return (
    <ProjectSessionProvider projectFeature={projectFeature}>
      <ProjectFeatureRoot
        actions={actions}
        currentProjectLabel={currentProjectLabel}
        newProjectDialog={newProjectDialog}
        summary={summary}
      >
        <ProjectFeatureFileInputs {...fileInputs} />
      </ProjectFeatureRoot>
    </ProjectSessionProvider>
  )
}
