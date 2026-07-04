import { useState } from "react"

export function useProjectMessages(getInitialMessage: () => string) {
  const [projectMessage, setProjectMessage] = useState(getInitialMessage)

  return {
    projectMessage,
    setProjectMessage,
  }
}
