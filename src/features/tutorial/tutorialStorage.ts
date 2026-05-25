const SEEN_KEY = "mimidi-tutorial-seen"

export function isTutorialSeen(): boolean {
  return localStorage.getItem(SEEN_KEY) === "true"
}

export function markTutorialSeen(): void {
  localStorage.setItem(SEEN_KEY, "true")
}
