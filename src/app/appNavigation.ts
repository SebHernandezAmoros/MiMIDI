export type AppViewId =
  | "perform"
  | "edit"
  | "project"
  | "plugins"
  | "settings"
  | "sampler"

export type AppViewDefinition = {
  description: string
  id: AppViewId
  label: string
}

export const appViewDefinitions: AppViewDefinition[] = [
  {
    id: "perform",
    label: "Perform",
    description: "Interpretacion, piano, arpegiador, SMC Pad y grabacion.",
  },
  {
    id: "edit",
    label: "Edit",
    description: "Timeline de tracks, timeline de notas y edicion fina.",
  },
  {
    id: "project",
    label: "Project",
    description: "Pistas, mezcla, exportacion y estado global del proyecto.",
  },
  {
    id: "plugins",
    label: "Plugins",
    description: "Manager de plugins y futuras superficies extensibles.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Preferencias y parametros globales del entorno.",
  },
  {
    id: "sampler",
    label: "Sampler",
    description: "Modulo separado para sampleo y gestion de audio grabado.",
  },
]

export const defaultAppView: AppViewId = "edit"
