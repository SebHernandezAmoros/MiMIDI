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
  functionalViews,
} from "../helpers/selectors"
import {
  recordPageConsole,
  type PageConsoleRecorder,
} from "../helpers/pageConsole"
import { prepareCleanAppPage } from "../helpers/storage"
import { functionalViewports } from "../helpers/viewports"

describe("functional smoke", () => {
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

  it("loads the app shell in a real browser", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "piano"))

    await page.waitForSelector(functionalSelectors.appWindow)
    await page.waitForSelector(activeNavSelector("Piano"))

    const title = await page.title()
    expect(title).toContain("MiMIDI")
  })

  it("opens every app mode view from a clean session", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "piano"))

    for (const view of functionalViews) {
      await page.goto(appViewUrl(app.url, view.id), { waitUntil: "domcontentloaded" })
      await page.waitForSelector(functionalSelectors.appContent)
      await page.waitForSelector(activeNavSelector(view.label))
    }
  })
})
