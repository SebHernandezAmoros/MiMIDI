import type { PlaybackTimerPort } from "../../application/ports/PlaybackTimerPort"

export function createBrowserPlaybackTimerPort(): PlaybackTimerPort {
  return {
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (timerId) => window.clearTimeout(timerId),
  }
}
