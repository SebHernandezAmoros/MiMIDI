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

function editTracksUrl(baseUrl: string) {
  return `${baseUrl}?view=edit&lang=es&timelineView=tracks`
}

describe("functional pad beats timeline clarity", () => {
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

  it("shows programmed Beats and recorded Pads in separate Pad 1 timeline lanes", async () => {
    await prepareCleanAppPage(page, appViewUrl(app.url, "pad"))

    await page.click(functionalSelectors.padModeBeats)
    await page.waitForSelector(functionalSelectors.padBeatsCell)
    await page.click(functionalSelectors.padBeatsCell)

    await page.click(functionalSelectors.padModePads)
    await page.waitForSelector(functionalSelectors.padSmcKick)
    await page.click(functionalSelectors.padRecordButton)
    await page.click(functionalSelectors.padSmcKick)
    await page.click(functionalSelectors.padRecordButton)

    await page.goto(editTracksUrl(app.url), { waitUntil: "domcontentloaded" })
    await page.waitForSelector(activeNavSelector("Edit"))
    await page.waitForSelector(functionalSelectors.editTrackPercussionBeatsLane)
    await page.waitForSelector(functionalSelectors.editTrackPercussionPadsLane)

    const beatsLane = await page.$eval(
      functionalSelectors.editTrackPercussionBeatsLane,
      (element) => element.textContent ?? "",
    )
    const padsLane = await page.$eval(
      functionalSelectors.editTrackPercussionPadsLane,
      (element) => element.textContent ?? "",
    )

    expect(beatsLane).toContain("Pad 1 - Beats")
    expect(beatsLane).toContain("programado")
    expect(padsLane).toContain("Pad 1 - Pads")
    expect(padsLane).toContain("grabado")
  }, 60_000)
})
