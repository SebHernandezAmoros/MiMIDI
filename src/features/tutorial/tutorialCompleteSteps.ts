import type { BasicTutorialStep } from "./tutorialSteps"

export const COMPLETE_TUTORIAL_STEPS: BasicTutorialStep[] = [
  { view: "/?view=piano",                    target: null },                                                                //  1 — bienvenida
  { view: "/?view=piano",                    target: "track-selector" },                                                   //  2 — selector de pista (< TRACK 1 >)
  { view: "/?view=piano",                    target: "remove-track-button" },                                              //  3 — eliminar pista
  { view: "/?view=piano",                    target: "piano-mode-toggle" },                                                //  4 — modo nota/acorde
  { view: "/?view=piano",                    target: "piano-arp-toggle" },                                                 //  5 — arpegiador
  { view: "/?view=piano",                    target: "octave-control" },                                                   //  6 — octava
  { view: "/?view=piano",                    target: "view-options-btn" },                                                 //  7 — ⋮ piano: señalar el botón
  { view: "/?view=piano",                    target: "piano-chord-section",   triggerBefore: "view-options-btn" },         //  8 — ⋮ piano: tipo de acorde
  { view: "/?view=piano",                    target: "piano-arp-mode-section", triggerBefore: "view-options-btn" },        //  9 — ⋮ piano: modo ARP
  { view: "/?view=piano",                    target: "piano-arp-params",       triggerBefore: "view-options-btn" },        // 10 — ⋮ piano: parámetros ARP
  { view: "/?view=pad",                      target: "pad-page-pager" },                                                   // 11 — paginador de pads (< 1/2 >)
  { view: "/?view=pad",                      target: "pad-lock-button" },                                                  // 12 — candado de configuración
  { view: "/?view=pad",                      target: "pad-settings-btn" },                                                 // 13 — ⚙ síntesis de pad
  { view: "/?view=pad",                      target: "view-options-btn" },                                                 // 14 — ⋮ pad: señalar el botón
  { view: "/?view=pad",                      target: "pad-options-content",    triggerBefore: "view-options-btn" },        // 15 — ⋮ pad: interior del diálogo
  { view: "/?view=sampler&tab=editor",       target: "sampler-editor-tab" },                                              // 16 — pestaña editor
  { view: "/?view=sampler&tab=editor",       target: "sampler-cal-panel" },                                               // 17 — panel calibración
  { view: "/?view=sampler&tab=editor",       target: "view-options-btn" },                                                 // 18 — ⋮ sampler: señalar el botón
  { view: "/?view=sampler&tab=editor",       target: "sampler-options-content", triggerBefore: "view-options-btn" },      // 19 — ⋮ sampler: interior del diálogo
  { view: "/?view=sampler&tab=secuenciador", target: "sampler-seq-tab" },                                                 // 20 — pestaña secuenciador
  { view: "/?view=sampler&tab=secuenciador", target: "seq-bpm-ctrl" },                                                    // 21 — BPM
  { view: "/?view=sampler&tab=secuenciador", target: "seq-steps-ctrl" },                                                  // 22 — pasos
  { view: "/?view=sampler&tab=secuenciador", target: "seq-play-button" },                                                 // 23 — reproducir patrón
  { view: "/?view=sampler&tab=secuenciador", target: "seq-clear-button" },                                                // 24 — borrar patrón
  { view: "/?view=edit&timelineView=tracks", target: "track-timeline" },                                                  // 25 — vista tracks
  { view: "/?view=edit&timelineView=tracks", target: null },                                                               // 26 — mute/solo/duplicar
  { view: "/?view=edit&timelineView=notes",  target: "view-options-btn" },                                                // 27 — ⋮ edición: señalar el botón
  { view: "/?view=edit&timelineView=notes",  target: "edit-options-content",   triggerBefore: "view-options-btn" },       // 28 — ⋮ edición: interior del diálogo
  { view: "/?view=settings",                 target: "repeat-tutorial-button" },                                          // 29 — cierre
]

export const COMPLETE_TOTAL_STEPS = COMPLETE_TUTORIAL_STEPS.length
