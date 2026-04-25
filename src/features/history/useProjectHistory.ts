import { useCallback, useRef, useState } from "react"

type HistoryUpdater<T> = (current: T) => T
type HistoryMode = "record" | "silent"

type UseProjectHistoryOptions<T> = {
  isEqual?: (firstState: T, secondState: T) => boolean
  limit?: number
}

type ReplaceStateOptions = {
  clearHistory?: boolean
}

export function useProjectHistory<T>(
  initialState: T,
  options: UseProjectHistoryOptions<T> = {},
) {
  const { limit = 20, isEqual = Object.is } = options
  const [state, setState] = useState(initialState)
  const [undoStack, setUndoStack] = useState<T[]>([])
  const [redoStack, setRedoStack] = useState<T[]>([])
  const transientBaseRef = useRef<T | null>(null)

  const applyUpdate = useCallback(
    (updater: HistoryUpdater<T>, mode: HistoryMode = "record") => {
      setState((currentState) => {
        const nextState = updater(currentState)

        if (isEqual(nextState, currentState)) {
          return currentState
        }

        if (mode === "record") {
          setUndoStack((currentUndoStack) =>
            [...currentUndoStack, currentState].slice(-limit),
          )
          setRedoStack([])
        }

        return nextState
      })
    },
    [isEqual, limit],
  )

  const applyTransientUpdate = useCallback(
    (updater: HistoryUpdater<T>) => {
      setState((currentState) => {
        transientBaseRef.current ??= currentState
        const nextState = updater(currentState)

        return isEqual(nextState, currentState) ? currentState : nextState
      })
    },
    [isEqual],
  )

  const commitTransientUpdate = useCallback(
    (updater: HistoryUpdater<T>) => {
      setState((currentState) => {
        const nextState = updater(currentState)
        const transientBase = transientBaseRef.current
        transientBaseRef.current = null

        if (!transientBase) {
          if (isEqual(nextState, currentState)) {
            return currentState
          }

          setUndoStack((currentUndoStack) =>
            [...currentUndoStack, currentState].slice(-limit),
          )
          setRedoStack([])
          return nextState
        }

        if (isEqual(nextState, transientBase)) {
          return nextState
        }

        setUndoStack((currentUndoStack) =>
          [...currentUndoStack, transientBase].slice(-limit),
        )
        setRedoStack([])
        return nextState
      })
    },
    [isEqual, limit],
  )

  const undo = useCallback(() => {
    let targetIndex = undoStack.length - 1

    while (targetIndex >= 0 && isEqual(undoStack[targetIndex], state)) {
      targetIndex -= 1
    }

    const previousState = targetIndex >= 0 ? undoStack[targetIndex] : null

    if (!previousState) {
      return null
    }

    setUndoStack((currentUndoStack) => currentUndoStack.slice(0, targetIndex))
    setRedoStack((currentRedoStack) => [...currentRedoStack, state].slice(-limit))
    transientBaseRef.current = null
    setState(previousState)

    return previousState
  }, [isEqual, limit, state, undoStack])

  const redo = useCallback(() => {
    let targetIndex = redoStack.length - 1

    while (targetIndex >= 0 && isEqual(redoStack[targetIndex], state)) {
      targetIndex -= 1
    }

    const nextState = targetIndex >= 0 ? redoStack[targetIndex] : null

    if (!nextState) {
      return null
    }

    setRedoStack((currentRedoStack) => currentRedoStack.slice(0, targetIndex))
    setUndoStack((currentUndoStack) => [...currentUndoStack, state].slice(-limit))
    transientBaseRef.current = null
    setState(nextState)

    return nextState
  }, [isEqual, limit, redoStack, state])

  const clearHistory = useCallback(() => {
    transientBaseRef.current = null
    setUndoStack([])
    setRedoStack([])
  }, [])

  const replaceState = useCallback((nextState: T, options?: ReplaceStateOptions) => {
    transientBaseRef.current = null
    setState(nextState)

    if (options?.clearHistory ?? true) {
      setUndoStack([])
      setRedoStack([])
    }
  }, [])

  return {
    state,
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    applyUpdate,
    applyTransientUpdate,
    commitTransientUpdate,
    undo,
    redo,
    clearHistory,
    replaceState,
  }
}
