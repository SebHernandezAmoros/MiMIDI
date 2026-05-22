import { useEffect, useRef, useState } from "react"
import { playSamplerMixes } from "../../application/use-cases/playSamplerMixes"
import {
  getMidiTrackNotes,
  getMidiTracks,
  getSamplerTracks,
  type MusicalProject,
} from "../../engine/project/projectModel"
import { usePlaybackTransport } from "../transport/usePlaybackTransport"

export function useLabPlayback({ project }: { project: MusicalProject }) {
  const playbackTransport = usePlaybackTransport()
  const samplerMixPlaybackRef = useRef<{ cancel: () => void } | null>(null)
  const [absolutePlayheadTime, setAbsolutePlayheadTime] = useState<number | null>(null)
  const [isMixOnlyPlaying, setIsMixOnlyPlaying] = useState(false)
  const mixOnlyStartRef = useRef<{ startedAt: number; duration: number } | null>(null)

  useEffect(() => {
    if (!playbackTransport.isPlaying || !playbackTransport.playbackInfo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbsolutePlayheadTime(null)
      return
    }
    const { startedAt, contentStart } = playbackTransport.playbackInfo
    let rafId: number
    function tick() {
      setAbsolutePlayheadTime(contentStart + (performance.now() - startedAt) / 1000)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [playbackTransport.isPlaying, playbackTransport.playbackInfo])

  useEffect(() => {
    if (!isMixOnlyPlaying || !mixOnlyStartRef.current) return
    const { startedAt, duration } = mixOnlyStartRef.current
    let rafId: number
    function tick() {
      const elapsed = (performance.now() - startedAt) / 1000
      if (elapsed >= duration) {
        setAbsolutePlayheadTime(null)
        setIsMixOnlyPlaying(false)
        mixOnlyStartRef.current = null
        return
      }
      setAbsolutePlayheadTime(elapsed)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isMixOnlyPlaying])

  function playAll(notesProject: MusicalProject, fromZero = false) {
    const startedAt = performance.now()
    samplerMixPlaybackRef.current?.cancel()

    const allSamplerTracks = getSamplerTracks(notesProject.timeline)
    const midiTracksForPlay = getMidiTracks(notesProject.timeline)
    const hasMidiSolo = midiTracksForPlay.some((t) => t.solo)
    const hasMixSolo = allSamplerTracks.some((t) => t.solo)
    const samplerTracks = hasMidiSolo
      ? []
      : hasMixSolo
        ? allSamplerTracks.filter((t) => t.solo)
        : allSamplerTracks

    samplerMixPlaybackRef.current = playSamplerMixes(samplerTracks, startedAt)

    const mixMaxEnd =
      samplerTracks.length > 0
        ? Math.max(
            ...samplerTracks.map((m) => {
              const secondsPerStep = 60 / m.pattern.bpm / 4
              return m.clips.reduce(
                (max, c) => Math.max(max, c.startTime + m.pattern.stepsPerBar * secondsPerStep),
                0,
              )
            }),
          )
        : 0

    const hasMidi = !hasMixSolo && midiTracksForPlay.some((t) => getMidiTrackNotes(t).length > 0)
    if (hasMidi) {
      playbackTransport.play(notesProject, {
        fromZero,
        onComplete: () => {
          const elapsed = (performance.now() - startedAt) / 1000
          if (mixMaxEnd > elapsed) {
            mixOnlyStartRef.current = { startedAt, duration: mixMaxEnd }
            setIsMixOnlyPlaying(true)
          }
        },
      })
    } else if (samplerTracks.length > 0) {
      mixOnlyStartRef.current = { startedAt, duration: mixMaxEnd }
      setIsMixOnlyPlaying(true)
    }
  }

  function stopAll() {
    playbackTransport.stop()
    samplerMixPlaybackRef.current?.cancel()
    samplerMixPlaybackRef.current = null
    setIsMixOnlyPlaying(false)
    mixOnlyStartRef.current = null
    setAbsolutePlayheadTime(null)
  }

  function playRecording() {
    playbackTransport.play(project)
  }

  return {
    playbackTransport,
    absolutePlayheadTime,
    isMixOnlyPlaying,
    playAll,
    stopAll,
    playRecording,
  }
}
