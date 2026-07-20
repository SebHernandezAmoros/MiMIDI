declare const __PLUGIN_CSS__: string

import { oscillatorPlugin } from "./oscillatorPluginDefinition"

;(function injectCss() {
  if (typeof document === "undefined") return
  let style = document.getElementById("mimidi-oscillator-css") as HTMLStyleElement | null
  if (!style) {
    style = document.createElement("style")
    style.id = "mimidi-oscillator-css"
    document.head.appendChild(style)
  }
  style.textContent = __PLUGIN_CSS__
})()

export default oscillatorPlugin
