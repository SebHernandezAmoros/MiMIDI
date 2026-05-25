const SEEN_KEY = "mimidi-tutorial-seen"
const COMPLETE_SEEN_KEY = "mimidi-complete-tutorial-seen"

export function isTutorialSeen(): boolean {
  return localStorage.getItem(SEEN_KEY) === "true"
}

export function markTutorialSeen(): void {
  localStorage.setItem(SEEN_KEY, "true")
}

export function isCompleteTutorialSeen(): boolean {
  return localStorage.getItem(COMPLETE_SEEN_KEY) === "true"
}

export function markCompleteTutorialSeen(): void {
  localStorage.setItem(COMPLETE_SEEN_KEY, "true")
}
