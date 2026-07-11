type PluginWorkspaceClipStorageDependencies = {
  storeClip(blob: Blob): Promise<string>
  loadClip(dbId: string): Promise<Blob | null>
}

export function createPluginWorkspaceClipStorage(
  dependencies: PluginWorkspaceClipStorageDependencies,
) {
  return {
    storeClip(
      blob: Blob,
      _name: string,
      _duration: number,
    ): Promise<string> {
      return dependencies.storeClip(blob)
    },
    loadClip(dbId: string): Promise<Blob | null> {
      return dependencies.loadClip(dbId)
    },
  }
}
