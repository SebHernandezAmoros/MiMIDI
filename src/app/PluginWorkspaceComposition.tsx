import type { AppLanguage } from "./appI18n"
import { useProjectPerformanceComposition } from "./useProjectPerformanceComposition"
import { useProjectPlaybackComposition } from "./useProjectPlaybackComposition"
import {
  loadPluginClip,
  processPluginAudioOutput,
  storePluginClip,
} from "../application/use-cases/pluginAudioOutputs"
import { playNote, stopNote } from "../application/use-cases/playNote"
import { saveFile } from "../application/use-cases/saveFile"
import { createPluginWorkspaceClipStorage } from "../features/plugins-view/pluginWorkspaceClipStorage"
import { handlePluginWorkspaceOutput } from "../features/plugins-view/pluginWorkspaceOutputs"
import { getPluginWorkspaceBpm } from "../features/plugins-view/pluginWorkspaceTempo"
import { getPluginWorkspaceTracks } from "../features/plugins-view/pluginWorkspaceTracks"
import { PluginWorkspaceView } from "../features/plugins-view/PluginWorkspaceView"
import { usePluginWorkspaceAPI } from "../features/plugins-view/usePluginWorkspaceAPI"
import { usePluginWorkspaceNotePreview } from "../features/plugins-view/usePluginWorkspaceNotePreview"
import { usePluginWorkspaceNotification } from "../features/plugins-view/usePluginWorkspaceNotification"

type PluginWorkspaceCompositionProps = {
  language?: AppLanguage
  pluginId: string
}

export function PluginWorkspaceComposition({
  language = "es",
  pluginId,
}: PluginWorkspaceCompositionProps) {
  const { playback, projectSession } = useProjectPlaybackComposition({
    mode: "plugin-workspace",
    timelineSnapEnabled: false,
    timelineSnapStep: 0.1,
  })
  const {
    instrumentCatalog,
    performance,
    recording,
  } = useProjectPerformanceComposition({ projectSession })
  const workspaceNotification = usePluginWorkspaceNotification()
  const notePreview = usePluginWorkspaceNotePreview({
    instruments: instrumentCatalog.availableInstruments,
    startVoice: (note, duration, options) =>
      playNote(note as Parameters<typeof playNote>[0], duration, options),
    stopVoice: stopNote,
  })
  const clipStorage = createPluginWorkspaceClipStorage({
    loadClip: loadPluginClip,
    storeClip: storePluginClip,
  })
  const api = usePluginWorkspaceAPI({
    audio: {
      playNote: notePreview.playNote,
      stopNote: notePreview.stopNote,
      triggerPad: (padId, velocity = 1) =>
        performance.triggerSmcPad(padId, velocity),
    },
    notify: workspaceNotification.notify,
    project: {
      bpm: getPluginWorkspaceBpm(projectSession.project.timeline),
      getTracks: () =>
        getPluginWorkspaceTracks(projectSession.project.timeline),
    },
    session: {
      loadClip: clipStorage.loadClip,
      receivePluginOutput: (output) => {
        void handlePluginWorkspaceOutput(
          {
            applyProjectUpdate: projectSession.applyUpdate,
            notifySamplerSlotsChanged: () => {
              window.dispatchEvent(new StorageEvent("storage", {
                key: "mimidi-audio-slots",
                storageArea: localStorage,
              }))
            },
            processAudioOutput: processPluginAudioOutput,
            saveFile,
          },
          output,
        )
      },
      storeClip: clipStorage.storeClip,
    },
    transport: {
      isPlaying: playback.playbackTransport.isPlaying,
      isRecording: recording.recordingState === "recording",
    },
  })

  return (
    <PluginWorkspaceView
      api={api}
      language={language}
      notification={workspaceNotification.notification}
      pluginId={pluginId}
    />
  )
}
