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
  { id: "sampler" },
  { id: "edit" },
  { id: "plugins" },
  { id: "settings" },
]

export const defaultAppView: AppViewId = "perform"
