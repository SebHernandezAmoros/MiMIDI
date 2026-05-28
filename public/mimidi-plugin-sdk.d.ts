/**
 * MiMIDI Plugin SDK — Tipos para autores de plugins externos
 *
 * Uso en tu proyecto TypeScript:
 *   1. Copia este archivo a la raíz de tu plugin
 *   2. En tu tsconfig.json: { "include": ["src", "mimidi-plugin-sdk.d.ts"] }
 *   3. Usa los tipos directamente — no importes nada, son globales del módulo
 *
 * Compilación del plugin:
 *   npx esbuild src/index.ts --bundle --format=esm --outfile=index.js \
 *     --external:react --define:__PLUGIN_CSS__='"(css inline aquí)"'
 *
 * Distribución:
 *   Empaqueta manifest.json + index.js en un ZIP con extensión .mimod
 *   e importa desde MiMIDI → Plugins → IMPORT .mimod
 */

// ─── Notas MIDI ───────────────────────────────────────────────────────────────

/** Una nota grabada en el timeline del proyecto */
export type MidiRecordedNote = {
  id: string
  note: string
  startTime: number
  duration: number
  velocity: number
  instrumentId: string
}

// ─── Output que el plugin puede enviar al proyecto ────────────────────────────

/** El plugin envía notas MIDI → nueva pista melódica en el timeline */
export type PluginMidiOutput = {
  type: "midi"
  name: string
  instrumentId: string
  notes: MidiRecordedNote[]
}

/**
 * El plugin envía audio capturado o sintetizado.
 * - `destination: "project"` → aparece como AudioClipTrack en el timeline
 * - `destination: "sampler"` → se carga en el primer slot libre del sampler
 */
export type PluginAudioOutput = {
  type: "audio"
  name: string
  blob: Blob
  duration: number
  destination: "sampler" | "project"
  dbId?: string
}

export type PluginOutput = PluginMidiOutput | PluginAudioOutput

// ─── Slots de inyección en vistas existentes ──────────────────────────────────

/**
 * Zonas de vistas existentes donde el plugin puede inyectar controles.
 * El host renderiza PluginSlot en cada zona — si el plugin no contribuye
 * a ese slot, PluginSlot devuelve null sin afectar el layout.
 */
export type ToolSlotId =
  | "piano-toolbar"
  | "pad-toolbar"
  | "sampler-panel"
  | "edit-toolbar"

// ─── API que el host expone al plugin ─────────────────────────────────────────

/**
 * El objeto `api` que el host pasa al workspace y a los tool slots.
 * El plugin NUNCA importa internals de MiMIDI — solo usa este objeto.
 */
export type MiMIDIPluginAPI = {
  audio: {
    /** Toca una nota con el instrumento indicado durante `duration` segundos */
    playNote(note: string, instrumentId: string, duration: number): void
    /** Detiene la nota que se inició con playNote */
    stopNote(note: string): void
    /** Dispara un hit de pad (percusión) */
    triggerPad(padId: string, velocity?: number): void
  }
  project: {
    /** BPM actual del proyecto */
    getBPM(): number
    /** Lista de pistas del proyecto */
    getTracks(): { id: string; name: string; type: "melodic" | "percussion" }[]
  }
  transport: {
    readonly isPlaying: boolean
    readonly isRecording: boolean
    readonly bpm: number
    /** Suscribe un callback que se llama cuando el transporte inicia. Devuelve unsubscribe. */
    onPlay(cb: () => void): () => void
    /** Suscribe un callback que se llama cuando el transporte se detiene. Devuelve unsubscribe. */
    onStop(cb: () => void): () => void
  }
  session: {
    /** Envía el output del plugin al proyecto (track MIDI o clip de audio) */
    sendOutput(output: PluginOutput): void
    /** Guarda un blob en IndexedDB y devuelve su dbId para uso futuro */
    storeClip(blob: Blob, name: string, duration: number): Promise<string>
    /** Carga un blob guardado previamente por dbId */
    loadClip(dbId: string): Promise<Blob | null>
  }
  ui: {
    /** Muestra un toast al usuario */
    notify(message: string): void
  }
}

// ─── Props que reciben los componentes del plugin ─────────────────────────────

export type AppLanguage = "es" | "en"

/** Props del workspace principal del plugin (pantalla propia) */
export type PluginWorkspaceProps = {
  api: MiMIDIPluginAPI
  language: AppLanguage
  version?: string
}

/** Props del componente inyectado en un tool slot */
export type PluginToolSlotProps = {
  api: MiMIDIPluginAPI
  slotId: ToolSlotId
  language: AppLanguage
}

// ─── Definición del plugin ────────────────────────────────────────────────────

/** Contribución de instrumentos matemáticos al catálogo */
export type InstrumentPluginContribution = {
  instruments: {
    id: string
    name: string
    category: "base" | "pad" | "lead" | "bass" | "fx"
    waveform: "sine" | "square" | "sawtooth" | "triangle"
    volume: number
    envelope: { attack: number; decay: number; sustain: number; release: number }
  }[]
}

/**
 * El export default de tu plugin.
 *
 * Ejemplo mínimo (Type A — solo instrumentos):
 * ```ts
 * const myPlugin: MiMIDIPluginDefinition = {
 *   id: "my-plugin",
 *   name: "My Plugin",
 *   version: "1.0.0",
 *   description: "Short description",
 *   enabledByDefault: true,
 *   instruments: { instruments: [...] },
 * }
 * export default myPlugin
 * ```
 *
 * Ejemplo con workspace y tool slot (Type B):
 * ```ts
 * export default {
 *   id: "my-plugin",
 *   name: "My Plugin",
 *   version: "1.0.0",
 *   description: "...",
 *   enabledByDefault: true,
 *   workspace: { component: MyWorkspace },
 *   toolSlots: { "pad-toolbar": MyPadButton },
 * } satisfies MiMIDIPluginDefinition
 * ```
 */
export type MiMIDIPluginDefinition = {
  id: string
  name: string
  version: string
  description: string
  enabledByDefault: boolean
  instruments?: InstrumentPluginContribution
  workspace?: {
    component: (props: PluginWorkspaceProps) => unknown
    cssUrl?: string
  }
  toolSlots?: Partial<Record<ToolSlotId, (props: PluginToolSlotProps) => unknown>>
}
