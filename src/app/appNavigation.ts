export type AppViewId =
  | "perform"
  | "edit"
  | "project"
  | "plugins"
  | "settings"
  | "sampler"

export type AppViewDefinition = {
  id: AppViewId
}

export const appViewDefinitions: AppViewDefinition[] = [
  { id: "perform" },
  { id: "edit" },
  { id: "project" },
  { id: "plugins" },
  { id: "settings" },
  { id: "sampler" },
]

export const defaultAppView: AppViewId = "perform"
