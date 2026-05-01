type LabActionsProps = {
  canPlayRecording: boolean
  canExportAudio: boolean
  isPlaying: boolean
  isExportingAudio: boolean
  isRecording: boolean
  onClearSession: () => void
  onExportAudio: () => void
  onExportProject: () => void
  onImportProject: () => void
  onPlayRecording: () => void
  onPlayTestChord: () => void
  onPlayTestNote: () => void
  onRestartProject: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onStopPlayback: () => void
}

export function LabActions({
  canPlayRecording,
  canExportAudio,
  isPlaying,
  isExportingAudio,
  isRecording,
  onClearSession,
  onExportAudio,
  onExportProject,
  onImportProject,
  onPlayRecording,
  onPlayTestChord,
  onPlayTestNote,
  onRestartProject,
  onStartRecording,
  onStopRecording,
  onStopPlayback,
}: LabActionsProps) {
  return (
    <div className="actions">
      <button onClick={onPlayTestNote} type="button">
        Tocar nota
      </button>
      <button onClick={onPlayTestChord} type="button">
        Tocar acorde
      </button>
      <button disabled={isRecording} onClick={onStartRecording} type="button">
        {isRecording ? "Grabando" : "Iniciar grabacion"}
      </button>
      <button disabled={!isRecording} onClick={onStopRecording} type="button">
        Detener grabacion
      </button>
      <button disabled={!canPlayRecording || isPlaying} onClick={onPlayRecording} type="button">
        {isPlaying ? "Reproduciendo" : "Reproducir grabacion"}
      </button>
      <button disabled={!canExportAudio || isExportingAudio} onClick={onExportAudio} type="button">
        {isExportingAudio ? "Exportando audio..." : "Exportar WAV"}
      </button>
      <button onClick={onStopPlayback} type="button">
        Detener
      </button>
      <button onClick={onClearSession} type="button">
        Limpiar notas
      </button>
      <button onClick={onRestartProject} type="button">
        Reiniciar proyecto
      </button>
      <button onClick={onImportProject} type="button">
        Importar JSON
      </button>
      <button onClick={onExportProject} type="button">
        Exportar JSON
      </button>
    </div>
  )
}
