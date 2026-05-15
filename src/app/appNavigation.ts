export type AppViewId =
  | "piano"
  | "pad"
  | "sampler"
  | "edit"
  | "project"
  | "plugins"
  | "settings"

export type AppViewDefinition = {
  id: AppViewId
}

export const appViewDefinitions: AppViewDefinition[] = [
  { id: "piano" },
  { id: "pad" },
  { id: "sampler" },
  { id: "edit" },
  { id: "project" },
  { id: "plugins" },
  { id: "settings" },
]

export const defaultAppView: AppViewId = "piano"
