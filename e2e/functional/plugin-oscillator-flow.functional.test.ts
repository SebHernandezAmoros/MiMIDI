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

describe("functional oscillator plugin flow", () => {
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

  it("imports Oscillator, configures a piano instrument and previews it", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "plugins"))
    await page.waitForSelector(activeNavSelector("Plugins"))

    const input = await page.$(functionalSelectors.pluginImportInput)
    if (!input) throw new Error("No .mimod import input found")
    await input.uploadFile(path.resolve("public/demo-plugins/oscillator/oscillator.mimod"))

    await page.waitForSelector('button[aria-label="Abrir Oscillator"]')
    await page.click('button[aria-label="Abrir Oscillator"]')
    await page.waitForSelector(functionalSelectors.pluginOscillatorWorkspace)

    await page.click(functionalSelectors.pluginOscillatorWaveSquare)
    await page.click(functionalSelectors.pluginOscillatorMotionVibrato)
    await page.click(functionalSelectors.pluginOscillatorMotionShapeStep)
    await page.click(functionalSelectors.pluginOscillatorPreview)
    await page.waitForFunction(() => document.body.textContent?.includes("Oscillator"))

    const bodyText = await page.evaluate(() => document.body.textContent ?? "")
    expect(bodyText).toContain("Oscillator")
    expect(bodyText).toContain("Motion")
    expect(bodyText).toContain("Motion Shape")
    expect(bodyText).toContain("vibrato")
    expect(bodyText).toContain("step")
    expect(bodyText).not.toContain("Send phrase")
    expect(bodyText).not.toContain("Root")
    expect(bodyText).not.toContain("Octave")
  }, 60_000)
})
