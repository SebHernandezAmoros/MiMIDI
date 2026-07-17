export const functionalSelectors = {
  appWindow: ".app-mode-window",
  appContent: ".app-mode-window-content",
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
