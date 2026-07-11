import {
  usePluginAPI,
  type PluginAPIDeps,
} from "../../plugin-host/pluginApi"

type PluginWorkspaceAPIDependencies = {
  audio: Pick<PluginAPIDeps, "playNote" | "stopNote" | "triggerPad">
  notify: PluginAPIDeps["notify"]
  project: Pick<PluginAPIDeps, "bpm" | "getTracks">
  session: Pick<
    PluginAPIDeps,
    "loadClip" | "receivePluginOutput" | "storeClip"
  >
  transport: Pick<PluginAPIDeps, "isPlaying" | "isRecording">
}

export function usePluginWorkspaceAPI(
  dependencies: PluginWorkspaceAPIDependencies,
) {
  return usePluginAPI({
    bpm: dependencies.project.bpm,
    getTracks: dependencies.project.getTracks,
    isPlaying: dependencies.transport.isPlaying,
    isRecording: dependencies.transport.isRecording,
    loadClip: dependencies.session.loadClip,
    notify: dependencies.notify,
    playNote: dependencies.audio.playNote,
    receivePluginOutput: dependencies.session.receivePluginOutput,
    stopNote: dependencies.audio.stopNote,
    storeClip: dependencies.session.storeClip,
    triggerPad: dependencies.audio.triggerPad,
  })
}
