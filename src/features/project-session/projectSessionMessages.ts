export type TrackRemovedMessageOptions = {
  isLastMidiTrack: boolean
  isLastPercussionTrack: boolean
  trackName: string
}

export function formatTrackAddedMessage(trackName: string): string {
  return `Pista agregada: ${trackName}.`
}

export function formatStepsTrackRemovedMessage(trackName: string): string {
  return `Pista eliminada: ${trackName}.`
}

export function formatTrackRemovedMessage({
  isLastMidiTrack,
  isLastPercussionTrack,
  trackName,
}: TrackRemovedMessageOptions): string {
  if (isLastPercussionTrack) {
    return `${trackName} eliminada. Pad 1 listo para usar.`
  }

  if (isLastMidiTrack) {
    return `${trackName} eliminada. Pista vacia lista para grabar.`
  }

  return `Pista eliminada: ${trackName}.`
}

export function formatPluginEnabledMessage(
  pluginName: string,
  enabled: boolean,
): string {
  return enabled
    ? `Plugin activado: ${pluginName}.`
    : `Plugin desactivado: ${pluginName}.`
}

export function formatUndoUnavailableMessage(): string {
  return "No hay cambios anteriores para deshacer."
}

export function formatUndoAppliedMessage(): string {
  return "Deshacer aplicado."
}

export function formatRedoUnavailableMessage(): string {
  return "No hay cambios posteriores para rehacer."
}

export function formatRedoAppliedMessage(): string {
  return "Rehacer aplicado."
}

export function formatSessionClearedMessage(): string {
  return "Notas limpiadas. Pistas y nombre conservados."
}

export function formatProjectRestartedMessage(): string {
  return "Proyecto reiniciado desde cero."
}

export function formatJsonExportedMessage(): string {
  return "Proyecto exportado a JSON."
}

export function formatProjectImportingMessage(): string {
  return "Importando proyecto..."
}

export function formatProjectImportedMessage(projectName: string): string {
  return `Proyecto importado: ${projectName}.`
}

export function formatJsonImportFailedMessage(): string {
  return "No se pudo importar el JSON del proyecto."
}

export function formatBundleImportFailedMessage(): string {
  return "No se pudo importar el archivo .mimidi."
}

export function formatBundlePackagingMessage(): string {
  return "Empaquetando proyecto..."
}

export function formatBundleExportedMessage(): string {
  return "Proyecto guardado como .mimidi (incluye muestras)."
}

export function formatBundleExportFailedMessage(): string {
  return "No se pudo exportar el bundle."
}

export function formatOfflineAudioUnsupportedMessage(): string {
  return "Este navegador no soporta exportacion offline de audio."
}

export function formatAudioExportedMessage(duration: number): string {
  return `Audio exportado a WAV (${duration.toFixed(2)}s).`
}

export function formatAudioExportFailedMessage(): string {
  return "No se pudo exportar el audio del proyecto."
}
