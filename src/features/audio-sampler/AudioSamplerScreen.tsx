import { useEffect, useRef, useState } from "react"
import "./AudioSamplerScreen.css"
import { Download, Gauge, Mic, Play, Square, Trash2, Upload } from "lucide-react"
import { AppDialog } from "../../app/components/AppDialog"
import type { AppViewMessages } from "../../app/appI18n"
import { type AudioCalibration } from "../../engine/audio/audioEngine"
import { NUM_SLOTS, DEFAULT_CALIBRATION, type SampleSlotMeta, loadSlotMetas, saveSlotMetas } from "../../engine/audio/sampleModel"
import { playSampleBuffer, type SamplePlayback } from "../../application/use-cases/playSampleBuffer"
import { importSampleFile } from "../../application/use-cases/importSampleFile"
import { loadSampleAudioBuffer } from "../../application/use-cases/loadSampleAudioBuffer"
import { deleteSampleSlot } from "../../application/use-cases/deleteSampleSlot"
import { exportSampleSlot } from "../../application/use-cases/exportSampleSlot"

const SEQ_SECONDS = 8

function formatDuration(seconds: number): string {
  return seconds < 10 ? `${seconds.toFixed(2)}s` : `${seconds.toFixed(1)}s`
}

function drawWaveformWithTrim(
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  trimStart: number,
  trimEnd: number,
) {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)

  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const W = rect.width
  const H = rect.height
  const data = audioBuffer.getChannelData(0)
  const step = Math.max(1, Math.floor(data.length / W))

  const accent =
    getComputedStyle(document.documentElement).getPropertyValue("--ui-color-accent").trim() || "#c95d54"

  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = accent + "22"
  ctx.fillRect(0, 0, W, H)

  // Waveform bars
  for (let x = 0; x < W; x++) {
    let min = 0
    let max = 0
    for (let i = 0; i < step; i++) {
      const s = data[x * step + i] ?? 0
      if (s < min) min = s
      if (s > max) max = s
    }
    const mid = H / 2
    const frac = x / W
    const inTrim = frac >= trimStart && frac <= trimEnd
    ctx.fillStyle = inTrim ? accent + "99" : accent + "33"
    ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid))
  }

  // Center line
  ctx.fillStyle = accent + "44"
  ctx.fillRect(0, H / 2, W, 1)

  // Dimmed overlay outside trim region
  ctx.fillStyle = "rgba(0,0,0,0.35)"
  const startX = trimStart * W
  const endX = trimEnd * W
  if (startX > 0) ctx.fillRect(0, 0, startX, H)
  if (endX < W) ctx.fillRect(endX, 0, W - endX, H)

  // Trim handles (vertical lines + grip)
  const HANDLE_W = 3
  ctx.fillStyle = accent
  ctx.fillRect(startX - 1, 0, HANDLE_W, H)
  ctx.fillRect(endX - 1, 0, HANDLE_W, H)

  // Small triangle markers at top
  ctx.fillStyle = accent
  for (const [hx, dir] of [[startX, 1], [endX, -1]] as [number, number][]) {
    ctx.beginPath()
    ctx.moveTo(hx, 0)
    ctx.lineTo(hx + dir * 10, 0)
    ctx.lineTo(hx, 10)
    ctx.closePath()
    ctx.fill()
  }
}

type AudioSamplerScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

type DragTrim = { handle: "start" | "end" }

export function AudioSamplerScreen({ copy, settingsOpen, onSettingsClose }: AudioSamplerScreenProps) {
  void copy

  type SamplerView = "editor" | "muestras" | "secuenciador"

  const [samplerView, setSamplerView] = useState<SamplerView>("editor")
  const [slots, setSlots] = useState<(SampleSlotMeta | null)[]>(loadSlotMetas)
  const [selectedIndex, setSelectedIndex] = useState(1)
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [renamingSlotIndex, setRenamingSlotIndex] = useState<number | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stopPlaybackRef = useRef<SamplePlayback | null>(null)
  const playTimerRef = useRef<number | null>(null)
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map())
  const dragTrimRef = useRef<DragTrim | null>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const playheadRafRef = useRef<number | null>(null)
  const playStartRef = useRef<number>(0)
  const playDurationRef = useRef<number>(0)

  const selectedSlot = slots[selectedIndex - 1] ?? null
  const calibration: AudioCalibration = selectedSlot?.calibration ?? { ...DEFAULT_CALIBRATION }

  function updateCalibration(patch: Partial<AudioCalibration>) {
    if (!selectedSlot) return
    const next = [...slots]
    next[selectedIndex - 1] = { ...selectedSlot, calibration: { ...calibration, ...patch } }
    setSlots(next)
    saveSlotMetas(next)

    // Aplica cambios de gain y tune en vivo durante la reproducción
    const pb = stopPlaybackRef.current
    if (pb) {
      if (patch.gain !== undefined) pb.setGain(patch.gain)
      if (patch.tune !== undefined) pb.setTune(patch.tune)
    }
  }

  // Cargar y decodificar buffer al cambiar slot seleccionado
  useEffect(() => {
    if (!selectedSlot) {
      setDecodedBuffer(null)
      return
    }
    const cached = bufferCacheRef.current.get(selectedSlot.dbId)
    if (cached) { setDecodedBuffer(cached); return }

    let cancelled = false
    setIsLoading(true)
    setDecodedBuffer(null)

    loadSampleAudioBuffer(selectedSlot.dbId)
      .then((buf) => {
        if (cancelled || !buf) return
        bufferCacheRef.current.set(selectedSlot.dbId, buf)
        setDecodedBuffer(buf)
      })
      .catch(() => { /* buffer dañado */ })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [selectedSlot?.dbId])

  // Dibujar waveform al cambiar buffer, trim, o al volver al tab Editor
  useEffect(() => {
    if (samplerView !== "editor" || !decodedBuffer) return
    const rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (canvas) drawWaveformWithTrim(canvas, decodedBuffer, calibration.trimStart, calibration.trimEnd)
    })
    return () => cancelAnimationFrame(rafId)
  }, [decodedBuffer, samplerView, calibration.trimStart, calibration.trimEnd])

  // Redibujar si el panel cambia de tamaño
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !decodedBuffer) return
    const ro = new ResizeObserver(() => {
      drawWaveformWithTrim(canvas, decodedBuffer, calibration.trimStart, calibration.trimEnd)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [decodedBuffer, samplerView, calibration.trimStart, calibration.trimEnd])

  function stopPlayhead() {
    if (playheadRafRef.current !== null) {
      cancelAnimationFrame(playheadRafRef.current)
      playheadRafRef.current = null
    }
    if (playheadRef.current) {
      playheadRef.current.style.display = "none"
    }
  }

  function startPlayhead(trimStart: number, trimEnd: number, durationMs: number) {
    stopPlayhead()
    const el = playheadRef.current
    if (!el) return
    el.style.display = "block"
    playStartRef.current = performance.now()
    playDurationRef.current = durationMs

    function tick() {
      if (!playheadRef.current) return
      const elapsed = performance.now() - playStartRef.current
      const frac = Math.min(elapsed / durationMs, 1)
      const pos = trimStart + frac * (trimEnd - trimStart)
      playheadRef.current.style.left = `${pos * 100}%`
      if (frac < 1) {
        playheadRafRef.current = requestAnimationFrame(tick)
      } else {
        stopPlayhead()
      }
    }

    playheadRafRef.current = requestAnimationFrame(tick)
  }

  function stopCurrent() {
    stopPlaybackRef.current?.stop()
    stopPlaybackRef.current = null
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current)
      playTimerRef.current = null
    }
    stopPlayhead()
    setIsPlaying(false)
  }

  function triggerBuffer(buf: AudioBuffer, cal?: AudioCalibration) {
    stopCurrent()
    const useCal = cal ?? calibration
    const playback = playSampleBuffer(buf, useCal)
    const durationMs = Math.max(playback.realDurationMs, 100)
    stopPlaybackRef.current = playback
    setIsPlaying(true)
    startPlayhead(useCal.trimStart, useCal.trimEnd, durationMs)
    playTimerRef.current = window.setTimeout(() => {
      stopPlaybackRef.current = null
      playTimerRef.current = null
      setIsPlaying(false)
    }, durationMs + 150)
  }

  function handleNormalize() {
    if (!decodedBuffer) return
    const data = decodedBuffer.getChannelData(0)
    let peak = 0
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i] ?? 0)
      if (abs > peak) peak = abs
    }
    if (peak < 0.0001) return
    updateCalibration({ gain: Math.min(1 / peak, 2) })
  }

  function updateSlots(next: (SampleSlotMeta | null)[]) {
    setSlots(next)
    saveSlotMetas(next)
  }

  async function handleImport(file: File) {
    setIsLoading(true)
    try {
      const data = await importSampleFile(file)

      const meta: SampleSlotMeta = {
        index: selectedIndex,
        name: data.name,
        duration: data.duration,
        dbId: data.dbId,
        sampleRate: data.sampleRate,
        channels: data.channels,
        calibration: { ...DEFAULT_CALIBRATION },
      }

      if (selectedSlot?.dbId) {
        bufferCacheRef.current.delete(selectedSlot.dbId)
        await deleteSampleSlot(selectedSlot.dbId)
      }

      bufferCacheRef.current.set(data.dbId, data.audioBuffer)
      const next = [...slots]
      next[selectedIndex - 1] = meta
      updateSlots(next)
      setDecodedBuffer(data.audioBuffer)
    } catch (e) {
      console.error("Error al importar audio:", e)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePlay() {
    if (isPlaying) { stopCurrent(); return }
    if (decodedBuffer) triggerBuffer(decodedBuffer)
  }

  async function handleDelete() {
    if (!selectedSlot) return
    stopCurrent()
    bufferCacheRef.current.delete(selectedSlot.dbId)
    await deleteSampleSlot(selectedSlot.dbId)
    const next = [...slots]
    next[selectedIndex - 1] = null
    updateSlots(next)
    setDecodedBuffer(null)
  }

  function handleSlotClick(index: number) {
    setRenamingSlotIndex(null)
    setSelectedIndex(index)
    const slot = slots[index - 1]
    if (!slot) return
    const buf = bufferCacheRef.current.get(slot.dbId)
    if (buf) triggerBuffer(buf)
  }

  function getCanvasFraction(e: React.MouseEvent<HTMLCanvasElement>): number {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!decodedBuffer) return
    const frac = getCanvasFraction(e)
    const distStart = Math.abs(frac - calibration.trimStart)
    const distEnd = Math.abs(frac - calibration.trimEnd)
    dragTrimRef.current = { handle: distStart < distEnd ? "start" : "end" }
    e.preventDefault()
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragTrimRef.current || !decodedBuffer) return
    const frac = getCanvasFraction(e)
    if (dragTrimRef.current.handle === "start") {
      const newStart = Math.min(frac, calibration.trimEnd - 0.01)
      updateCalibration({ trimStart: newStart })
    } else {
      const newEnd = Math.max(frac, calibration.trimStart + 0.01)
      updateCalibration({ trimEnd: newEnd })
    }
  }

  function handleCanvasMouseUp() {
    dragTrimRef.current = null
  }

  function handleRename(index: number, name: string) {
    const trimmed = name.trim()
    setRenamingSlotIndex(null)
    if (!trimmed) return
    const slot = slots[index - 1]
    if (!slot) return
    const next = [...slots]
    next[index - 1] = { ...slot, name: trimmed }
    updateSlots(next)
  }

  async function handleExport() {
    if (!decodedBuffer || !selectedSlot) return
    await exportSampleSlot(decodedBuffer, calibration, selectedSlot.name)
  }

  function resetCalibration(index: number) {
    const slot = slots[index - 1]
    if (!slot) return
    const next = [...slots]
    next[index - 1] = { ...slot, calibration: { ...DEFAULT_CALIBRATION } }
    setSlots(next)
    saveSlotMetas(next)
  }

  function resetAllCalibrations() {
    const next = slots.map(slot => slot ? { ...slot, calibration: { ...DEFAULT_CALIBRATION } } : null)
    setSlots(next)
    saveSlotMetas(next)
  }

  function handleSlotNav(dir: 1 | -1) {
    const filledIndices = slots
      .map((s, i) => (s ? i + 1 : null))
      .filter((i): i is number => i !== null)
    if (filledIndices.length === 0) return
    const pos = filledIndices.indexOf(selectedIndex)
    const next = pos + dir
    const wrapped = ((next % filledIndices.length) + filledIndices.length) % filledIndices.length
    setSelectedIndex(filledIndices[wrapped])
  }

  const filledCount = slots.filter(Boolean).length

  return (
    <>
      <section className="app-mock-screen audio-sampler-screen" aria-label="Sampler de audio">

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <header className="app-mock-toolbar">
          <div className="app-mock-toolbar-controls">

            {/* Switch de vista */}
            <div className="edit-view-switch" role="group" aria-label="Vista del sampler">
              <button aria-pressed={samplerView === "muestras"} onClick={() => setSamplerView("muestras")} type="button">MUESTRAS</button>
              <button aria-pressed={samplerView === "editor"} onClick={() => setSamplerView("editor")} type="button">EDITOR</button>
              <button aria-pressed={samplerView === "secuenciador"} onClick={() => setSamplerView("secuenciador")} type="button">SECUENCIADOR</button>
            </div>

            {/* TRIM — solo visible en Editor con audio */}
            {samplerView === "editor" && decodedBuffer && selectedSlot && (
              <span className="audio-sampler-toolbar-trim">
                TRIM&nbsp;
                <span className="audio-sampler-toolbar-trim-val">
                  {(calibration.trimStart * selectedSlot.duration).toFixed(2)}s
                  {" — "}
                  {(calibration.trimEnd * selectedSlot.duration).toFixed(2)}s
                </span>
              </span>
            )}

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            <button
              aria-label={isPlaying ? "Detener" : "Reproducir"}
              className="ui-icon-btn"
              disabled={!decodedBuffer || isLoading}
              onClick={handlePlay}
              title={isPlaying ? "Detener" : "Reproducir"}
              type="button"
            >
              {isPlaying ? <Square size={18} /> : <Play size={18} />}
            </button>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            <input
              accept="audio/*"
              className="audio-sampler-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
                e.target.value = ""
              }}
              ref={fileInputRef}
              type="file"
            />
            {samplerView === "muestras" && (
              <button
                className="ui-icon-btn"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                title="Importar archivo de audio"
                type="button"
              >
                <Upload size={18} />
              </button>
            )}
            <button
              className="ui-icon-btn"
              disabled={!decodedBuffer || isLoading}
              onClick={() => void handleExport()}
              title="Descargar sample con calibración aplicada"
              type="button"
            >
              <Download size={18} />
            </button>
            <button
              className="ui-icon-btn"
              disabled={!selectedSlot || isLoading}
              onClick={() => void handleDelete()}
              title="Eliminar sample"
              type="button"
            >
              <Trash2 size={18} />
            </button>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Selector de slot — solo slots ocupados */}
            {filledCount > 0 && selectedSlot && (
              <div className="audio-sampler-slot-nav">
                <button
                  className="audio-sampler-slot-nav-btn"
                  disabled={filledCount <= 1}
                  onClick={() => handleSlotNav(-1)}
                  type="button"
                  aria-label="Slot anterior"
                >◄</button>
                <span className="audio-sampler-slot-nav-label">
                  <span className="audio-sampler-slot-nav-num">{selectedIndex}</span>
                  <span className="audio-sampler-slot-nav-name">{selectedSlot.name}</span>
                </span>
                <button
                  className="audio-sampler-slot-nav-btn"
                  disabled={filledCount <= 1}
                  onClick={() => handleSlotNav(1)}
                  type="button"
                  aria-label="Slot siguiente"
                >►</button>
              </div>
            )}
          </div>
        </header>

        <div className="audio-sampler-body">

          {/* ── Panel 1: Editor ─────────────────────────────────────── */}
          {samplerView === "editor" && (
            <div className="audio-sampler-panel audio-sampler-panel-editor">
              <span className="audio-sampler-panel-label">EDITOR</span>

              <div className="audio-sampler-editor-body">

                {/* Waveform — 2/3 del ancho */}
                <div
                  className={`audio-sampler-waveform-area${isLoading ? " audio-sampler-waveform-loading" : ""}`}
                >
                  {decodedBuffer ? (
                    <>
                      <canvas
                        className="audio-sampler-canvas audio-sampler-canvas-trim"
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                      <div className="audio-sampler-playhead" ref={playheadRef} />
                    </>
                  ) : (
                    <div className="audio-sampler-waveform-empty">
                      <Mic size={28} />
                      <span>{isLoading ? "Cargando…" : "Sin audio"}</span>
                      {!isLoading && (
                        <span className="audio-sampler-waveform-hint">
                          Selecciona un slot e importa un archivo de audio
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Panel lateral de calibración — 1/3 del ancho */}
                <div className="audio-sampler-cal-panel">
                  {decodedBuffer && selectedSlot ? (
                    <>
                      {/* Gain + Normalize */}
                      <div className="audio-sampler-cal-row audio-sampler-cal-row-slider">
                        <div className="audio-sampler-cal-row-header">
                          <span className="audio-sampler-cal-row-label">GAIN</span>
                          <span className="audio-sampler-cal-row-value">{Math.round(calibration.gain * 100)}%</span>
                        </div>
                        <div className="audio-sampler-cal-gain-row">
                          <input
                            className="audio-sampler-cal-slider-full audio-sampler-cal-slider-gain"
                            max={200} min={0} step={1}
                            type="range"
                            value={Math.round(calibration.gain * 100)}
                            onChange={(e) => updateCalibration({ gain: Number(e.target.value) / 100 })}
                          />
                          <button
                            className="audio-sampler-cal-btn audio-sampler-cal-btn-norm"
                            onClick={handleNormalize}
                            title="Normalizar — ajusta la ganancia al pico máximo"
                            type="button"
                          ><Gauge size={18} /></button>
                        </div>
                      </div>

                      <div className="audio-sampler-cal-divider" />

                      {/* Fade In */}
                      <div className="audio-sampler-cal-row audio-sampler-cal-row-slider">
                        <div className="audio-sampler-cal-row-header">
                          <span className="audio-sampler-cal-row-label">FADE IN</span>
                          <span className="audio-sampler-cal-row-value">{calibration.fadeIn.toFixed(2)}s</span>
                        </div>
                        <input
                          className="audio-sampler-cal-slider-full"
                          max={Math.min(2, selectedSlot.duration * 0.5).toFixed(2)}
                          min={0} step={0.01}
                          type="range"
                          value={calibration.fadeIn}
                          onChange={(e) => updateCalibration({ fadeIn: Number(e.target.value) })}
                        />
                      </div>

                      {/* Fade Out */}
                      <div className="audio-sampler-cal-row audio-sampler-cal-row-slider">
                        <div className="audio-sampler-cal-row-header">
                          <span className="audio-sampler-cal-row-label">FADE OUT</span>
                          <span className="audio-sampler-cal-row-value">{calibration.fadeOut.toFixed(2)}s</span>
                        </div>
                        <input
                          className="audio-sampler-cal-slider-full"
                          max={Math.min(2, selectedSlot.duration * 0.5).toFixed(2)}
                          min={0} step={0.01}
                          type="range"
                          value={calibration.fadeOut}
                          onChange={(e) => updateCalibration({ fadeOut: Number(e.target.value) })}
                        />
                      </div>

                      <div className="audio-sampler-cal-divider" />

                      {/* Tune */}
                      <div className="audio-sampler-cal-row audio-sampler-cal-row-slider">
                        <div className="audio-sampler-cal-row-header">
                          <span className="audio-sampler-cal-row-label">TUNE</span>
                          <span className="audio-sampler-cal-row-value">
                            {calibration.tune > 0 ? "+" : ""}{calibration.tune} st
                          </span>
                        </div>
                        <input
                          className="audio-sampler-cal-slider-full"
                          max={24} min={-24} step={1}
                          type="range"
                          value={calibration.tune}
                          onChange={(e) => updateCalibration({ tune: Number(e.target.value) })}
                        />
                        <div className="audio-sampler-cal-tune-hints">
                          <span>−24</span>
                          <span>0</span>
                          <span>+24</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="audio-sampler-cal-empty">
                      <span>Sin muestra</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── Panel 2: Muestras ──────────────────────────────────── */}
          {samplerView === "muestras" && <div className="audio-sampler-panel audio-sampler-panel-slots">
            <span className="audio-sampler-panel-label">MUESTRAS</span>
            <div className="audio-sampler-slots">
              {Array.from({ length: NUM_SLOTS }, (_, i) => {
                const index = i + 1
                const slot = slots[i] ?? null
                const isActive = selectedIndex === index
                const isRenaming = renamingSlotIndex === index
                return (
                  <div
                    key={index}
                    className={[
                      "audio-sampler-slot",
                      isActive ? "audio-sampler-slot-active" : "",
                      slot ? "audio-sampler-slot-filled" : "",
                    ].join(" ").trim()}
                    onClick={() => handleSlotClick(index)}
                  >
                    <span className="audio-sampler-slot-num">{index}</span>
                    {isRenaming && slot ? (
                      <input
                        autoFocus
                        className="audio-sampler-slot-rename-input"
                        defaultValue={slot.name}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => handleRename(index, e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter") handleRename(index, (e.target as HTMLInputElement).value)
                          if (e.key === "Escape") setRenamingSlotIndex(null)
                        }}
                        type="text"
                      />
                    ) : (
                      <span
                        className="audio-sampler-slot-name"
                        onDoubleClick={(e) => { if (slot) { e.stopPropagation(); setRenamingSlotIndex(index) } }}
                        title={slot ? "Doble clic para renombrar" : undefined}
                      >
                        {slot?.name ?? `Slot ${index}`}
                      </span>
                    )}
                    {slot
                      ? <span className="audio-sampler-slot-duration">{formatDuration(slot.duration)}</span>
                      : <span className="audio-sampler-slot-empty">—</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>}

          {/* ── Panel 3: Secuenciador ──────────────────────────────── */}
          {samplerView === "secuenciador" && <div className="audio-sampler-panel audio-sampler-panel-sequencer">
            <span className="audio-sampler-panel-label">SECUENCIADOR</span>
            <div className="audio-sampler-sequencer">
              {filledCount > 0 ? (
                <>
                  <div className="audio-sampler-seq-ruler">
                    {Array.from({ length: SEQ_SECONDS + 1 }, (_, i) => (
                      <span key={i} className="audio-sampler-seq-ruler-mark">{i}s</span>
                    ))}
                  </div>
                  {slots.map((slot, i) =>
                    slot ? (
                      <div key={slot.dbId} className="audio-sampler-seq-lane">
                        <span className="audio-sampler-seq-lane-label">{slot.name}</span>
                        <div className="audio-sampler-seq-lane-track" />
                      </div>
                    ) : null
                  )}
                </>
              ) : (
                <div className="audio-sampler-seq-empty">
                  <span>Sin muestras cargadas</span>
                  <span className="audio-sampler-waveform-hint">
                    Importa un archivo de audio para empezar
                  </span>
                </div>
              )}
            </div>
          </div>}

        </div>
      </section>

      <AppDialog
        description="Calibración y detalles de cada slot."
        onClose={onSettingsClose}
        open={settingsOpen}
        title="Opciones — Sampler"
      >
        <div className="audio-sampler-settings">
          <section className="ui-list-section">
            <span className="ui-list-section-title">RESUMEN</span>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">S</span>
              <span className="ui-list-label">Slots ocupados</span>
              <span className="ui-list-value">{filledCount} / {NUM_SLOTS}</span>
            </div>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">↺</span>
              <span className="ui-list-label">Restablecer todo</span>
              <button
                className="audio-sampler-cal-btn"
                disabled={filledCount === 0}
                onClick={resetAllCalibrations}
                title="Restablece la calibración de todos los slots al valor por defecto"
                type="button"
              >Reset todo</button>
            </div>
          </section>
          {slots.map((slot, i) =>
            slot ? (
              <section className="ui-list-section" key={slot.dbId}>
                <span className="ui-list-section-title">SLOT {i + 1} — {slot.name}</span>
                <div className="ui-list-row ui-list-row-static">
                  <span className="ui-list-icon">D</span>
                  <span className="ui-list-label">Duración original</span>
                  <span className="ui-list-value">{formatDuration(slot.duration)}</span>
                </div>
                <div className="ui-list-row ui-list-row-static">
                  <span className="ui-list-icon">T</span>
                  <span className="ui-list-label">Trim</span>
                  <span className="ui-list-value">
                    {(slot.calibration.trimStart * slot.duration).toFixed(2)}s — {(slot.calibration.trimEnd * slot.duration).toFixed(2)}s
                  </span>
                </div>
                <div className="ui-list-row ui-list-row-static">
                  <span className="ui-list-icon">G</span>
                  <span className="ui-list-label">Gain</span>
                  <span className="ui-list-value">{Math.round(slot.calibration.gain * 100)}%</span>
                </div>
                <div className="ui-list-row ui-list-row-static">
                  <span className="ui-list-icon">F</span>
                  <span className="ui-list-label">Fade In / Out</span>
                  <span className="ui-list-value">
                    {slot.calibration.fadeIn.toFixed(2)}s / {slot.calibration.fadeOut.toFixed(2)}s
                  </span>
                </div>
                <div className="ui-list-row ui-list-row-static">
                  <span className="ui-list-icon">♪</span>
                  <span className="ui-list-label">Tune</span>
                  <span className="ui-list-value">
                    {slot.calibration.tune > 0 ? "+" : ""}{slot.calibration.tune} st
                  </span>
                </div>
                <div className="ui-list-row ui-list-row-static">
                  <span className="ui-list-icon">↺</span>
                  <span className="ui-list-label">Calibración</span>
                  <button
                    className="audio-sampler-cal-btn"
                    onClick={() => resetCalibration(i + 1)}
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </section>
            ) : null
          )}
        </div>
      </AppDialog>
    </>
  )
}
