export const esMessages = {
  appMode: {
    title: "MiMIDI",
    subtitle:
      "Shell horizontal inicial para el futuro modo app. Aqui ya nacen las vistas principales aunque su contenido siga en migracion.",
    openLab: "Ir al laboratorio",
    languageLabel: "Idioma",
    activeViewSummaryAriaLabel: "Resumen de la vista activa",
    navigationAriaLabel: "Navegacion principal del modo app",
  },
  views: {
    perform: {
      label: "Perform",
      description: "Interpretacion, piano, arpegiador, SMC Pad y grabacion.",
      intro:
        "Vista pensada para interpretar, probar timbres y grabar tomas sin la densidad de la pantalla de edicion.",
      workspaceTitle: "Perform workspace",
      workspaceBody:
        "Aqui iran piano, arpegiador, toma de grabacion, control rapido de instrumento y la futura vista dedicada de SMC Pad.",
    },
    edit: {
      label: "Edit",
      description: "Timeline de tracks, timeline de notas y edicion fina.",
      intro:
        "Primera pantalla recomendada para la migracion desde el laboratorio. Su frontera natural es la edicion temporal del proyecto.",
      workspaceTitle: "Edit workspace",
      workspaceBody:
        "Aqui iran el timeline de tracks, el timeline de notas, el editor de nota seleccionada y las herramientas de edicion fina.",
    },
    project: {
      label: "Project",
      description: "Pistas, mezcla, exportacion y estado global del proyecto.",
      intro:
        "Vista para gestionar el proyecto como unidad: pistas, mezcla, exportacion y estado general.",
      workspaceTitle: "Project workspace",
      workspaceBody:
        "Aqui iran nombre del proyecto, mezcla por pista, exportacion JSON/WAV y acciones estructurales del proyecto.",
    },
    plugins: {
      label: "Plugins",
      description: "Manager de plugins y futuras superficies extensibles.",
      intro:
        "Vista futura para gestionar plugins con una interfaz mas limpia y menos apelotonada que la monovista actual.",
      workspaceTitle: "Plugins workspace",
      workspaceBody:
        "Aqui ira el manager completo de plugins y, mas adelante, las superficies adicionales que un plugin pueda registrar.",
    },
    settings: {
      label: "Settings",
      description: "Preferencias y parametros globales del entorno.",
      intro:
        "Vista reservada para preferencias globales, parametros generales y futuros ajustes del entorno.",
      workspaceTitle: "Settings workspace",
      workspaceBody:
        "Esta pantalla queda lista como placeholder para cuando la app deje de depender del laboratorio como unico punto de configuracion.",
    },
    sampler: {
      label: "Sampler",
      description: "Modulo separado para sampleo y gestion de audio grabado.",
      intro:
        "Vista separada del core matematico para captura, gestion y disparo de samples cuando el modulo se retome.",
      workspaceTitle: "Sampler workspace",
      workspaceBody:
        "Queda nacido como contenedor propio para no mezclar su desarrollo con el flujo del laboratorio matematico.",
    },
  },
} as const
