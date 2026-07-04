import { Download, Folder, Upload } from "lucide-react"
import { useRef, type ChangeEvent } from "react"

type PluginsCatalogImportToolbarProps = {
  onMimodFile: (file: File) => void
}

export function PluginsCatalogImportToolbar({
  onMimodFile,
}: PluginsCatalogImportToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""
    onMimodFile(file)
  }

  return (
    <>
      <input
        accept=".mimod"
        hidden
        ref={inputRef}
        type="file"
        onChange={handleChange}
      />
      <header className="app-mock-toolbar">
        <div className="app-mock-toolbar-actions">
          <button
            className="ui-pill-btn"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            IMPORT .mimod
          </button>
          <a
            className="ui-pill-btn"
            download="mimidi-plugin-sdk.d.ts"
            href="/mimidi-plugin-sdk.d.ts"
            style={{ textDecoration: "none" }}
          >
            <Download size={14} />
            SDK .d.ts
          </a>
        </div>
      </header>
    </>
  )
}

type PluginsCatalogDevelopmentToolsProps = {
  onPluginFolder: () => void
  supportsDirectoryPicker: boolean
}

export function PluginsCatalogDevelopmentTools({
  onPluginFolder,
  supportsDirectoryPicker,
}: PluginsCatalogDevelopmentToolsProps) {
  return (
    <details className="app-devtools-section">
      <summary className="app-devtools-summary">
        Herramientas para desarrolladores
      </summary>
      <div className="app-devtools-body">
        <p className="app-devtools-warn">
          Solo disponible en Chrome y Edge. Carga un plugin desde una carpeta local sin empaquetar (.mimod).
        </p>
        <button
          className="ui-pill-btn"
          disabled={!supportsDirectoryPicker}
          title={supportsDirectoryPicker ? "Cargar plugin desde directorio de desarrollo" : "Solo disponible en Chrome y Edge"}
          type="button"
          onClick={onPluginFolder}
        >
          <Folder size={14} />
          PLUGIN FOLDER
        </button>
      </div>
    </details>
  )
}
