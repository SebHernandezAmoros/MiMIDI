import type { PluginAudioOutputResult } from "../../application/use-cases/pluginAudioOutputs"
import { addAudioClipTrack } from "../../domain/project/audioClipTrackMutations"
import { appendTrackWithNotes } from "../../domain/project/projectTrackLifecycle"
import type { MusicalProject } from "../../domain/project/projectTypes"
import type {
  PluginAudioOutput,
  PluginOutput,
} from "../../domain/plugins/pluginContracts"

type DownloadResult = Extract<
  PluginAudioOutputResult,
  { type: "download" }
>

export type PluginWorkspaceOutputDependencies = {
  applyProjectUpdate(
    updater: (project: MusicalProject) => MusicalProject,
  ): void
  notifySamplerSlotsChanged(): void
  processAudioOutput(
    output: PluginAudioOutput,
  ): Promise<PluginAudioOutputResult | null>
  saveFile(
    blob: Blob,
    fileName: string,
    types: DownloadResult["types"],
  ): void
}

export async function handlePluginWorkspaceOutput(
  dependencies: PluginWorkspaceOutputDependencies,
  output: PluginOutput,
): Promise<void> {
  if (output.type === "midi") {
    dependencies.applyProjectUpdate((project) =>
      appendTrackWithNotes(
        project,
        output.name,
        output.instrumentId,
        output.notes,
      ),
    )
    return
  }

  const result = await dependencies.processAudioOutput(output)
  if (!result) return

  if (result.type === "project-track") {
    dependencies.applyProjectUpdate((project) =>
      addAudioClipTrack(project, result),
    )
    return
  }

  if (result.type === "sampler-slot") {
    dependencies.notifySamplerSlotsChanged()
    return
  }

  dependencies.saveFile(result.blob, result.fileName, result.types)
}
