import { useRef } from "react"
import type { PlayNoteOptions } from "../../application/use-cases/playNote"

type PluginWorkspaceInstrument = {
  id: string
  waveform?: PlayNoteOptions["waveform"]
  envelope?: PlayNoteOptions["envelope"]
  volume?: PlayNoteOptions["volume"]
}

type PluginWorkspaceNotePreviewDependencies<TVoiceId> = {
  instruments: readonly PluginWorkspaceInstrument[]
  startVoice(
    note: string,
    duration: number,
    options: PlayNoteOptions,
  ): TVoiceId
  stopVoice(voiceId: TVoiceId): void
}

export function usePluginWorkspaceNotePreview<TVoiceId>(
  dependencies: PluginWorkspaceNotePreviewDependencies<TVoiceId>,
) {
  const voicesRef = useRef<Map<string, TVoiceId>>(new Map())

  function playNote(note: string, instrumentId: string, duration: number) {
    const instrument = dependencies.instruments.find(
      (candidate) => candidate.id === instrumentId,
    )
    const voiceId = dependencies.startVoice(note, duration, {
      waveform: instrument?.waveform,
      envelope: instrument?.envelope,
      volume: instrument?.volume,
    })
    voicesRef.current.set(note, voiceId)
  }

  function stopNote(note: string) {
    const voiceId = voicesRef.current.get(note)
    if (voiceId === undefined) return
    dependencies.stopVoice(voiceId)
    voicesRef.current.delete(note)
  }

  return { playNote, stopNote }
}
