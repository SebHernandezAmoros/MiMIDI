export const functionalSelectors = {
  appWindow: ".app-mode-window",
  appContent: ".app-mode-window-content",
  performSettingsArpToggle: "[data-e2e=\"perform-settings-arp-toggle\"]",
  performSettingsChordMode: "[data-e2e=\"perform-settings-chord-mode\"]",
  performSettingsNoteMode: "[data-e2e=\"perform-settings-note-mode\"]",
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
