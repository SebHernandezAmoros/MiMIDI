import { createServer, type ViteDevServer } from "vite"

export type FunctionalAppServer = {
  url: string
  close: () => Promise<void>
}

export async function startFunctionalAppServer(): Promise<FunctionalAppServer> {
  const server: ViteDevServer = await createServer({
    clearScreen: false,
    logLevel: "error",
    server: {
      hmr: false,
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
    },
  })

  await server.listen()

  const url = server.resolvedUrls?.local[0]
  if (!url) {
    await server.close()
    throw new Error("Vite did not expose a local URL for functional tests.")
  }

  return {
    url,
    close: () => server.close(),
  }
}
