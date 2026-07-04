import { useContext } from "react"
import { ProjectSessionContext } from "./ProjectSessionProvider"

export function useProjectSession() {
  const session = useContext(ProjectSessionContext)
  if (!session) {
    throw new Error(
      "useProjectSession must be used within ProjectSessionProvider",
    )
  }
  return session
}
