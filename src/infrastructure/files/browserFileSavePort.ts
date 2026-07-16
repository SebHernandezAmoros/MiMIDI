import type {
  FileSavePort,
  SaveFileType,
} from "../../application/ports/FileSavePort"

export function createBrowserFileSavePort(): FileSavePort {
  return {
    async save({ blob, suggestedName, types }) {
      if ("showSaveFilePicker" in window) {
        try {
          const picker = window.showSaveFilePicker as (opts: {
            suggestedName: string
            types: SaveFileType[]
          }) => Promise<FileSystemFileHandle>
          const handle = await picker({ suggestedName, types })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = suggestedName
      a.click()
      URL.revokeObjectURL(url)
    },
  }
}
