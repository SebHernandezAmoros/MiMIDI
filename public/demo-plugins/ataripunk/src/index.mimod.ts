/**
 * Entry point para distribución como .mimod.
 * Compilado por scripts/build-plugin.mjs (esbuild), NO por Vite.
 *
 * - 'react' se resuelve desde scripts/react-shim.js (globalThis.__MIMIDI_RUNTIME__)
 * - __PLUGIN_CSS__ es reemplazado en build time por el CSS de ataripunk.css
 */

// Reemplazado por esbuild con el contenido de ataripunk.css
declare const __PLUGIN_CSS__: string

import { AtariPunkWorkspace } from "./AtariPunkWorkspace"

;(function injectCss() {
  if (typeof document === "undefined") return
  // Siempre actualiza el contenido — no saltear si ya existe (permite actualizaciones del plugin)
  let s = document.getElementById("mimidi-ataripunk-css") as HTMLStyleElement | null
  if (!s) {
    s = document.createElement("style")
    s.id = "mimidi-ataripunk-css"
    document.head.appendChild(s)
  }
  s.textContent = __PLUGIN_CSS__
})()

export default {
  id: "ataripunk",
  name: "AtariPunk Synth",
  version: "0.1.0",
  description: "Sintetizador de ondas cuadradas estilo chip Atari con teclado propio y controles de timbre.",
  enabledByDefault: true,
  workspace: { component: AtariPunkWorkspace },
}
