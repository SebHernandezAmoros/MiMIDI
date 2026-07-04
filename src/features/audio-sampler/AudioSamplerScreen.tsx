import { useEffect, useRef, useState } from "react"
import "./AudioSamplerScreen.css"
import { Download, Eraser, Gauge, ListPlus, Mic, Play, RotateCcw, Square, Trash2, Upload } from "lucide-react"
import { AppDialog } from "../../app/components/AppDialog"
import { resolveAppMessages, tpl, type AppViewMessages, type AppLanguage } from "../../app/appI18n"
import type { AudioCalibration } from "../../engine/audio/audioTypes"
import { getAudioCurrentTime, playAudioBufferLooping } from "../../engine/audio/audioEngine"
import {
  DEFAULT_SAMPLE_CALIBRATION,
  NUM_SAMPLE_SLOTS,
  type SampleSlotMeta,
} from "../../application/ports/SampleSlotRepository"
import { loadSampleSlots, saveSampleSlots } from "../../application/use-cases/sampleSlots"
import { SEQ_DEFAULT_BPM, type SequencerPattern, syncPatternLanes, resizePatternSteps, saveSeqPattern, loadSeqPattern } from "../../engine/audio/sequencerModel"
import { playSampleBuffer, type SamplePlayback } from "../../application/use-cases/playSampleBuffer"
import { importSampleFile, type ImportedSampleData } from "../../application/use-cases/importSampleFile"
import { RecordMicModal } from "./RecordMicModal"
import { loadSampleAudioBuffer } from "../../application/use-cases/loadSampleAudioBuffer"
import { deleteSampleSlot } from "../../application/use-cases/deleteSampleSlot"
import { exportSampleSlot } from "../../application/use-cases/exportSampleSlot"
import { exportSeqMix } from "../../application/use-cases/exportSeqMix"
import { playSequencerStep } from "../../application/use-cases/playSequencerStep"
import { sendSamplerMixToTimeline } from "../../application/use-cases/sendSamplerMixToTimeline"

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

  // Lee el color del canvas para respetar el tema oscuro/claro correctamente
  const accent =
    getComputedStyle(canvas).getPropertyValue("--ui-color-accent").trim() || "#c82828"

  ctx.clearRect(0, 0, W, H)

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
    ctx.fillStyle = inTrim ? accent + "cc" : accent + "55"
    ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid))
  }

  // Center line
  ctx.fillStyle = accent + "55"
  ctx.fillRect(0, H / 2, W, 1)

  // Dimmed overlay outside trim region
  ctx.fillStyle = "rgba(0,0,0,0.45)"
  const startX = trimStart * W
  const endX = trimEnd * W
  if (startX > 0) ctx.fillRect(0, 0, startX, H)
  if (endX < W) ctx.fillRect(endX, 0, W - endX, H)

  // Trim handles — barra + triángulo + grip pill (zona táctil visible)
  const HANDLE_W = 4
  ctx.fillStyle = accent
  ctx.fillRect(startX - HANDLE_W / 2, 0, HANDLE_W, H)
  ctx.fillRect(endX - HANDLE_W / 2, 0, HANDLE_W, H)

  // Triangles at top (más grandes para mobile)
  for (const [hx, dir] of [[startX, 1], [endX, -1]] as [number, number][]) {
    ctx.beginPath()
    ctx.moveTo(hx, 0)
    ctx.lineTo(hx + dir * 18, 0)
    ctx.lineTo(hx, 18)
    ctx.closePath()
    ctx.fill()
  }

  // Grip pill centrado en cada handle
  const PILL_W = 10
  const PILL_H = 28
  const pillY = H / 2 - PILL_H / 2
  ctx.fillStyle = "#ffffff"
  for (const hx of [startX, endX]) {
    ctx.fillRect(hx - PILL_W / 2, pillY, PILL_W, PILL_H)
    // tres líneas de grip internas
    ctx.fillStyle = accent
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(hx - 3, pillY + 7 + i * 7, 6, 1.5)
    }
    ctx.fillStyle = "#ffffff"
  }
}

type AudioSamplerScreenProps = {
  copy: AppViewMessages
  language?: AppLanguage
  settingsOpen: boolean
  onSettingsClose: () => void
}

type DragTrim = { handle: "start" | "end" }

export function AudioSamplerScreen({ copy, language, settingsOpen, onSettingsClose }: AudioSamplerScreenProps) {
  void copy
  const t = resolveAppMessages(language ?? "es").lab.sampler
  const tc = resolveAppMessages(language ?? "es").lab.common

  type SamplerView = "editor" | "muestras" | "secuenciador"

  function getTabFromUrl(): SamplerView {
    const tab = new URLSearchParams(window.location.search).get("tab")
    if (tab === "editor" || tab === "secuenciador") return tab
    return "muestras"
  }

  const [samplerView, setSamplerView] = useState<SamplerView>(getTabFromUrl)

  useEffect(() => {
    function syncTab() {
      setSamplerView(getTabFromUrl())
    }
    window.addEventListener("popstate", syncTab)
    return () => window.removeEventListener("popstate", syncTab)
  }, [])

  const [slots, setSlots] = useState<(SampleSlotMeta | null)[]>(loadSampleSlots)

  useEffect(() => {
    function onStorageChange(e: StorageEvent) {
      if (e.key === "mimidi-audio-slots") setSlots(loadSampleSlots())
    }
    window.addEventListener("storage", onStorageChange)
    return () => window.removeEventListener("storage", onStorageChange)
  }, [])
  const [selectedIndex, setSelectedIndex] = useState(1)
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordMicOpen, setRecordMicOpen] = useState(false)
  const [seqExportOpen, setSeqExportOpen] = useState(false)
  const [seqExportName, setSeqExportName] = useState("")
  const [seqSendOpen, setSeqSendOpen] = useState(false)
  const [seqSendName, setSeqSendName] = useState("")

  // Sequencer state
  const [seqPattern, setSeqPattern] = useState<SequencerPattern>(() =>
    syncPatternLanes(loadSeqPattern(), loadSampleSlots()),
  )
  const [seqIsPlaying, setSeqIsPlaying] = useState(false)
  const [seqCurrentStep, setSeqCurrentStep] = useState(-1)

  const [activeTrimHandle, setActiveTrimHandle] = useState<"start" | "end" | null>(null)

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

  // Sequencer refs (mutable, never cause re-renders)
  const seqPatternRef = useRef(seqPattern)
  const seqCurrentStepRef = useRef(0)
  const seqNextStepTimeRef = useRef(0)
  const seqSchedulerRef = useRef<number | null>(null)
  const seqIsPlayingRef = useRef(false)
  const slotsRef = useRef(slots)
  const seqTickRef = useRef<(() => void) | null>(null)
  // Looping sources for stepsPerBar=1 mode (native Web Audio loop)
  const seqLoopSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map())

  const selectedSlot = slots[selectedIndex - 1] ?? null
  const calibration: AudioCalibration = selectedSlot?.calibration ?? { ...DEFAULT_SAMPLE_CALIBRATION }

  function updateCalibration(patch: Partial<AudioCalibration>) {
    if (!selectedSlot) return
    const next = [...slots]
    next[selectedIndex - 1] = { ...selectedSlot, calibration: { ...calibration, ...patch } }
    setSlots(next)
    saveSampleSlots(next)

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    saveSampleSlots(next)
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
        calibration: { ...DEFAULT_SAMPLE_CALIBRATION },
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

  async function handleMicSave(data: ImportedSampleData) {
    setIsLoading(true)
    try {
      const meta: SampleSlotMeta = {
        index: selectedIndex,
        name: data.name,
        duration: data.duration,
        dbId: data.dbId,
        sampleRate: data.sampleRate,
        channels: data.channels,
        calibration: { ...DEFAULT_SAMPLE_CALIBRATION },
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
    setSelectedIndex(index)
    const slot = slots[index - 1]
    if (!slot) return
    const buf = bufferCacheRef.current.get(slot.dbId)
    if (buf) triggerBuffer(buf, slot.calibration)
  }

  function getCanvasFraction(e: React.PointerEvent<HTMLCanvasElement>): number {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!decodedBuffer) return
    e.preventDefault()
    const frac = getCanvasFraction(e)

    // Modo de tap-para-fijar punto de trim (activado desde toolbar)
    if (activeTrimHandle !== null) {
      if (activeTrimHandle === "start") {
        updateCalibration({ trimStart: Math.min(frac, calibration.trimEnd - 0.01) })
      } else {
        updateCalibration({ trimEnd: Math.max(frac, calibration.trimStart + 0.01) })
      }
      return
    }

    // Zona de agarre: 28px en cada lado del handle (evita mover trim con taps accidentales)
    const rect = e.currentTarget.getBoundingClientRect()
    const GRAB_FRAC = 28 / rect.width
    const distStart = Math.abs(frac - calibration.trimStart)
    const distEnd = Math.abs(frac - calibration.trimEnd)
    const nearestDist = Math.min(distStart, distEnd)
    if (nearestDist > GRAB_FRAC) return

    e.currentTarget.setPointerCapture(e.pointerId)
    dragTrimRef.current = { handle: distStart < distEnd ? "start" : "end" }
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
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

  function handleCanvasPointerUp() {
    dragTrimRef.current = null
  }

  function handleRename(index: number, name: string) {
    const trimmed = name.trim()
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
    next[index - 1] = { ...slot, calibration: { ...DEFAULT_SAMPLE_CALIBRATION } }
    setSlots(next)
    saveSampleSlots(next)
  }

  function resetAllCalibrations() {
    const next = slots.map(slot => slot ? { ...slot, calibration: { ...DEFAULT_SAMPLE_CALIBRATION } } : null)
    setSlots(next)
    saveSampleSlots(next)
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

  // ── Sequencer: sync refs ────────────────────────────────────────────
  useEffect(() => { slotsRef.current = slots }, [slots])

  // Sync pattern lanes when slots are added/removed
  const slotIds = slots.map(s => s?.dbId ?? "").join(",")
  useEffect(() => {
    const synced = syncPatternLanes(seqPatternRef.current, slots)
    seqPatternRef.current = synced
    setSeqPattern(synced)
    saveSeqPattern(synced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotIds])

  // Cleanup scheduler on unmount
  useEffect(() => {
    return () => {
      if (seqSchedulerRef.current !== null) clearTimeout(seqSchedulerRef.current)
    }
  }, [])

  // ── Sequencer: tick (always latest via ref) ─────────────────────────
  // useEffect sin deps = se ejecuta después de cada render, manteniendo el closure siempre actualizado
  useEffect(() => {
    seqTickRef.current = () => {
      const now = getAudioCurrentTime()
      const pattern = seqPatternRef.current
      const secondsPerStep = 60 / pattern.bpm / 4

      while (seqNextStepTimeRef.current < now + 0.1) {
        const step = seqCurrentStepRef.current

        if (pattern.stepsPerBar === 1) {
          // Modo 1-paso: loop nativo por Web Audio (sample-accurate, sin gaps)
          pattern.lanes.forEach(lane => {
            if (!lane.steps[0]?.active) return
            if (seqLoopSourcesRef.current.has(lane.slotDbId)) return
            const slot = slotsRef.current.find(s => s?.dbId === lane.slotDbId)
            if (!slot) return
            const buf = bufferCacheRef.current.get(lane.slotDbId)
            if (!buf) return
            const src = playAudioBufferLooping(buf, slot.calibration, seqNextStepTimeRef.current)
            seqLoopSourcesRef.current.set(lane.slotDbId, src)
          })
        } else {
          pattern.lanes.forEach(lane => {
            if (!lane.steps[step]?.active) return
            const slot = slotsRef.current.find(s => s?.dbId === lane.slotDbId)
            if (!slot) return
            const buf = bufferCacheRef.current.get(lane.slotDbId)
            if (!buf) return
            playSequencerStep(buf, slot.calibration, seqNextStepTimeRef.current)
          })
        }

        const fireTime = seqNextStepTimeRef.current
        const delay = Math.max(0, (fireTime - now) * 1000)
        const capturedStep = step
        setTimeout(() => {
          if (seqIsPlayingRef.current) setSeqCurrentStep(capturedStep)
        }, delay)

        seqCurrentStepRef.current = (step + 1) % pattern.stepsPerBar
        seqNextStepTimeRef.current += secondsPerStep
      }

      seqSchedulerRef.current = window.setTimeout(() => seqTickRef.current?.(), 25)
    }
  })

  function stopLoopSources() {
    seqLoopSourcesRef.current.forEach(src => {
      try { src.stop() } catch { /* already stopped */ }
    })
    seqLoopSourcesRef.current.clear()
  }

  async function startSeq() {
    stopLoopSources()
    // Con 1 paso, recalcula el BPM desde la calibración actual antes de reproducir
    if (seqPatternRef.current.stepsPerBar === 1) {
      const freshBpm = calcOneShotBpm()
      const refreshed = { ...seqPatternRef.current, bpm: freshBpm }
      seqPatternRef.current = refreshed
      setSeqPattern(refreshed)
      saveSeqPattern(refreshed)
    }
    // Pre-cargar buffers que falten en caché antes de iniciar el tick
    for (const lane of seqPatternRef.current.lanes) {
      if (!bufferCacheRef.current.has(lane.slotDbId)) {
        const buf = await loadSampleAudioBuffer(lane.slotDbId)
        if (buf) bufferCacheRef.current.set(lane.slotDbId, buf)
      }
    }
    seqCurrentStepRef.current = 0
    seqNextStepTimeRef.current = getAudioCurrentTime()
    seqIsPlayingRef.current = true
    setSeqIsPlaying(true)
    setSeqCurrentStep(-1)
    seqTickRef.current?.()
  }

  function stopSeq() {
    if (seqSchedulerRef.current !== null) {
      clearTimeout(seqSchedulerRef.current)
      seqSchedulerRef.current = null
    }
    stopLoopSources()
    seqIsPlayingRef.current = false
    setSeqIsPlaying(false)
    setSeqCurrentStep(-1)
  }

  function toggleSeqStep(laneIdx: number, stepIdx: number) {
    const next: SequencerPattern = {
      ...seqPattern,
      lanes: seqPattern.lanes.map((lane, li) =>
        li !== laneIdx ? lane : {
          ...lane,
          steps: lane.steps.map((step, si) =>
            si !== stepIdx ? step : { active: !step.active },
          ),
        },
      ),
    }
    seqPatternRef.current = next
    setSeqPattern(next)
    saveSeqPattern(next)
  }

  function updateSeqBpm(bpm: number) {
    const next = { ...seqPattern, bpm: Math.min(240, Math.max(0.1, bpm)) }
    seqPatternRef.current = next
    setSeqPattern(next)
    saveSeqPattern(next)
  }

  // BPM derivado de la duración efectiva (trim + tune) de todos los slots cargados
  function calcOneShotBpm(): number {
    const maxDuration = slots.filter(Boolean).reduce((max, s) => {
      const cal = s!.calibration
      const trimFraction = Math.max(0.001, cal.trimEnd - cal.trimStart)
      const playbackRate = Math.pow(2, cal.tune / 12)
      return Math.max(max, s!.duration * trimFraction / playbackRate)
    }, 0)
    return maxDuration > 0 ? Math.max(0.1, 60 / (maxDuration * 4)) : seqPattern.bpm
  }

  function updateSeqSteps(stepsPerBar: number) {
    let bpm = seqPattern.bpm
    if (stepsPerBar === 1) {
      bpm = calcOneShotBpm()
    } else if (seqPattern.stepsPerBar === 1 && bpm < 40) {
      bpm = 120
    }
    const next = resizePatternSteps({ ...seqPattern, bpm }, stepsPerBar)
    seqPatternRef.current = next
    setSeqPattern(next)
    saveSeqPattern(next)
  }

  function sendMixToTimeline(name: string) {
    // Con 1 paso, recalcula siempre el BPM desde la calibración actual antes de guardar
    const pattern = seqPattern.stepsPerBar === 1
      ? { ...seqPattern, bpm: calcOneShotBpm() }
      : seqPattern
    sendSamplerMixToTimeline(pattern, name)
  }

  function clearSeqPattern() {
    const next: SequencerPattern = {
      ...seqPattern,
      lanes: seqPattern.lanes.map(lane => ({
        ...lane,
        steps: lane.steps.map(() => ({ active: false })),
      })),
    }
    seqPatternRef.current = next
    setSeqPattern(next)
    saveSeqPattern(next)
  }

  return (
    <>
      <section className="app-mock-screen audio-sampler-screen" aria-label={t.screenLabel}>

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <header className="app-mock-toolbar">
          <div className="app-mock-toolbar-controls">

            {/* Switch de vista */}
            <div className="ui-toggle-group" data-tutorial="sampler-view-tabs" role="group" aria-label={t.viewLabel}>
              <button aria-pressed={samplerView === "muestras"} data-tutorial="sampler-muestras-tab" onClick={() => setSamplerView("muestras")} type="button">{t.tabSamples}</button>
              <button aria-pressed={samplerView === "editor"} data-tutorial="sampler-editor-tab" onClick={() => setSamplerView("editor")} type="button">{t.tabEditor}</button>
              <button aria-pressed={samplerView === "secuenciador"} data-tutorial="sampler-seq-tab" onClick={() => setSamplerView("secuenciador")} type="button">{t.tabSequencer}</button>
            </div>

            {/* Slot navigator — qué estás editando (editor + muestras) */}
            {samplerView !== "secuenciador" && filledCount > 0 && selectedSlot && activeTrimHandle === null && (
              <>
                <div className="audio-sampler-slot-nav">
                  <button
                    className="audio-sampler-slot-nav-btn"
                    disabled={filledCount <= 1}
                    onClick={() => handleSlotNav(-1)}
                    type="button"
                    aria-label={t.prevSlot}
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
                    aria-label={t.nextSlot}
                  >►</button>
                </div>
                <span aria-hidden="true" className="perform-mode-transport-divider" />
              </>
            )}

            {/* TRIM — solo visible en Editor con audio */}
            {samplerView === "editor" && decodedBuffer && selectedSlot && (
              <>
                <span className="audio-sampler-toolbar-trim">
                  {activeTrimHandle !== "end" && (
                    <button
                      aria-pressed={activeTrimHandle === "start"}
                      className={`audio-sampler-trim-btn${activeTrimHandle === "start" ? " active" : ""}`}
                      onClick={() => setActiveTrimHandle(activeTrimHandle === "start" ? null : "start")}
                      title={t.cropStartHint}
                      type="button"
                    >
                      {t.cropStart}
                    </button>
                  )}
                  {activeTrimHandle !== null && (
                    <span className="audio-sampler-toolbar-trim-val">
                      {activeTrimHandle === "start"
                        ? `${(calibration.trimStart * selectedSlot.duration).toFixed(2)}s`
                        : `${(calibration.trimEnd * selectedSlot.duration).toFixed(2)}s`}
                    </span>
                  )}
                  {activeTrimHandle !== "start" && (
                    <button
                      aria-pressed={activeTrimHandle === "end"}
                      className={`audio-sampler-trim-btn${activeTrimHandle === "end" ? " active" : ""}`}
                      onClick={() => setActiveTrimHandle(activeTrimHandle === "end" ? null : "end")}
                      title={t.cropEndHint}
                      type="button"
                    >
                      {t.cropEnd}
                    </button>
                  )}
                </span>
                <span aria-hidden="true" className="perform-mode-transport-divider" />
              </>
            )}

            {samplerView !== "secuenciador" && (
              <button
                aria-label={isPlaying ? tc.stop : tc.play}
                className="ui-icon-btn"
                disabled={!decodedBuffer || isLoading}
                onClick={handlePlay}
                title={isPlaying ? tc.stop : tc.play}
                type="button"
              >
                {isPlaying ? <Square size={18} /> : <Play size={18} />}
              </button>
            )}
            {samplerView === "secuenciador" && (
              <>
                <button
                  aria-label={seqIsPlaying ? t.stopSeq : t.playSeq}
                  className="ui-icon-btn"
                  data-tutorial="seq-play-button"
                  disabled={seqPattern.lanes.length === 0}
                  onClick={seqIsPlaying ? stopSeq : startSeq}
                  title={seqIsPlaying ? t.stopSeq : t.playSeq}
                  type="button"
                >
                  {seqIsPlaying ? <Square size={18} /> : <Play size={18} />}
                </button>
                <button
                  className="ui-icon-btn"
                  data-tutorial="seq-clear-button"
                  disabled={seqPattern.lanes.length === 0}
                  onClick={clearSeqPattern}
                  title={t.clearSteps}
                  type="button"
                >
                  <Eraser size={18} />
                </button>

                <span aria-hidden="true" className="perform-mode-transport-divider" />
                <button
                  className="ui-icon-btn"
                  disabled={seqPattern.lanes.length === 0 || seqIsPlaying}
                  onClick={() => { setSeqExportName(`mimidi-mix-${seqPattern.bpm}bpm`); setSeqExportOpen(true) }}
                  title={t.downloadMix}
                  type="button"
                >
                  <Download size={18} />
                </button>
                <button
                  className="ui-icon-btn"
                  data-tutorial="send-to-timeline-button"
                  disabled={seqPattern.lanes.length === 0 || seqIsPlaying}
                  onClick={() => { setSeqSendName(""); setSeqSendOpen(true) }}
                  title={t.sendToTimeline}
                  type="button"
                >
                  <ListPlus size={18} />
                </button>
                <span aria-hidden="true" className="perform-mode-transport-divider" />

                {/* BPM */}
                <div className="audio-sampler-seq-ctrl-group" data-tutorial="seq-bpm-ctrl">
                  <span className="audio-sampler-seq-ctrl-label">BPM</span>
                  <button className="audio-sampler-seq-small-btn" onClick={() => updateSeqBpm(seqPattern.bpm - (seqPattern.bpm < 10 ? 0.1 : 1))} type="button">−</button>
                  <span className="audio-sampler-seq-bpm-val">{seqPattern.bpm < 10 ? seqPattern.bpm.toFixed(2) : Math.round(seqPattern.bpm)}</span>
                  <button className="audio-sampler-seq-small-btn" onClick={() => updateSeqBpm(seqPattern.bpm + (seqPattern.bpm < 10 ? 0.1 : 1))} type="button">+</button>
                </div>

                <span aria-hidden="true" className="perform-mode-transport-divider" />

                {/* Número de pasos */}
                <div className="audio-sampler-seq-ctrl-group" data-tutorial="seq-steps-ctrl">
                  <span className="audio-sampler-seq-ctrl-label">{t.stepsLabel}</span>
                  <button
                    className={`audio-sampler-seq-small-btn${seqPattern.stepsPerBar === 16 ? " audio-sampler-seq-small-btn-on" : ""}`}
                    onClick={() => updateSeqSteps(16)}
                    type="button"
                  >16</button>
                  <button
                    className={`audio-sampler-seq-small-btn${seqPattern.stepsPerBar === 32 ? " audio-sampler-seq-small-btn-on" : ""}`}
                    onClick={() => updateSeqSteps(32)}
                    type="button"
                  >32</button>
                </div>
              </>
            )}

            {samplerView !== "secuenciador" && (
              <span aria-hidden="true" className="perform-mode-transport-divider" />
            )}

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
              <>
                <button
                  className="ui-icon-btn"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  title={t.importAudio}
                  type="button"
                >
                  <Upload size={18} />
                </button>
                <button
                  className="ui-icon-btn"
                  data-tutorial="record-mic-button"
                  disabled={isLoading}
                  onClick={() => setRecordMicOpen(true)}
                  title={t.recordMic}
                  type="button"
                >
                  <Mic size={18} />
                </button>
              </>
            )}
            {samplerView === "editor" && activeTrimHandle === null && (
              <button
                className="ui-icon-btn"
                disabled={!decodedBuffer || isLoading}
                onClick={() => void handleExport()}
                title={t.downloadSample}
                type="button"
              >
                <Download size={18} />
              </button>
            )}
            {samplerView === "editor" && selectedSlot && activeTrimHandle === null && (
              <button
                className="ui-icon-btn"
                disabled={isLoading}
                onClick={() => resetCalibration(selectedIndex)}
                title={t.resetSlot}
                type="button"
              >
                <RotateCcw size={18} />
              </button>
            )}
            {/* En MUESTRAS: input de renombrar el slot seleccionado */}
            {samplerView === "muestras" && selectedSlot && (
              <input
                key={selectedIndex}
                className="audio-sampler-toolbar-rename"
                defaultValue={selectedSlot.name}
                onBlur={(e) => handleRename(selectedIndex, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                  if (e.key === "Escape") {
                    (e.target as HTMLInputElement).value = selectedSlot.name
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                placeholder={t.slotName}
                type="text"
              />
            )}

            {samplerView !== "secuenciador" && selectedSlot && activeTrimHandle === null && (
              <>
                <span aria-hidden="true" className="perform-mode-transport-divider" />
                <button
                  className="ui-icon-btn"
                  disabled={isLoading}
                  onClick={() => setDeleteConfirmOpen(true)}
                  title={t.deleteSlot}
                  type="button"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </header>

        <div className="audio-sampler-body">

          {/* ── Panel 1: Editor ─────────────────────────────────────── */}
          {samplerView === "editor" && (
            <div className="audio-sampler-panel audio-sampler-panel-editor">
              <span className="audio-sampler-panel-label">{t.tabEditor}</span>

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
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handleCanvasPointerMove}
                        onPointerUp={handleCanvasPointerUp}
                        onPointerCancel={handleCanvasPointerUp}
                      />
                      <div className="audio-sampler-playhead" ref={playheadRef} />
                    </>
                  ) : (
                    <div className="audio-sampler-waveform-empty">
                      <Mic size={28} />
                      <span>{isLoading ? t.loading : t.noAudio}</span>
                      {!isLoading && (
                        <span className="audio-sampler-waveform-hint">
                          {t.noAudioHint}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Panel lateral de calibración — 1/3 del ancho */}
                <div className="audio-sampler-cal-panel" data-tutorial="sampler-cal-panel">
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
                            title={t.normalize}
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
                      <span>{t.noSample}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── Panel 2: Muestras ──────────────────────────────────── */}
          {samplerView === "muestras" && <div className="audio-sampler-panel audio-sampler-panel-slots">
            <span className="audio-sampler-panel-label">{t.tabSamples}</span>
            <div className="audio-sampler-slots">
              {Array.from({ length: NUM_SAMPLE_SLOTS }, (_, i) => {
                const index = i + 1
                const slot = slots[i] ?? null
                const isActive = selectedIndex === index
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
                    <span className="audio-sampler-slot-name">
                      {slot?.name ?? `Slot ${index}`}
                    </span>
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
          {samplerView === "secuenciador" && (
            <div className="audio-sampler-panel audio-sampler-panel-sequencer">
              <span className="audio-sampler-panel-label">{t.tabSequencer}</span>

              {/* Contenido: grid de pasos o timeline */}
              {seqPattern.lanes.length === 0 ? (
                <div className="audio-sampler-step-empty">
                  <span>{t.noSamplesLoaded}</span>
                  <span className="audio-sampler-waveform-hint">{t.importSamplesHint}</span>
                </div>
              ) : (
                <div className="audio-sampler-step-grid">
                  {/* Fila de playhead — muestra el paso actual */}
                  <div className="audio-sampler-step-row audio-sampler-step-playhead-row">
                    <span className="audio-sampler-step-row-label" />
                    <div className="audio-sampler-step-cells">
                      {Array.from({ length: Math.ceil(seqPattern.stepsPerBar / 4) }, (_, gi) => (
                        <div key={gi} className="audio-sampler-step-group">
                          {Array.from({ length: Math.min(4, seqPattern.stepsPerBar - gi * 4) }, (_, si) => {
                            const stepIdx = gi * 4 + si
                            return (
                              <div
                                key={si}
                                className={`audio-sampler-step-ph${seqCurrentStep === stepIdx ? " audio-sampler-step-ph-active" : ""}`}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {seqPattern.lanes.map((lane, laneIdx) => {
                    const slot = slots.find(s => s?.dbId === lane.slotDbId)
                    const groups: { step: { active: boolean }; stepIdx: number }[][] =
                      Array.from({ length: Math.ceil(lane.steps.length / 4) }, (_, gi) =>
                        lane.steps.slice(gi * 4, gi * 4 + 4).map((step, si) => ({
                          step,
                          stepIdx: gi * 4 + si,
                        })),
                      )
                    return (
                      <div key={lane.slotDbId} className="audio-sampler-step-row">
                        <span className="audio-sampler-step-row-label" title={slot?.name}>
                          {slot?.name ?? "—"}
                        </span>
                        <div className="audio-sampler-step-cells">
                          {groups.map((group, gi) => (
                            <div key={gi} className="audio-sampler-step-group">
                              {group.map(({ step, stepIdx }) => (
                                <button
                                  key={stepIdx}
                                  aria-label={`${t.stepLabel} ${stepIdx + 1}`}
                                  aria-pressed={step.active}
                                  className={[
                                    "audio-sampler-step-btn",
                                    step.active ? "audio-sampler-step-btn-on" : "",
                                    seqCurrentStep === stepIdx ? "audio-sampler-step-btn-current" : "",
                                  ].join(" ").trim()}
                                  onClick={(e) => { toggleSeqStep(laneIdx, stepIdx); (e.currentTarget as HTMLButtonElement).blur() }}
                                  type="button"
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <AppDialog
        description={t.optionsDesc}
        onClose={onSettingsClose}
        open={settingsOpen}
        title={t.optionsTitle}
      >
        <div className="audio-sampler-settings" data-tutorial="sampler-options-content">
          <section className="ui-list-section">
            <span className="ui-label-muted">{t.summaryTitle}</span>
            <div className="audio-sampler-modal-summary">
              <span className="audio-sampler-modal-summary-slots">
                {tpl(t.slotsLabel, { current: String(filledCount), total: String(NUM_SAMPLE_SLOTS) })}
              </span>
              <button
                className="audio-sampler-cal-btn"
                disabled={filledCount === 0}
                onClick={resetAllCalibrations}
                title={t.resetAllDesc}
                type="button"
              >{t.resetAll}</button>
            </div>
          </section>
          <section className="ui-list-section">
            <span className="ui-label-muted">{t.tabSequencer}</span>

            {/* BPM */}
            <div className="audio-sampler-modal-seq-card">
              <div className="audio-sampler-modal-seq-card-header">
                <span className="audio-sampler-modal-seq-card-label">BPM</span>
                <span className="audio-sampler-modal-seq-card-value">{seqPattern.bpm < 10 ? seqPattern.bpm.toFixed(2) : Math.round(seqPattern.bpm)}</span>
              </div>
              <div className="audio-sampler-modal-bpm-ctrl">
                <input
                  className="audio-sampler-modal-bpm-slider"
                  max={240}
                  min={0.1}
                  step={seqPattern.bpm < 10 ? 0.1 : 1}
                  onChange={e => updateSeqBpm(Number(e.target.value))}
                  type="range"
                  value={seqPattern.bpm}
                />
                <input
                  className="audio-sampler-modal-bpm-input"
                  max={240}
                  min={0.1}
                  step={seqPattern.bpm < 10 ? 0.1 : 1}
                  onChange={e => updateSeqBpm(Number(e.target.value))}
                  type="number"
                  value={seqPattern.bpm < 10 ? seqPattern.bpm.toFixed(2) : Math.round(seqPattern.bpm)}
                />
                <button
                  className="audio-sampler-cal-btn"
                  onClick={() => updateSeqBpm(SEQ_DEFAULT_BPM)}
                  title={t.resetBpm}
                  type="button"
                >Reset</button>
              </div>
            </div>

            {/* Pasos */}
            <div className="audio-sampler-modal-seq-card">
              <div className="audio-sampler-modal-seq-card-header">
                <span className="audio-sampler-modal-seq-card-label">{t.stepsLabel}</span>
                <span className="audio-sampler-modal-seq-card-value">{seqPattern.stepsPerBar}</span>
              </div>
              <div className="audio-sampler-modal-steps-ctrl">
                {[1, 2, 4, 8, 16, 24, 32, 40].map(n => (
                  <button
                    className={`audio-sampler-seq-small-btn${seqPattern.stepsPerBar === n ? " audio-sampler-seq-small-btn-on" : ""}`}
                    key={n}
                    onClick={() => updateSeqSteps(n)}
                    type="button"
                  >{n}</button>
                ))}
              </div>
            </div>
          </section>

        </div>
      </AppDialog>

      <RecordMicModal
        language={language}
        onClose={() => setRecordMicOpen(false)}
        onSave={(data) => void handleMicSave(data)}
        open={recordMicOpen}
        slotIndex={selectedIndex}
      />

      <AppDialog
        actions={
          <>
            <button onClick={() => setDeleteConfirmOpen(false)} type="button">
              {tc.cancel}
            </button>
            <button
              className="app-dialog-confirm"
              onClick={() => { setDeleteConfirmOpen(false); void handleDelete() }}
              type="button"
            >
              {tc.delete}
            </button>
          </>
        }
        description={tpl(t.deleteSlotMsg, { name: selectedSlot?.name ?? "" })}
        onClose={() => setDeleteConfirmOpen(false)}
        open={deleteConfirmOpen}
        title={t.deleteSlotTitle}
      />

      <AppDialog
        actions={
          <>
            <button onClick={() => setSeqExportOpen(false)} type="button">
              {tc.cancel}
            </button>
            <button
              className="app-dialog-confirm"
              onClick={() => {
                setSeqExportOpen(false)
                void exportSeqMix(seqPattern, slots, bufferCacheRef.current, seqExportName)
              }}
              type="button"
            >
              {tc.download}
            </button>
          </>
        }
        description={t.exportMixDesc}
        onClose={() => setSeqExportOpen(false)}
        open={seqExportOpen}
        title={t.exportMixTitle}
      >
        <input
          autoFocus
          className="audio-sampler-toolbar-rename"
          onChange={e => setSeqExportName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              setSeqExportOpen(false)
              void exportSeqMix(seqPattern, slots, bufferCacheRef.current, seqExportName)
            }
            if (e.key === "Escape") setSeqExportOpen(false)
          }}
          placeholder={`mimidi-mix-${seqPattern.bpm}bpm`}
          style={{ width: "100%" }}
          type="text"
          value={seqExportName}
        />
      </AppDialog>
      <AppDialog
        actions={
          <>
            <button onClick={() => setSeqSendOpen(false)} type="button">{tc.cancel}</button>
            <button
              className="app-dialog-confirm"
              onClick={() => { setSeqSendOpen(false); sendMixToTimeline(seqSendName) }}
              type="button"
            >{tc.add}</button>
          </>
        }
        description={t.sendTimelineDesc}
        onClose={() => setSeqSendOpen(false)}
        open={seqSendOpen}
        title={t.sendTimelineTitle}
      >
        <input
          autoFocus
          className="audio-sampler-toolbar-rename"
          onChange={e => setSeqSendName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") { setSeqSendOpen(false); sendMixToTimeline(seqSendName) }
            if (e.key === "Escape") setSeqSendOpen(false)
          }}
          placeholder={t.defaultMixName}
          style={{ width: "100%" }}
          type="text"
          value={seqSendName}
        />
      </AppDialog>
    </>
  )
}
