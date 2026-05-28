/**
 * Entry point para distribución como .mimod.
 * Compilado por scripts/build-plugin.mjs (esbuild), NO por Vite.
 *
 * - 'react' se resuelve desde scripts/react-shim.js (globalThis.__MIMIDI_RUNTIME__)
 * - __PLUGIN_CSS__ es reemplazado en build time por el CSS de sfxr.css
 */

declare const __PLUGIN_CSS__: string

import { SfxrWorkspace } from "./SfxrWorkspace"
import { SfxrPadButton } from "./SfxrPadButton"

;(function injectCss() {
  if (typeof document === "undefined") return
  let s = document.getElementById("mimidi-sfxr-css") as HTMLStyleElement | null
  if (!s) {
    s = document.createElement("style")
    s.id = "mimidi-sfxr-css"
    document.head.appendChild(s)
  }
  s.textContent = __PLUGIN_CSS__
})()

export default {
  id: "sfxr",
  name: "SFXR Generator",
  version: "0.1.0",
  description: "Generador de efectos de sonido procedural estilo 8-bit: disparos, explosiones, saltos y más.",
  enabledByDefault: true,
  workspace: { component: SfxrWorkspace },
  toolSlots: {
    "pad-toolbar": SfxrPadButton,
  },
}
