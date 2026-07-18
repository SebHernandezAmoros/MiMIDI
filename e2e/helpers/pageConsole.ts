import type { ConsoleMessage, Page } from "puppeteer"

type RecordedPageError = {
  source: "console" | "pageerror"
  text: string
}

function isExpectedBrowserResourceNoise(message: ConsoleMessage) {
  return (
    message.type() === "error" &&
    message.text().includes("Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED")
  )
}

export type PageConsoleRecorder = {
  errors: RecordedPageError[]
  assertNoErrors: () => void
}

export function recordPageConsole(page: Page): PageConsoleRecorder {
  const errors: RecordedPageError[] = []

  page.on("console", (message: ConsoleMessage) => {
    if (message.type() !== "error") {
      return
    }

    if (isExpectedBrowserResourceNoise(message)) {
      return
    }

    errors.push({
      source: "console",
      text: message.text(),
    })
  })

  page.on("pageerror", (error: Error) => {
    errors.push({
      source: "pageerror",
      text: error.message,
    })
  })

  return {
    errors,
    assertNoErrors: () => {
      if (errors.length === 0) {
        return
      }

      const details = errors
        .map((error) => `[${error.source}] ${error.text}`)
        .join("\n")

      throw new Error(`Unexpected browser errors:\n${details}`)
    },
  }
}
