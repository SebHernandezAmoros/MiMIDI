import type { FileSavePort, SaveFileType } from "../ports/FileSavePort"
import { createBrowserFileSavePort } from "../../infrastructure/files/browserFileSavePort"

export type { SaveFileType }

const browserFileSavePort = createBrowserFileSavePort()

export function saveFileWithPort(
  fileSavePort: FileSavePort,
  blob: Blob,
  suggestedName: string,
  types: SaveFileType[],
): Promise<void> {
  return fileSavePort.save({ blob, suggestedName, types })
}

export function saveFile(
  blob: Blob,
  suggestedName: string,
  types: SaveFileType[],
): Promise<void> {
  return saveFileWithPort(browserFileSavePort, blob, suggestedName, types)
}
