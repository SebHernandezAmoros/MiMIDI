type LabActionsProps = {
  canPlayRecording: boolean
  isPlaying: boolean
  onClearSession: () => void
  onExportProject: () => void
  onImportProject: () => void
  onPlayRecording: () => void
  onPlayTestChord: () => void
  onPlayTestNote: () => void
  onRestartProject: () => void
  onStopPlayback: () => void
}

export function LabActions({
  canPlayRecording,
  isPlaying,
  onClearSession,
  onExportProject,
  onImportProject,
  onPlayRecording,
  onPlayTestChord,
  onPlayTestNote,
  onRestartProject,
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
      <button disabled={!canPlayRecording || isPlaying} onClick={onPlayRecording} type="button">
        {isPlaying ? "Reproduciendo" : "Reproducir grabacion"}
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
