export type PlaybackTimerCallback = () => void

export type PlaybackTimerPort = {
  setTimeout(callback: PlaybackTimerCallback, delayMs: number): number
  clearTimeout(timerId: number): void
}
