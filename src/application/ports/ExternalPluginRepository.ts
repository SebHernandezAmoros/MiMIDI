export type ExternalPluginRepository = {
  delete(id: string): Promise<void>
  listIds(): Promise<string[]>
  load(id: string): Promise<ArrayBuffer | null>
  save(id: string, data: ArrayBuffer): Promise<void>
}
