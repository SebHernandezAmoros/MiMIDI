export type BasicTutorialStep = {
  view: string
  target: string | null
  triggerBefore?: string  // data-tutorial de elemento a clicar antes de hacer spotlight (ej. abrir un diálogo)
}

export const BASIC_TUTORIAL_STEPS: BasicTutorialStep[] = [
  { view: "/?view=piano",                  target: null },                       //  1 — bienvenida
  { view: "/?view=piano",                  target: "instrument-button" },        //  2 — elegir instrumento
  { view: "/?view=piano",                  target: "record-button" },            //  3 — grabar piano
  { view: "/?view=piano",                  target: "piano-keys" },               //  4 — teclado del piano
  { view: "/?view=piano",                  target: "play-button" },              //  5 — escuchar piano
  { view: "/?view=piano",                  target: "add-track-button" },         //  6 — nueva pista de piano
  { view: "/?view=pad",                    target: "pad-record-button" },        //  7 — grabar pads
  { view: "/?view=pad",                    target: "pad-grid" },                 //  8 — cuadrícula de pads
  { view: "/?view=pad",                    target: "pad-play-button" },          //  9 — escuchar pads
  { view: "/?view=pad",                    target: "add-pad-track-button" },     // 10 — nueva pista de pads
  { view: "/?view=sampler&tab=muestras",   target: "sampler-muestras-tab" },    // 11 — pestaña muestras
  { view: "/?view=sampler&tab=muestras",   target: "record-mic-button" },       // 12 — grabar muestra
  { view: "/?view=sampler&tab=editor",     target: "sampler-editor-tab" },      // 13 — pestaña editor
  { view: "/?view=sampler&tab=secuenciador", target: "sampler-seq-tab" },       // 14 — pestaña secuenciador
  { view: "/?view=sampler&tab=secuenciador", target: "send-to-timeline-button" }, // 15 — crear mix
  { view: "/?view=edit&timelineView=notes",  target: "note-timeline" },           // 16 — editar notas
  { view: "/?view=edit&timelineView=notes",  target: "view-tracks-tab" },        // 17 — botón para ir a tracks
  { view: "/?view=edit&timelineView=tracks", target: "track-timeline" },         // 18 — vista tracks
  { view: "/?view=project",                target: "project-name-input" },       // 18 — nombre del proyecto
  { view: "/?view=project",                target: "export-wav-button" },        // 19 — exportar
  { view: "/?view=settings",               target: "repeat-tutorial-button" },   // 20 — cierre
]

export const BASIC_TOTAL_STEPS = BASIC_TUTORIAL_STEPS.length
