export type SampleRepository = {
  load(dbId: string): Promise<ArrayBuffer | null>
  save(dbId: string, data: ArrayBuffer): Promise<void>
  delete(dbId: string): Promise<void>
}
