import type { BasicTutorialStep } from "./tutorialSteps"

export const COMPLETE_TUTORIAL_STEPS: BasicTutorialStep[] = [
  { view: "/?view=piano",                    target: null },                                                                 //  1 — bienvenida
  { view: "/?view=piano",                    target: "track-selector" },                                                    //  2 — selector de pista (< TRACK 1 >)
  { view: "/?view=piano",                    target: "remove-track-button" },                                               //  3 — eliminar pista
  { view: "/?view=piano",                    target: "piano-view-mode-toggle" },                                            //  4 — toggle Keys / Steps en toolbar
  { view: "/?view=piano",                    target: "steps-grid", triggerBefore: "piano-view-mode-steps-btn" },            //  5 — cuadrícula del step sequencer
  { view: "/?view=piano",                    target: "add-track-button" },                                                  //  6 — botón Layers / → Track en steps mode
  { view: "/?view=piano",                    target: "octave-control" },                                                    //  7 — octava (volver a keys)
  { view: "/?view=piano",                    target: "view-options-btn", triggerBefore: "piano-view-mode-keys-btn" },   //  8 — ⋮ piano: señalar el botón (vuelve a Keys antes)
  { view: "/?view=piano",                    target: "piano-chord-section",   triggerBefore: "view-options-btn" },          //  9 — ⋮ piano: tipo de acorde
  { view: "/?view=piano",                    target: "piano-arp-mode-section", triggerBefore: "view-options-btn" },         // 10 — ⋮ piano: modo ARP
  { view: "/?view=piano",                    target: "piano-arp-params",       triggerBefore: "view-options-btn" },         // 11 — ⋮ piano: parámetros ARP
  { view: "/?view=pad",                      target: "pad-page-pager" },                                                    // 12 — paginador de pads (< 1/2 >)
  { view: "/?view=pad",                      target: "pad-view-mode-toggle" },                                              // 13 — toggle Pads / Beats en toolbar
  { view: "/?view=pad",                      target: "beats-grid", triggerBefore: "pad-view-mode-beats-btn" },              // 14 — cuadrícula del beats sequencer
  { view: "/?view=pad",                      target: "pad-settings-btn" },                                                  // 15 — ⚙ síntesis de pad individual
  { view: "/?view=pad",                      target: "view-options-btn" },                                                  // 16 — ⋮ pad: señalar el botón
  { view: "/?view=pad",                      target: "pad-options-content",    triggerBefore: "view-options-btn" },         // 17 — ⋮ pad: interior del diálogo
  { view: "/?view=sampler&tab=editor",       target: "sampler-editor-tab" },                                               // 18 — pestaña editor
  { view: "/?view=sampler&tab=editor",       target: "sampler-cal-panel" },                                                 // 19 — panel calibración
  { view: "/?view=sampler&tab=editor",       target: "view-options-btn" },                                                  // 20 — ⋮ sampler: señalar el botón
  { view: "/?view=sampler&tab=editor",       target: "sampler-options-content", triggerBefore: "view-options-btn" },       // 21 — ⋮ sampler: interior del diálogo
  { view: "/?view=sampler&tab=secuenciador", target: "sampler-seq-tab" },                                                  // 22 — pestaña secuenciador
  { view: "/?view=sampler&tab=secuenciador", target: "seq-bpm-ctrl" },                                                     // 23 — BPM
  { view: "/?view=sampler&tab=secuenciador", target: "seq-steps-ctrl" },                                                   // 24 — pasos
  { view: "/?view=sampler&tab=secuenciador", target: "seq-play-button" },                                                  // 25 — reproducir patrón
  { view: "/?view=sampler&tab=secuenciador", target: "seq-clear-button" },                                                 // 26 — borrar patrón
  { view: "/?view=edit&timelineView=tracks", target: "track-timeline" },                                                   // 27 — vista tracks
  { view: "/?view=edit&timelineView=tracks", target: null },                                                                // 28 — mute/solo/duplicar
  { view: "/?view=edit&timelineView=notes",  target: "view-options-btn" },                                                 // 29 — ⋮ edición: señalar el botón
  { view: "/?view=edit&timelineView=notes",  target: "edit-options-content",   triggerBefore: "view-options-btn" },        // 30 — ⋮ edición: interior del diálogo
  { view: "/?view=settings",                 target: "repeat-tutorial-button" },                                           // 31 — cierre
]

export const COMPLETE_TOTAL_STEPS = COMPLETE_TUTORIAL_STEPS.length
