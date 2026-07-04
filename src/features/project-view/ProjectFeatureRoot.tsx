import type { ComponentProps, ReactNode } from "react"
import { ProjectFeatureActions } from "./ProjectFeatureActions"
import { ProjectFeatureNewProjectDialog } from "./ProjectFeatureNewProjectDialog"
import { ProjectFeatureSummary } from "./ProjectFeatureSummary"

type ProjectFeatureRootProps = {
  actions: ComponentProps<typeof ProjectFeatureActions>
  children?: ReactNode
  currentProjectLabel: string
  newProjectDialog: ComponentProps<typeof ProjectFeatureNewProjectDialog>
  summary: ComponentProps<typeof ProjectFeatureSummary>
}

export function ProjectFeatureRoot({
  actions,
  children,
  currentProjectLabel,
  newProjectDialog,
  summary,
}: ProjectFeatureRootProps) {
  return (
    <>
      <section className="app-mock-screen" aria-label={currentProjectLabel}>
        {children}
        <div className="project-compact-body">
          <ProjectFeatureSummary {...summary} />

          <div className="project-compact-divider" />

          <ProjectFeatureActions {...actions} />
        </div>
      </section>
      <ProjectFeatureNewProjectDialog {...newProjectDialog} />
    </>
  )
}
