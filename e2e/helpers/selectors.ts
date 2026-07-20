export const functionalSelectors = {
  appWindow: ".app-mode-window",
  appContent: ".app-mode-window-content",
  performSettingsArpToggle: "[data-e2e=\"perform-settings-arp-toggle\"]",
  performSettingsChordMode: "[data-e2e=\"perform-settings-chord-mode\"]",
  performSettingsNoteMode: "[data-e2e=\"perform-settings-note-mode\"]",
  padBeatsCell: "[data-e2e=\"pad-beats-cell\"]",
  padModePads: "[data-e2e=\"pad-mode-pads\"]",
  padModeBeats: "[data-e2e=\"pad-mode-beats\"]",
  padRecordButton: "[data-tutorial=\"pad-record-button\"]",
  padSmcKick: "[data-e2e=\"pad-smc-kick\"]",
  padStepCount12: "[data-e2e=\"pad-beats-step-count-12\"]",
  padTrackSelect: "[data-e2e=\"pad-track-select\"]",
  editTrackBeatsLane: "[data-e2e=\"edit-track-beats-lane\"]",
  editTrackPadsLane: "[data-e2e=\"edit-track-pads-lane\"]",
  editTrackPercussionBeatsLane: "[data-e2e=\"edit-track-percussion-beats-lane\"]",
  editTrackPercussionPadsLane: "[data-e2e=\"edit-track-percussion-pads-lane\"]",
  viewOptionsButton: "[data-tutorial=\"view-options-btn\"]",
}

export const functionalViews = [
  { id: "piano", label: "Piano" },
  { id: "pad", label: "Pad" },
  { id: "sampler", label: "Sampler" },
  { id: "edit", label: "Edit" },
  { id: "project", label: "Project" },
  { id: "plugins", label: "Plugins" },
  { id: "settings", label: "Settings" },
] as const

export type FunctionalViewId = (typeof functionalViews)[number]["id"]

export function appViewUrl(baseUrl: string, viewId: FunctionalViewId) {
  return `${baseUrl}?view=${viewId}&lang=es`
}

export function activeNavSelector(label: string) {
  return `button[aria-label="${label}"].mode-switch-active`
}

export function pianoKeySelector(note: string) {
  return `[data-e2e="piano-key-${note}"]`
}
