export const APP_HOME_ROUTE = "/"
export const APP_LAB_ROUTE = "/lab"

export type AppRoute = typeof APP_HOME_ROUTE | typeof APP_LAB_ROUTE

export function normalizeAppRoute(pathname: string): AppRoute {
  return pathname === APP_LAB_ROUTE ? APP_LAB_ROUTE : APP_HOME_ROUTE
}
