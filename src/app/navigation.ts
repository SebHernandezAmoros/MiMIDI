export function navigateTo(target: string) {
  const currentUrl = `${window.location.pathname}${window.location.search}`

  if (currentUrl === target) {
    return
  }

  window.history.pushState({}, "", target)
  window.dispatchEvent(new PopStateEvent("popstate"))
}
