type SaveFileType = {
  description: string
  accept: Record<string, string[]>
}

export async function saveFile(
  blob: Blob,
  suggestedName: string,
  types: SaveFileType[],
): Promise<void> {
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      // API falló — caer al método clásico
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
}
