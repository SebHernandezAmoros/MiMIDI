import { useEffect, useRef, useState } from "react"
import { Play, Square } from "lucide-react"
import "./RecordMicModal.css"
import { AppDialog } from "../../app/components/AppDialog"
import { resolveAppMessages, type AppLanguage } from "../../app/appI18n"
import { startMicRecording, type MicRecorderSession } from "../../application/use-cases/recordMicSample"
import type { ImportedSampleData } from "../../application/use-cases/importSampleFile"
import { playSampleBuffer, type SamplePlayback } from "../../application/use-cases/playSampleBuffer"
import { DEFAULT_CALIBRATION } from "../../engine/audio/sampleModel"

type RecordMicModalProps = {
  open: boolean
  slotIndex: number
  language?: AppLanguage
  onSave: (data: ImportedSampleData) => void
  onClose: () => void
}

type RecordState = "idle" | "requesting" | "recording" | "processing" | "done" | "error"

const MAX_SECONDS = 30

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function formatTime(s: number) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export function RecordMicModal({ open, slotIndex, language, onSave, onClose }: RecordMicModalProps) {
  const t = resolveAppMessages(language ?? "es").lab.sampler
  const tc = resolveAppMessages(language ?? "es").lab.common

  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")
  const [recordedData, setRecordedData] = useState<ImportedSampleData | null>(null)

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  const sessionRef = useRef<MicRecorderSession | null>(null)
  const intervalRef = useRef<number | null>(null)
  const autoStopRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<SamplePlayback | null>(null)
  const previewTimerRef = useRef<number | null>(null)

  function clearTimers() {
    if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (autoStopRef.current !== null) { clearTimeout(autoStopRef.current); autoStopRef.current = null }
  }

  function stopPreview() {
    previewRef.current?.stop()
    previewRef.current = null
    if (previewTimerRef.current !== null) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
    setIsPreviewPlaying(false)
  }

  function togglePreview() {
    if (isPreviewPlaying) { stopPreview(); return }
    if (!recordedData) return
    stopPreview()
    const pb = playSampleBuffer(recordedData.audioBuffer, { ...DEFAULT_CALIBRATION })
    previewRef.current = pb
    setIsPreviewPlaying(true)
    previewTimerRef.current = window.setTimeout(() => {
      previewRef.current = null
      previewTimerRef.current = null
      setIsPreviewPlaying(false)
    }, pb.realDurationMs + 150)
  }

  function resetState() {
    clearTimers()
    stopPreview()
    sessionRef.current?.cancel()
    sessionRef.current = null
    setRecordState("idle")
    setElapsed(0)
    setRecordedData(null)
    setErrorMsg("")
  }

  function handleClose() {
    resetState()
    onClose()
  }

  async function doStop(session: MicRecorderSession) {
    clearTimers()
    setRecordState("processing")
    try {
      const data = await session.stop()
      sessionRef.current = null
      setRecordedData(data)
      setRecordState("done")
    } catch {
      setRecordState("error")
      setErrorMsg(t.recordErrorDesc)
    }
  }

  async function handleStart() {
    stopPreview()
    setRecordState("requesting")
    setElapsed(0)
    try {
      const session = await startMicRecording()
      sessionRef.current = session
      setRecordState("recording")

      intervalRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)

      autoStopRef.current = window.setTimeout(() => {
        const s = sessionRef.current
        if (s) void doStop(s)
      }, MAX_SECONDS * 1000)
    } catch {
      setRecordState("error")
      setErrorMsg(t.recordErrorDesc)
    }
  }

  async function handleStop() {
    const session = sessionRef.current
    if (!session) return
    await doStop(session)
  }

  function handleUse() {
    if (!recordedData) return
    onSave(recordedData)
    resetState()
    onClose()
  }

  // Draw waveform when state transitions to "done"
  useEffect(() => {
    if (recordState !== "done" || !recordedData) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rafId = requestAnimationFrame(() => {
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
      const data = recordedData.audioBuffer.getChannelData(0)
      const step = Math.max(1, Math.floor(data.length / W))
      const accent = getComputedStyle(canvas).getPropertyValue("--ui-color-accent").trim() || "#c82828"
      ctx.clearRect(0, 0, W, H)
      for (let x = 0; x < W; x++) {
        let min = 0, max = 0
        for (let i = 0; i < step; i++) {
          const s = data[x * step + i] ?? 0
          if (s < min) min = s
          if (s > max) max = s
        }
        const mid = H / 2
        ctx.fillStyle = accent + "cc"
        ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid))
      }
      ctx.fillStyle = accent + "55"
      ctx.fillRect(0, H / 2, W, 1)
    })
    return () => cancelAnimationFrame(rafId)
  }, [recordState, recordedData])

  // Reset when modal closes
  useEffect(() => {
    if (!open) resetState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const remaining = MAX_SECONDS - elapsed
  const isRecording = recordState === "recording"
  const isBusy = recordState === "requesting" || recordState === "processing"

  return (
    <AppDialog
      actions={
        <>
          <button onClick={handleClose} type="button">{tc.cancel}</button>
          {recordState === "done" && (
            <button
              aria-label={isPreviewPlaying ? tc.stop : tc.play}
              className={`rec-mic-play-action${isPreviewPlaying ? " rec-mic-play-action-active" : ""}`}
              onClick={togglePreview}
              type="button"
            >
              {isPreviewPlaying ? <Square size={14} /> : <Play size={14} />}
              <span>{isPreviewPlaying ? tc.stop : tc.play}</span>
            </button>
          )}
          {recordState === "done" && (
            <button className="app-dialog-confirm" onClick={handleUse} type="button">
              {t.recordUseSample}
            </button>
          )}
        </>
      }
      description={t.recordMicDesc}
      onClose={handleClose}
      open={open}
      title={`${t.recordMicTitle} — Slot ${slotIndex}`}
    >
      <div className="rec-mic-body">

        {/* ── Izquierda: visualización ── */}
        <div className="rec-mic-left">
          {(recordState === "idle" || recordState === "error") && (
            <div className="rec-mic-status-msg">
              {recordState === "error"
                ? <span className="rec-mic-status-text rec-mic-status-text-error">{errorMsg}</span>
                : <span className="rec-mic-status-text">{t.recordMaxHint}</span>}
            </div>
          )}

          {isBusy && (
            <div className="rec-mic-status-msg">
              <span className="rec-mic-status-text">
                {recordState === "requesting" ? t.recordRequestingMic : t.recordProcessing}
              </span>
            </div>
          )}

          {isRecording && (
            <div className="rec-mic-recording-view">
              <div className="rec-mic-bars" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="rec-mic-bar" style={{ animationDelay: `${i * 0.09}s` }} />
                ))}
              </div>
              <div className="rec-mic-timer">
                <span className="rec-mic-timer-elapsed">{formatTime(elapsed)}</span>
                <span className="rec-mic-timer-sep"> / </span>
                <span className="rec-mic-timer-remain">-{formatTime(remaining)}</span>
              </div>
            </div>
          )}

          {recordState === "done" && recordedData && (
            <div className="rec-mic-waveform-wrap">
              <canvas className="rec-mic-waveform-canvas" ref={canvasRef} />
              <span className="rec-mic-done-duration">{recordedData.duration.toFixed(2)}s</span>
            </div>
          )}
        </div>

        {/* ── Derecha: botón principal ── */}
        <div className="rec-mic-right">
          {(recordState === "idle" || recordState === "error") && (
            <button
              aria-label={t.recordStart}
              className="rec-mic-btn rec-mic-btn-record"
              onClick={() => void handleStart()}
              type="button"
            >
              <span className="rec-mic-dot" />
              <span>{t.recordStart}</span>
            </button>
          )}

          {isBusy && (
            <button className="rec-mic-btn rec-mic-btn-record" disabled type="button">
              <span className="rec-mic-dot rec-mic-dot-pulse" />
              <span>…</span>
            </button>
          )}

          {isRecording && (
            <button
              aria-label={t.recordStop}
              className="rec-mic-btn rec-mic-btn-stop"
              onClick={() => void handleStop()}
              type="button"
            >
              <Square size={26} />
              <span>{t.recordStop}</span>
            </button>
          )}

          {recordState === "done" && (
            <button
              aria-label={t.recordAgain}
              className="rec-mic-btn rec-mic-btn-record"
              onClick={() => void handleStart()}
              type="button"
            >
              <span className="rec-mic-dot" />
              <span>{t.recordAgain}</span>
            </button>
          )}
        </div>

      </div>
    </AppDialog>
  )
}
