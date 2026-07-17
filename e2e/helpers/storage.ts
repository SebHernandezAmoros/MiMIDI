import type { Page } from "puppeteer"

export async function resetAppStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem("mimidi-tutorial-seen", "true")
    window.localStorage.setItem("mimidi-complete-tutorial-seen", "true")

    if (!indexedDB.databases) {
      return
    }

    const databases = await indexedDB.databases()
    await Promise.all(
      databases
        .map((database) => database.name)
        .filter((name): name is string => Boolean(name))
        .map((name) => {
          const request = indexedDB.deleteDatabase(name)

          return new Promise<void>((resolve, reject) => {
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
            request.onblocked = () => resolve()
          })
        }),
    )
  })
}

export async function prepareCleanAppPage(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" })
  await resetAppStorage(page)
  await page.goto(url, { waitUntil: "domcontentloaded" })
}
