import type { Viewport } from "puppeteer"

export const functionalViewports = {
  desktop: {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
  },
  mobilePortrait: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
} satisfies Record<string, Viewport>
