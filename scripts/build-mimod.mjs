/**
 * Genera un archivo .mimod (zip) desde una definición inline de plugin.
 * Para plugins sin TypeScript ni React — solo instrumentos matemáticos.
 *
 * Para plugins con TypeScript/React, usa build-plugin.mjs en su lugar.
 *
 * Uso:
 *   node scripts/build-mimod.mjs <plugin-id>
 *
 * Plugins disponibles: motion-synth-pack
 *
 * Salida:
 *   public/demo-plugins/<plugin-id>/src/          ← fuentes sin comprimir
 *   public/demo-plugins/<plugin-id>/<id>.mimod    ← distribuible
 */
import { zipSync, strToU8 } from "fflate"
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const OUT_DIR = join(ROOT, "public", "demo-plugins")

// ─── Plugins inline (solo instrumentos, sin build step) ───────────────────────

const plugins = {
  "motion-synth-pack": {
    manifest: {
      id: "motion-synth-pack",
      name: "Motion Synth Pack",
      version: "0.1.0",
      description: "Extiende el laboratorio con leads y pads matemáticos adicionales sin usar samples.",
      author: "MiMIDI Core Team",
      sourceUrl: "https://github.com/tu-usuario/mimidi",
      license: "MIT",
      entryPoint: "index.js",
      mimidiVersion: ">=1.0.0",
      permissions: [],
    },
    indexJs: `export default {
  id: "motion-synth-pack",
  name: "Motion Synth Pack",
  version: "0.1.0",
  description: "Extiende el laboratorio con leads y pads matemáticos adicionales sin usar samples.",
  enabledByDefault: true,
  instruments: {
    instruments: [
      {
        category: "base",
        id: "glass-pluck",
        name: "Glass Pluck",
        waveform: "triangle",
        volume: 0.2,
        envelope: { attack: 0.004, decay: 0.16, sustain: 0.18, release: 0.1 },
      },
      {
        category: "advanced",
        id: "pulse-drift",
        name: "Pulse Drift",
        waveform: "square",
        volume: 0.14,
        envelope: { attack: 0.012, decay: 0.1, sustain: 0.56, release: 0.18 },
        lfo: { depth: 7, rate: 3.4, waveform: "triangle" },
      },
      {
        category: "base",
        id: "chip-lead",
        name: "Chip Lead",
        waveform: "square",
        volume: 0.13,
        envelope: { attack: 0.004, decay: 0.08, sustain: 0.28, release: 0.1 },
      },
    ],
  },
}
`,
  },
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const pluginId = process.argv[2]
if (!pluginId || !plugins[pluginId]) {
  console.error(`Uso: node scripts/build-mimod.mjs <plugin-id>`)
  console.error(`Plugins inline disponibles: ${Object.keys(plugins).join(", ")}`)
  console.error(`Para plugins TypeScript/React: node scripts/build-plugin.mjs <plugin-id>`)
  process.exit(1)
}

const { manifest, indexJs } = plugins[pluginId]

const srcDir = join(OUT_DIR, pluginId, "src")
mkdirSync(srcDir, { recursive: true })
writeFileSync(join(srcDir, "manifest.json"), JSON.stringify(manifest, null, 2))
writeFileSync(join(srcDir, "index.js"), indexJs)

const files = {
  "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
  "index.js": strToU8(indexJs),
}
const zip = zipSync(files, { level: 0 })

mkdirSync(join(OUT_DIR, pluginId), { recursive: true })
const outPath = join(OUT_DIR, pluginId, `${pluginId}.mimod`)
writeFileSync(outPath, zip)

console.log(`✓ ${outPath} (${zip.byteLength} bytes)`)
console.log(`✓ ${srcDir}/`)
