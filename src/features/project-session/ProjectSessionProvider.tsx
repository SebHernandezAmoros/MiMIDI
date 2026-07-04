import { createContext, type ReactNode } from "react"
import type { ProjectFeatureContract } from "../project-view/projectFeatureContract"

export type ProjectSessionValue = {
  projectFeature: ProjectFeatureContract
}

export const ProjectSessionContext = createContext<ProjectSessionValue | null>(
  null,
)

type ProjectSessionProviderProps = {
  children: ReactNode
  projectFeature: ProjectFeatureContract
}

export function ProjectSessionProvider({
  children,
  projectFeature,
}: ProjectSessionProviderProps) {
  return (
    <ProjectSessionContext.Provider value={{ projectFeature }}>
      {children}
    </ProjectSessionContext.Provider>
  )
}
