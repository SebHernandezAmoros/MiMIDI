export type BasicTutorialStep = {
  view: string
  target: string | null
  triggerBefore?: string  // data-tutorial de elemento a clicar antes de hacer spotlight (ej. abrir un diálogo)
}

export const BASIC_TUTORIAL_STEPS: BasicTutorialStep[] = [
  { view: "/?view=piano",                  target: null },                            //  1 — bienvenida
  { view: "/?view=piano",                  target: "instrument-button" },             //  2 — elegir instrumento
  { view: "/?view=piano",                  target: "record-button" },                 //  3 — grabar piano (teclas)
  { view: "/?view=piano",                  target: "piano-keys" },                    //  4 — teclado del piano
  { view: "/?view=piano",                  target: "play-button" },                   //  5 — escuchar piano
  { view: "/?view=piano",                  target: "add-track-button" },              //  6 — nueva pista de piano
  { view: "/?view=piano",                  target: "piano-view-mode-toggle" },        //  7 — toggle Keys / Steps
  { view: "/?view=piano",                  target: "steps-grid", triggerBefore: "piano-view-mode-steps-btn" }, //  8 — cuadrícula del step sequencer (nuevo)
  { view: "/?view=piano",                  target: "record-button", triggerBefore: "piano-view-mode-steps-btn" }, //  9 — botón Layers / enviar al timeline (nuevo)
  { view: "/?view=pad",                    target: "pad-record-button" },             // 10 — grabar pads en vivo
  { view: "/?view=pad",                    target: "pad-grid" },                      //  9 — cuadrícula de pads
  { view: "/?view=pad",                    target: "pad-play-button" },               // 10 — escuchar pads
  { view: "/?view=pad",                    target: "pad-view-mode-toggle" },          // 13 — toggle Pads / Beats
  { view: "/?view=pad",                    target: "beats-grid", triggerBefore: "pad-view-mode-beats-btn" }, // 14 — cuadrícula del beats sequencer (nuevo)
  { view: "/?view=pad",                    target: "add-pad-track-button" },          // 15 — nueva pista de pads
  { view: "/?view=sampler&tab=muestras",   target: "sampler-muestras-tab" },         // 13 — pestaña muestras
  { view: "/?view=sampler&tab=muestras",   target: "record-mic-button" },            // 14 — grabar muestra
  { view: "/?view=sampler&tab=editor",     target: "sampler-editor-tab" },           // 15 — pestaña editor
  { view: "/?view=sampler&tab=secuenciador", target: "sampler-seq-tab" },            // 16 — pestaña secuenciador
  { view: "/?view=sampler&tab=secuenciador", target: "send-to-timeline-button" },    // 17 — crear mix
  { view: "/?view=edit&timelineView=notes",  target: "note-timeline" },              // 18 — editar notas
  { view: "/?view=edit&timelineView=notes",  target: "view-tracks-tab" },            // 19 — botón para ir a tracks
  { view: "/?view=edit&timelineView=tracks", target: "track-timeline" },             // 20 — vista tracks
  { view: "/?view=project",                target: "project-name-input" },           // 21 — nombre del proyecto
  { view: "/?view=project",                target: "export-wav-button" },            // 22 — exportar
  { view: "/?view=settings",               target: "repeat-tutorial-button" },       // 23 — cierre
]

export const BASIC_TOTAL_STEPS = BASIC_TUTORIAL_STEPS.length
