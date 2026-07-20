import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import path from "node:path"
import type { Browser, Page } from "puppeteer"
import {
  startFunctionalAppServer,
  type FunctionalAppServer,
} from "../helpers/appServer"
import { launchFunctionalBrowser, newFunctionalPage } from "../helpers/browser"
import {
  activeNavSelector,
  appViewUrl,
  functionalSelectors,
} from "../helpers/selectors"
import {
  recordPageConsole,
  type PageConsoleRecorder,
} from "../helpers/pageConsole"
import { prepareCleanAppPage } from "../helpers/storage"
import { functionalViewports } from "../helpers/viewports"

async function importOscillator(page: Page) {
  const input = await page.$(functionalSelectors.pluginImportInput)
  if (!input) throw new Error("No .mimod import input found")
  await input.uploadFile(path.resolve("public/demo-plugins/oscillator/oscillator.mimod"))
  await page.waitForSelector('button[aria-label="Abrir Oscillator"]')
}

describe("functional oscillator piano instrument", () => {
  let app: FunctionalAppServer
  let browser: Browser
  let page: Page
  let consoleRecorder: PageConsoleRecorder

  beforeAll(async () => {
    app = await startFunctionalAppServer()
    browser = await launchFunctionalBrowser()
  })

  afterAll(async () => {
    await browser.close()
    await app.close()
  })

  beforeEach(async () => {
    page = await newFunctionalPage(browser, functionalViewports.desktop)
    consoleRecorder = recordPageConsole(page)
  })

  afterEach(async () => {
    consoleRecorder.assertNoErrors()
    await page.close()
  })

  it("shows one configurable Oscillator instrument in Piano", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "plugins"))
    await page.waitForSelector(activeNavSelector("Plugins"))
    await importOscillator(page)

    await page.click('button[aria-label="Abrir Oscillator"]')
    await page.waitForSelector(functionalSelectors.pluginOscillatorWorkspace)
    await page.click(functionalSelectors.pluginOscillatorWaveSquare)

    await page.goto(appViewUrl(app.url, "piano"), { waitUntil: "domcontentloaded" })
    await page.waitForSelector(activeNavSelector("Piano"))
    await page.click(functionalSelectors.pianoInstrumentButton)
    await page.evaluate(() => {
      const advancedButton = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Avanzado",
      )
      ;(advancedButton as HTMLButtonElement | undefined)?.click()
    })

    await page.waitForFunction(() => document.body.textContent?.includes("Oscillator"))
    const instrumentDialogText = await page.evaluate(() => document.body.textContent ?? "")
    const oscillatorMatches = instrumentDialogText.match(/Oscillator/g) ?? []

    expect(oscillatorMatches.length).toBeGreaterThanOrEqual(1)
    expect(instrumentDialogText).toContain("Oscillator")
    expect(instrumentDialogText).not.toContain("Oscillator Sine")
    expect(instrumentDialogText).not.toContain("Oscillator Square")
    expect(instrumentDialogText).not.toContain("Oscillator Saw")
    expect(instrumentDialogText).not.toContain("Oscillator Triangle")
  }, 60_000)
})
