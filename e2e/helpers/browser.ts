import puppeteer, { type Browser, type Page, type Viewport } from "puppeteer"

export async function launchFunctionalBrowser(): Promise<Browser> {
  const isHeaded = process.env.MIMIDI_E2E_HEADED === "true"

  return puppeteer.launch({
    headless: !isHeaded,
    slowMo: isHeaded ? 250 : 0,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  })
}

export async function newFunctionalPage(
  browser: Browser,
  viewport: Viewport,
): Promise<Page> {
  const page = await browser.newPage()
  await page.setViewport(viewport)
  return page
}
