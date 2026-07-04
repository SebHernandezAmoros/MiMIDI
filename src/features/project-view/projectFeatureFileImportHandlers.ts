import type { ChangeEvent } from "react"

type ProjectFeatureFileImportDependencies = {
  importBundle: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  importProjectFile: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>
  tearDownSession: () => void
}

export function createProjectFeatureFileImportHandlers({
  importBundle,
  importProjectFile,
  tearDownSession,
}: ProjectFeatureFileImportDependencies) {
  async function handleImportBundle(event: ChangeEvent<HTMLInputElement>) {
    tearDownSession()
    await importBundle(event)
  }

  async function handleImportProjectFile(event: ChangeEvent<HTMLInputElement>) {
    tearDownSession()
    await importProjectFile(event)
  }

  return {
    importBundle: handleImportBundle,
    importProjectFile: handleImportProjectFile,
  }
}
