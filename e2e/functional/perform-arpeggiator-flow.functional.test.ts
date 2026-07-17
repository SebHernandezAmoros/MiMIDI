import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import type { Browser, Page } from "puppeteer"
import {
  startFunctionalAppServer,
  type FunctionalAppServer,
} from "../helpers/appServer"
import { launchFunctionalBrowser, newFunctionalPage } from "../helpers/browser"
import {
  appViewUrl,
  functionalSelectors,
  pianoKeySelector,
} from "../helpers/selectors"
import {
  recordPageConsole,
  type PageConsoleRecorder,
} from "../helpers/pageConsole"
import { prepareCleanAppPage } from "../helpers/storage"
import { functionalViewports } from "../helpers/viewports"

describe("functional perform arpeggiator flow", () => {
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

  it("activates ARP, switches to chord mode, and triggers it from C4", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "piano"))

    await page.click(functionalSelectors.viewOptionsButton)
    await page.waitForSelector(functionalSelectors.performSettingsArpToggle)
    await page.click(functionalSelectors.performSettingsArpToggle)
    await page.click(functionalSelectors.performSettingsChordMode)

    const chordModePressed = await page.$eval(
      functionalSelectors.performSettingsChordMode,
      (button) => button.getAttribute("aria-pressed"),
    )
    expect(chordModePressed).toBe("true")

    await page.evaluate(() => {
      const backdrop = document.querySelector('[data-tutorial="dialog-close"]') as HTMLElement | null
      backdrop?.click()
    })

    await page.waitForSelector(pianoKeySelector("C4"))
    const key = await page.$(pianoKeySelector("C4"))
    const box = await key?.boundingBox()
    expect(box).toBeTruthy()

    if (!box) {
      return
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()

    await page.waitForFunction(() =>
      document.body.textContent?.includes("Arpegiador up activo en Track 1."),
    )

    await new Promise((resolve) => setTimeout(resolve, 5_000))
    await page.mouse.up()
  })
})
