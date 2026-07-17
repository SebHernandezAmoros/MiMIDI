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
} from "../helpers/selectors"
import {
  recordPageConsole,
  type PageConsoleRecorder,
} from "../helpers/pageConsole"
import { prepareCleanAppPage } from "../helpers/storage"
import { functionalViewports } from "../helpers/viewports"

describe("functional perform arpeggiator", () => {
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

  it("exposes arpeggiator and note/chord controls from Perform options", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "piano"))

    await page.click(functionalSelectors.viewOptionsButton)
    await page.waitForSelector(functionalSelectors.performSettingsArpToggle)

    const initialPressed = await page.$eval(
      functionalSelectors.performSettingsArpToggle,
      (button) => button.getAttribute("aria-pressed"),
    )
    expect(initialPressed).toBe("false")

    await page.click(functionalSelectors.performSettingsArpToggle)

    const pressedAfterClick = await page.$eval(
      functionalSelectors.performSettingsArpToggle,
      (button) => button.getAttribute("aria-pressed"),
    )
    expect(pressedAfterClick).toBe("true")

    const noteModeInitial = await page.$eval(
      functionalSelectors.performSettingsNoteMode,
      (button) => button.getAttribute("aria-pressed"),
    )
    expect(noteModeInitial).toBe("true")

    await page.click(functionalSelectors.performSettingsChordMode)

    const chordModePressed = await page.$eval(
      functionalSelectors.performSettingsChordMode,
      (button) => button.getAttribute("aria-pressed"),
    )
    expect(chordModePressed).toBe("true")
  })
})
