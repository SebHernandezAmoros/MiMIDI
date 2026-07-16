export type SaveFileType = {
  description: string
  accept: Record<string, string[]>
}

export type SaveFileRequest = {
  blob: Blob
  suggestedName: string
  types: SaveFileType[]
}

export type FileSavePort = {
  save(request: SaveFileRequest): Promise<void>
}
