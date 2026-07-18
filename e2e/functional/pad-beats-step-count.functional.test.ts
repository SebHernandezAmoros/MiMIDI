import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
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

function firstBeatRowCellCountScript() {
  return Array.from(
    document.querySelectorAll('[data-e2e="pad-beats-cell"][data-row="0"]'),
  ).length
}

describe("functional pad beats step count", () => {
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

  it("keeps the selected Beats step count after leaving and returning", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "pad"))

    await page.click(functionalSelectors.padModeBeats)
    await page.waitForSelector(functionalSelectors.padBeatsCell)
    await page.click(functionalSelectors.viewOptionsButton)
    await page.waitForSelector(functionalSelectors.padStepCount12)
    await page.click(functionalSelectors.padStepCount12)

    const initialCellCount = await page.evaluate(firstBeatRowCellCountScript)
    expect(initialCellCount).toBe(12)

    await page.goto(appViewUrl(app.url, "edit"), { waitUntil: "domcontentloaded" })
    await page.waitForSelector(activeNavSelector("Edit"))

    await page.goto(appViewUrl(app.url, "pad"), { waitUntil: "domcontentloaded" })
    await page.waitForSelector(activeNavSelector("Pad"))
    await page.click(functionalSelectors.padModeBeats)
    await page.waitForSelector(functionalSelectors.padBeatsCell)

    const restoredCellCount = await page.evaluate(firstBeatRowCellCountScript)
    expect(restoredCellCount).toBe(12)
  })
})
