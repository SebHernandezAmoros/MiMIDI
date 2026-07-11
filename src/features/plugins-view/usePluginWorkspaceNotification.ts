import { useCallback, useEffect, useRef, useState } from "react"

const PLUGIN_WORKSPACE_NOTIFICATION_DURATION_MS = 3500

export function usePluginWorkspaceNotification() {
  const [notification, setNotification] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((message: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setNotification(message)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setNotification("")
    }, PLUGIN_WORKSPACE_NOTIFICATION_DURATION_MS)
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    },
    [],
  )

  return {
    notification,
    notify,
  }
}
