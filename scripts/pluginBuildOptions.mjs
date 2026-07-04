import { dirname, join } from "path"
import { fileURLToPath } from "url"

const scriptsDir = dirname(fileURLToPath(import.meta.url))

export function createPluginEsbuildOptions({ combinedCss }) {
  return {
    bundle: true,
    format: "esm",
    minify: false,
    jsx: "automatic",
    alias: {
      react: join(scriptsDir, "react-shim.js"),
      "react/jsx-runtime": join(scriptsDir, "react-jsx-runtime-shim.js"),
    },
    define: { __PLUGIN_CSS__: JSON.stringify(combinedCss) },
    keepNames: true,
  }
}
