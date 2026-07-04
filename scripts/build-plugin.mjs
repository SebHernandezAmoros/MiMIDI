/**
 * Compila un plugin TypeScript/React a formato .mimod usando esbuild.
 *
 * Uso:
 *   node scripts/build-plugin.mjs <plugin-id>
 *
 * Estructura esperada en el repo:
 *   src/engine/plugins/packs/<plugin-id>/
 *     index.mimod.ts   ← entry point para esta build
 *     manifest.json    ← manifiesto del plugin
 *     *.tsx / *.ts     ← componentes y lógica
 *     *.css            ← estilos
 *
 * Salida:
 *   public/demo-plugins/<plugin-id>/<id>.mimod ← bundle compilado distribuible
 *
 * El código fuente vive en src/engine/plugins/packs/<plugin-id>/ — no se duplica.
 */
import * as esbuild from "esbuild"
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { zipSync, strToU8 } from "fflate"
import { createPluginEsbuildOptions } from "./pluginBuildOptions.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const DEMO_DIR = join(ROOT, "public", "demo-plugins")

// ─── Args ─────────────────────────────────────────────────────────────────────

const pluginId = process.argv[2]
if (!pluginId) {
  console.error("Uso: node scripts/build-plugin.mjs <plugin-id>")
  console.error("Ejemplo: node scripts/build-plugin.mjs ataripunk")
  process.exit(1)
}

const srcDir = join(DEMO_DIR, pluginId, "src")
const tmpBundlePath = join(DEMO_DIR, pluginId, "_bundle.js")

// ─── Leer manifiesto ──────────────────────────────────────────────────────────

const manifest = JSON.parse(readFileSync(join(srcDir, "manifest.json"), "utf8"))

// ─── Combinar CSS (para inyección inline en el bundle) ────────────────────────

const cssFiles = readdirSync(srcDir).filter((f) => f.endsWith(".css"))
const combinedCss = cssFiles.map((f) => readFileSync(join(srcDir, f), "utf8")).join("\n")
console.log(cssFiles.length ? `CSS: ${cssFiles.join(", ")}` : "CSS: ninguno")

// ─── Bundle con esbuild ───────────────────────────────────────────────────────

mkdirSync(join(DEMO_DIR, pluginId), { recursive: true })

await esbuild.build({
  ...createPluginEsbuildOptions({ combinedCss }),
  entryPoints: [join(srcDir, "index.mimod.ts")],
  outfile: tmpBundlePath,
  banner: {
    js: [
      `// ─── MiMIDI Plugin Bundle ────────────────────────────────────────────────────`,
      `// id:      ${manifest.id}`,
      `// version: ${manifest.version}`,
      `// source:  ${manifest.sourceUrl ?? "—"}`,
      `// built:   ${new Date().toISOString()}`,
      `// ─────────────────────────────────────────────────────────────────────────────`,
    ].join("\n"),
  },
  logLevel: "info",
})

// ─── Empaquetar .mimod ────────────────────────────────────────────────────────

const bundledJs = readFileSync(tmpBundlePath, "utf8")
// Elimina el archivo temporal
import { unlinkSync } from "fs"
unlinkSync(tmpBundlePath)

const files = {
  "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
  "index.js": strToU8(bundledJs),
}
const zip = zipSync(files, { level: 0 })

const outPath = join(DEMO_DIR, pluginId, `${pluginId}.mimod`)
writeFileSync(outPath, zip)

console.log(`\n✓ ${outPath} (${zip.byteLength} bytes)`)
console.log(`✓ fuente: ${srcDir}/`)
