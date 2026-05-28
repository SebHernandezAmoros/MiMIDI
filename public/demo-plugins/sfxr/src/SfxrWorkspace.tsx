import { useState, useRef, useCallback, useEffect } from "react"
import {
  generateSamples, samplesToWav, getPreset, mutateParams, PRESETS, OFF_LPF,
  type SfxParams, type SfxPresetId, type SfxWave,
} from "./sfxrEngine"

type PluginAPI = {
  session: {
    sendOutput(output: {
      type: "audio"; name: string; blob: Blob
      duration: number; destination: "sampler" | "project"
    }): void
  }
  ui: { notify(msg: string): void }
}

const SAMPLE_RATE = 44100
const CLIPS_KEY   = "sfxr-saved-clips"
const HIST_MAX    = 40

const WAVES: SfxWave[] = ["square", "sawtooth", "triangle", "sine", "noise"]
const WAVE_LABELS: Record<SfxWave, string> = {
  square: "SQUARE", sawtooth: "SAW", triangle: "TRI", sine: "SINE", noise: "NOISE",
}

const PRESET_IDS = ([...Object.keys(PRESETS), "random"] as SfxPresetId[])
const PRESET_LABELS: Record<SfxPresetId, string> = {
  pickup: "PICKUP", laser: "LASER", explosion: "EXPLOS",
  powerup: "PWR-UP", hit: "HIT", jump: "JUMP",
  blip: "BLIP", coin: "COIN", zap: "ZAP",
  boom: "BOOM", hurt: "HURT", synth: "SYNTH",
  "1up": "1-UP", click: "CLICK", random: "RANDOM",
}

// ── Sistema de notas ─────────────────────────────────────────────────────────

const NOTE_NAMES   = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"]
const NOTE_NATURAL = ["C","D","E","F","G","A","B"]
const NATURAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
// left% = centro de cada tecla negra relativo al ancho del teclado de 7 columnas
const SHARP_DEFS: { st: number; leftPct: number }[] = [
  { st: 1,  leftPct: 14.29 }, // C♯
  { st: 3,  leftPct: 28.57 }, // D♯
  { st: 6,  leftPct: 57.14 }, // F♯
  { st: 8,  leftPct: 71.43 }, // G♯
  { st: 10, leftPct: 85.71 }, // A♯
]

function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(Math.max(1, freq) / 440))
}
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// ── Tipos ────────────────────────────────────────────────────────────────────

// Las 5 capas del flujo de creación: GEN → NOTA → FORMA → FX → CLIPS
type TabId = "gen" | "nota" | "forma" | "fx" | "clips"

type SfxClip = { id: string; name: string; params: SfxParams; createdAt: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadClips(): SfxClip[] {
  try { return JSON.parse(localStorage.getItem(CLIPS_KEY) ?? "[]") as SfxClip[] }
  catch { return [] }
}
function persistClips(clips: SfxClip[]) {
  try { localStorage.setItem(CLIPS_KEY, JSON.stringify(clips)) } catch {}
}
function makeBlobFromParams(params: SfxParams): { blob: Blob; duration: number } {
  const samples = generateSamples(params, SAMPLE_RATE)
  const wav = samplesToWav(samples, SAMPLE_RATE)
  return { blob: new Blob([wav], { type: "audio/wav" }), duration: samples.length / SAMPLE_RATE }
}

function drawWaveform(canvas: HTMLCanvasElement, params: SfxParams) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  ctx.fillStyle = "#0f0f0f"
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = "rgba(255,255,255,0.05)"
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
  const vizParams = { ...params, delayOn: false, harmonyOn: false }
  const samples = generateSamples(vizParams, SAMPLE_RATE)
  let peak = 0
  for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) > peak) peak = Math.abs(samples[i])
  const norm = peak > 0.001 ? 1 / peak : 1
  ctx.strokeStyle = "#f07040"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let x = 0; x < W; x++) {
    const idx = Math.floor(x * samples.length / W)
    const y = (1 - samples[idx] * norm) * H / 2
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  const grad = ctx.createLinearGradient(W * 0.75, 0, W, 0)
  grad.addColorStop(0, "rgba(15,15,15,0)")
  grad.addColorStop(1, "rgba(15,15,15,0.7)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
}

// ── Componente principal ─────────────────────────────────────────────────────

export function SfxrWorkspace({ api, version }: { api: PluginAPI; version?: string }) {
  const initialParams                    = useRef(getPreset("pickup")).current
  const [tab, setTab]                    = useState<TabId>("gen")
  const [params, setParams]              = useState<SfxParams>(initialParams)
  const [activePreset, setActivePreset]  = useState<SfxPresetId>("pickup")
  const [isPlaying, setIsPlaying]        = useState(false)
  const [status, setStatus]              = useState("Listo — elige un preset o ajusta los parámetros")
  const [clips, setClips]                = useState<SfxClip[]>(() => loadClips())
  const [playingClipId, setPlayingClipId] = useState<string | null>(null)
  const [rootMidi, setRootMidi]          = useState(() => freqToMidi(initialParams.baseFreq))

  const historyRef  = useRef<SfxParams[]>([initialParams])
  const [histIndex, setHistIndex] = useState(0)

  const ctxRef     = useRef<AudioContext | null>(null)
  const srcRef     = useRef<AudioBufferSourceNode | null>(null)
  const clipSrcRef = useRef<AudioBufferSourceNode | null>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const drawTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (drawTimer.current) clearTimeout(drawTimer.current)
    drawTimer.current = setTimeout(() => {
      if (canvasRef.current) drawWaveform(canvasRef.current, params)
    }, 60)
  }, [params])

  function set<K extends keyof SfxParams>(key: K, val: SfxParams[K]) {
    setParams(p => ({ ...p, [key]: val }))
    setActivePreset("random")
  }

  function ensureCtx(): AudioContext {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE })
    }
    return ctxRef.current
  }

  function stopCurrent() {
    try { srcRef.current?.stop() } catch { /* already stopped */ }
    srcRef.current = null
    setIsPlaying(false)
  }
  function stopClipAudio() {
    try { clipSrcRef.current?.stop() } catch { /* already stopped */ }
    clipSrcRef.current = null
    setPlayingClipId(null)
  }

  const playParams = useCallback(async (p: SfxParams) => {
    stopCurrent()
    const ctx = ensureCtx()
    if (ctx.state === "suspended") await ctx.resume()
    const samples = generateSamples(p, SAMPLE_RATE)
    const buf = ctx.createBuffer(1, samples.length, SAMPLE_RATE)
    buf.getChannelData(0).set(samples)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.onended = () => setIsPlaying(false)
    src.start()
    srcRef.current = src
    setIsPlaying(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushHistory(p: SfxParams) {
    const trimmed = historyRef.current.slice(0, histIndex + 1)
    const next = [...trimmed, p].slice(-HIST_MAX)
    historyRef.current = next
    setHistIndex(next.length - 1)
  }

  function syncRootMidi(freq: number) {
    setRootMidi(Math.max(36, Math.min(96, freqToMidi(freq))))
  }

  function loadPreset(id: SfxPresetId) {
    const p = getPreset(id)
    setParams(p)
    setActivePreset(id)
    syncRootMidi(p.baseFreq)
    pushHistory(p)
    void playParams(p)
  }

  function mutate() {
    const p = mutateParams(params)
    setParams(p)
    setActivePreset("random")
    syncRootMidi(p.baseFreq)
    pushHistory(p)
    void playParams(p)
  }

  function goBack() {
    if (histIndex <= 0) return
    const idx = histIndex - 1
    const p = historyRef.current[idx]
    setParams(p); setHistIndex(idx); setActivePreset("random")
    syncRootMidi(p.baseFreq)
    void playParams(p)
  }

  function goForward() {
    if (histIndex >= historyRef.current.length - 1) return
    const idx = histIndex + 1
    const p = historyRef.current[idx]
    setParams(p); setHistIndex(idx); setActivePreset("random")
    syncRootMidi(p.baseFreq)
    void playParams(p)
  }

  function selectNote(semitone: number, octave: number) {
    const midi = (octave + 1) * 12 + semitone
    const freq = midiToFreq(midi)
    const newParams = { ...params, baseFreq: freq }
    setRootMidi(midi)
    setParams(newParams)
    setActivePreset("random")
    pushHistory(newParams)
    void playParams(newParams)
  }

  const playClip = useCallback(async (clip: SfxClip) => {
    if (playingClipId === clip.id) { stopClipAudio(); return }
    stopClipAudio()
    const ctx = ensureCtx()
    if (ctx.state === "suspended") await ctx.resume()
    const samples = generateSamples(clip.params, SAMPLE_RATE)
    const buf = ctx.createBuffer(1, samples.length, SAMPLE_RATE)
    buf.getChannelData(0).set(samples)
    const src = ctx.createBufferSource()
    src.buffer = buf; src.connect(ctx.destination)
    src.onended = () => setPlayingClipId(null)
    src.start(); clipSrcRef.current = src; setPlayingClipId(clip.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingClipId])

  function downloadWav(p: SfxParams, name: string) {
    const { blob } = makeBlobFromParams(p)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${name}.wav`; a.click()
    URL.revokeObjectURL(url)
  }

  function sendAudio(destination: "project" | "sampler") {
    const { blob, duration } = makeBlobFromParams(params)
    const ts = new Date()
    const name = `SFX ${PRESET_LABELS[activePreset]} ${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}`
    api.session.sendOutput({ type: "audio", name, blob, duration, destination })
    const dest = destination === "project" ? "proyecto" : "sampler"
    api.ui.notify(`SFX enviado al ${dest}`)
    setStatus(`Enviado al ${dest} → ${name}`)
  }

  function saveClip() {
    const ts = new Date()
    const name = `SFX ${PRESET_LABELS[activePreset]} ${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}`
    const clip: SfxClip = { id: `${Date.now()}`, name, params, createdAt: ts.toISOString() }
    setClips(prev => { const u = [...prev, clip]; persistClips(u); return u })
    api.ui.notify(`Clip guardado: ${name}`)
    setStatus(`Guardado → ${name}`)
    setTab("clips")
  }

  function sendClipTo(clip: SfxClip, destination: "sampler" | "project") {
    const { blob, duration } = makeBlobFromParams(clip.params)
    api.session.sendOutput({ type: "audio", name: clip.name, blob, duration, destination })
    api.ui.notify(destination === "sampler" ? "Enviado al sampler." : "Guardado en proyecto.")
  }

  function removeClip(id: string) {
    if (playingClipId === id) stopClipAudio()
    setClips(prev => { const u = prev.filter(c => c.id !== id); persistClips(u); return u })
  }

  const durationMs   = Math.round((params.attackTime + params.sustainTime + params.decayTime) * 1000)
  const histLen      = historyRef.current.length
  const canBack      = histIndex > 0
  const canForward   = histIndex < histLen - 1
  const rootSemitone = rootMidi % 12
  const rootOctave   = Math.floor(rootMidi / 12) - 1
  const rootName     = NOTE_NAMES[rootSemitone]

  return (
    <div className="sfxr-workspace">

      {/* ── Header ── */}
      <div className="sfxr-header">
        <span className="sfxr-title">SFXR</span>
        <div className="sfxr-tabs">
          <button type="button" className={`sfxr-tab${tab === "gen"   ? " active" : ""}`} onClick={() => setTab("gen")}>GEN.</button>
          <button type="button" className={`sfxr-tab${tab === "nota"  ? " active" : ""}`} onClick={() => setTab("nota")}>NOTA</button>
          <button type="button" className={`sfxr-tab${tab === "forma" ? " active" : ""}`} onClick={() => setTab("forma")}>FORMA</button>
          <button type="button" className={`sfxr-tab${tab === "fx"    ? " active" : ""}`} onClick={() => setTab("fx")}>FX</button>
          <button type="button" className={`sfxr-tab${tab === "clips" ? " active" : ""}`} onClick={() => setTab("clips")}>
            {clips.length > 0 ? `CLIPS(${clips.length})` : "CLIPS"}
          </button>
        </div>
        {version && <span className="sfxr-ver">v{version}</span>}
      </div>

      {/* ── Canvas — siempre visible ── */}
      <canvas ref={canvasRef} className="sfxr-waveform" width={900} height={80} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CAPA 1 — GEN.: ¿qué tipo de sonido?                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === "gen" && (
        <div className="sfxr-tab-body">

          <div className="sfxr-section-label">PRESET</div>
          <div className="sfxr-presets">
            {PRESET_IDS.map(id => (
              <button key={id} type="button"
                className={`sfxr-preset-btn${activePreset === id ? " active" : ""}`}
                onClick={() => loadPreset(id)}
              >
                {PRESET_LABELS[id]}
              </button>
            ))}
          </div>

          <div className="sfxr-section-label">ONDA</div>
          <div className="sfxr-waves">
            {WAVES.map(w => (
              <button key={w} type="button"
                className={`sfxr-wave-btn${params.wave === w ? " active" : ""}`}
                onClick={() => set("wave", w)}
              >
                {WAVE_LABELS[w]}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CAPA 2 — NOTA: ¿en qué tono?                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === "nota" && (
        <div className="sfxr-tab-body sfxr-nota-body">

          <div className="sfxr-section-label">
            NOTA RAÍZ
            <span className="sfxr-note-badge">{rootName}{rootOctave}</span>
          </div>

          {/* Teclado cromático */}
          <div className="sfxr-note-keys">
            <div className="sfxr-naturals">
              {NATURAL_SEMITONES.map((st, i) => (
                <button key={st} type="button"
                  className={`sfxr-natural-btn${rootSemitone === st ? " active" : ""}`}
                  onClick={() => selectNote(st, rootOctave)}
                >
                  {NOTE_NATURAL[i]}
                </button>
              ))}
            </div>
            {SHARP_DEFS.map(({ st, leftPct }) => (
              <button key={st} type="button"
                className={`sfxr-sharp-btn${rootSemitone === st ? " active" : ""}`}
                style={{ left: `${leftPct}%` }}
                onClick={() => selectNote(st, rootOctave)}
              >
                {NOTE_NAMES[st]}
              </button>
            ))}
          </div>

          {/* Octava */}
          <div className="sfxr-octave-row">
            {[3, 4, 5].map(oct => (
              <button key={oct} type="button"
                className={`sfxr-octave-btn${rootOctave === oct ? " active" : ""}`}
                onClick={() => selectNote(rootSemitone, oct)}
              >
                OCT {oct}
              </button>
            ))}
          </div>

          <p className="sfxr-nota-hint">Toca cualquier nota para transponer el sonido actual</p>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CAPA 3 — FORMA: ¿cómo evoluciona?                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === "forma" && (
        <div className="sfxr-tab-body">

          <div className="sfxr-section-label">ENVOLVENTE</div>
          <ParamRow label="ATTACK"  display={`${(params.attackTime  * 1000).toFixed(0)} ms`}
            min={0}    max={0.5}  step={0.005} val={params.attackTime}   onChange={v => set("attackTime", v)} />
          <ParamRow label="SUSTAIN" display={`${(params.sustainTime * 1000).toFixed(0)} ms`}
            min={0.01} max={1}    step={0.01}  val={params.sustainTime}  onChange={v => set("sustainTime", v)} />
          <ParamRow label="DECAY"   display={`${(params.decayTime   * 1000).toFixed(0)} ms`}
            min={0.01} max={1}    step={0.01}  val={params.decayTime}    onChange={v => set("decayTime", v)} />
          <ParamRow label="PUNCH"   display={`${Math.round(params.sustainPunch * 100)}%`}
            min={0}    max={1}    step={0.01}  val={params.sustainPunch} onChange={v => set("sustainPunch", v)} />

          <div className="sfxr-section-label">TONO &amp; MOVIMIENTO</div>
          <ParamRow label="SLIDE"   display={`${params.freqSlide > 0 ? "+" : ""}${params.freqSlide.toFixed(2)} o/s`}
            min={-4}   max={4}    step={0.05}  val={params.freqSlide}      onChange={v => set("freqSlide", v)} />
          <ParamRow label="SLIDE 2" display={`${params.freqSlide2 > 0 ? "+" : ""}${params.freqSlide2.toFixed(2)}`}
            min={-4}   max={4}    step={0.05}  val={params.freqSlide2}     onChange={v => set("freqSlide2", v)} />
          <ParamRow label="VIBRATO" display={`${Math.round(params.vibratoDepth * 100)}%`}
            min={0}    max={0.5}  step={0.005} val={params.vibratoDepth}   onChange={v => set("vibratoDepth", v)} />
          <ParamRow label="VIB SPD" display={`${params.vibratoSpeed.toFixed(1)} Hz`}
            min={0}    max={20}   step={0.5}   val={params.vibratoSpeed}   onChange={v => set("vibratoSpeed", v)} />
          <ParamRow label="ARPEGIO" display={`×${params.arpeggioFactor.toFixed(2)}`}
            min={0.25} max={4}    step={0.05}  val={params.arpeggioFactor} onChange={v => set("arpeggioFactor", v)} />
          <ParamRow label="ARP DLY" display={`${(params.arpeggioDelay * 1000).toFixed(0)} ms`}
            min={0}    max={0.5}  step={0.005} val={params.arpeggioDelay}  onChange={v => set("arpeggioDelay", v)} />

          <div className="sfxr-section-label">FILTROS &amp; CALIDAD</div>
          <ParamRow label="LPF FREQ"
            display={params.lpfFreq >= OFF_LPF ? "OFF" : `${params.lpfFreq.toFixed(0)} Hz`}
            min={100}  max={OFF_LPF} step={50}  val={params.lpfFreq}      onChange={v => set("lpfFreq", v)} />
          <ParamRow label="LPF RES"  display={`${Math.round(params.lpfResonance * 100)}%`}
            min={0}    max={0.98}    step={0.01} val={params.lpfResonance} onChange={v => set("lpfResonance", v)} />
          <ParamRow label="HPF FREQ"
            display={params.hpfFreq <= 1 ? "OFF" : `${params.hpfFreq.toFixed(0)} Hz`}
            min={0}    max={2000}    step={10}   val={params.hpfFreq}      onChange={v => set("hpfFreq", v)} />
          <ParamRow label="BIT CRUSH"
            display={params.bitCrush >= 16 ? "OFF" : `${params.bitCrush}-bit`}
            min={1}    max={16}      step={1}    val={params.bitCrush}     onChange={v => set("bitCrush", Math.round(v))} />
          <ParamRow label="DUTY"     display={`${Math.round(params.squareDuty * 100)}%`}
            min={0.05} max={0.5}     step={0.01} val={params.squareDuty}  onChange={v => set("squareDuty", v)} />

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CAPA 4 — FX: procesado encima del sonido                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === "fx" && (
        <div className="sfxr-tab-body">
          <div className="sfxr-fx-grid">

            <FxCard name="TREMOLO" isOn={params.tremoloOn} onToggle={() => set("tremoloOn", !params.tremoloOn)}>
              <ParamRow label="RATE"  display={`${params.tremoloRate.toFixed(1)} Hz`}
                min={0.5} max={20}  step={0.5}  val={params.tremoloRate}  onChange={v => set("tremoloRate", v)} />
              <ParamRow label="DEPTH" display={`${Math.round(params.tremoloDepth * 100)}%`}
                min={0}   max={1}   step={0.01} val={params.tremoloDepth} onChange={v => set("tremoloDepth", v)} />
            </FxCard>

            <FxCard name="FM SYNTH" isOn={params.fmOn} onToggle={() => set("fmOn", !params.fmOn)}>
              <ParamRow label="AMOUNT" display={`${params.fmStrength.toFixed(1)}x`}
                min={0}   max={10}  step={0.1}  val={params.fmStrength} onChange={v => set("fmStrength", v)} />
              <ParamRow label="SPEED"  display={`${params.fmSpeed.toFixed(1)} Hz`}
                min={0.5} max={50}  step={0.5}  val={params.fmSpeed}    onChange={v => set("fmSpeed", v)} />
            </FxCard>

            <FxCard name="RING MOD" isOn={params.ringModOn} onToggle={() => set("ringModOn", !params.ringModOn)}>
              <ParamRow label="FREQ"  display={`${params.ringModFreq.toFixed(0)} Hz`}
                min={20}  max={2000} step={5}    val={params.ringModFreq}  onChange={v => set("ringModFreq", v)} />
              <ParamRow label="DEPTH" display={`${Math.round(params.ringModDepth * 100)}%`}
                min={0}   max={1}    step={0.01} val={params.ringModDepth} onChange={v => set("ringModDepth", v)} />
            </FxCard>

            <FxCard name="WAH-WAH" isOn={params.wahOn} onToggle={() => set("wahOn", !params.wahOn)}>
              <ParamRow label="RATE"  display={`${params.wahRate.toFixed(1)} Hz`}
                min={0.5} max={8}   step={0.1}  val={params.wahRate}  onChange={v => set("wahRate", v)} />
              <ParamRow label="DEPTH" display={`${Math.round(params.wahDepth * 100)}%`}
                min={0}   max={1}   step={0.01} val={params.wahDepth} onChange={v => set("wahDepth", v)} />
            </FxCard>

            <FxCard name="HARMONY" isOn={params.harmonyOn} onToggle={() => set("harmonyOn", !params.harmonyOn)}>
              <ParamRow label="SEMIT." display={`${params.harmonyInterval > 0 ? "+" : ""}${params.harmonyInterval} st`}
                min={-24} max={24} step={1}    val={params.harmonyInterval} onChange={v => set("harmonyInterval", Math.round(v))} />
              <ParamRow label="VOL."   display={`${Math.round(params.harmonyVolume * 100)}%`}
                min={0}   max={1}  step={0.01} val={params.harmonyVolume}   onChange={v => set("harmonyVolume", v)} />
            </FxCard>

            <FxCard name="DELAY" isOn={params.delayOn} onToggle={() => set("delayOn", !params.delayOn)}>
              <ParamRow label="TIME"  display={`${params.delayTime.toFixed(0)} ms`}
                min={10}  max={800}  step={10}   val={params.delayTime}  onChange={v => set("delayTime", v)} />
              <ParamRow label="DECAY" display={`${Math.round(params.delayDecay * 100)}%`}
                min={0}   max={0.95} step={0.01} val={params.delayDecay} onChange={v => set("delayDecay", v)} />
            </FxCard>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CAPA 5 — CLIPS: resultados guardados                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === "clips" && (
        <div className="sfxr-tab-body sfxr-clips">
          {clips.length === 0 ? (
            <span className="sfxr-clips-empty">SIN CLIPS GUARDADOS AÚN</span>
          ) : clips.map(clip => (
            <div key={clip.id} className="sfxr-clip-row">
              <span className="sfxr-clip-name" title={clip.name}>{clip.name}</span>
              <div className="sfxr-clip-btns">
                <button type="button" className="sfxr-clip-btn" onClick={() => void playClip(clip)}>
                  {playingClipId === clip.id ? "■" : "▶"}
                </button>
                <button type="button" className="sfxr-clip-btn sfxr-clip-wav" onClick={() => downloadWav(clip.params, clip.name)}>⬇</button>
                <button type="button" className="sfxr-clip-btn" onClick={() => sendClipTo(clip, "sampler")}>→S</button>
                <button type="button" className="sfxr-clip-btn" onClick={() => sendClipTo(clip, "project")}>→P</button>
                <button type="button" className="sfxr-clip-btn sfxr-clip-del" onClick={() => removeClip(clip.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Barra de acciones — visible en los 5 tabs ── */}
      <div className="sfxr-action-bar">
        <div className="sfxr-action-row">
          <button type="button" className="sfxr-hist-btn" onClick={goBack}    disabled={!canBack}>◀</button>
          <span className="sfxr-hist-pos">{histIndex + 1}/{histLen}</span>
          <button type="button" className="sfxr-hist-btn" onClick={goForward} disabled={!canForward}>▶</button>
          <button type="button"
            className={`sfxr-play-btn${isPlaying ? " playing" : ""}`}
            onClick={isPlaying ? stopCurrent : () => void playParams(params)}
          >
            {isPlaying ? "■ STOP" : `▶ PLAY  ${durationMs}ms`}
          </button>
          <button type="button" className="sfxr-action-btn sfxr-mutate-btn" onClick={mutate}>≈ MUTATE</button>
          <button type="button" className="sfxr-action-btn sfxr-save-btn"   onClick={saveClip}>✦ GUAR.</button>
        </div>
        <div className="sfxr-action-row">
          <button type="button" className="sfxr-action-btn sfxr-wav-btn" onClick={() => downloadWav(params, `SFX ${PRESET_LABELS[activePreset]}`)}>⬇ WAV</button>
          <button type="button" className="sfxr-action-btn" onClick={() => sendAudio("project")}>→ PROYECTO</button>
          <button type="button" className="sfxr-action-btn" onClick={() => sendAudio("sampler")}>→ SAMPLER</button>
        </div>
      </div>

      <div className="sfxr-status">{status}</div>
    </div>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function FxCard({ name, isOn, onToggle, children }: {
  name: string; isOn: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={`sfxr-fx-card${isOn ? " on" : ""}`}>
      <div className="sfxr-fx-card-header">
        <span className="sfxr-fx-card-name">{name}</span>
        <button type="button"
          className={`sfxr-fx-toggle${isOn ? " on" : ""}`}
          onClick={onToggle}
        >
          {isOn ? "● ON" : "○ OFF"}
        </button>
      </div>
      {children}
    </div>
  )
}

function ParamRow({ label, display, min, max, step, val, onChange }: {
  label: string; display: string; min: number; max: number
  step: number; val: number; onChange: (v: number) => void
}) {
  return (
    <div className="sfxr-param-row">
      <span className="sfxr-param-label">{label}</span>
      <input
        className="sfxr-slider"
        type="range" min={min} max={max} step={step} value={val}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <span className="sfxr-param-value">{display}</span>
    </div>
  )
}
