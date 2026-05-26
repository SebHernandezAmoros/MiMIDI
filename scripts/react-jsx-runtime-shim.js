// Shim para el automatic JSX transform de esbuild.
// El host expone React en globalThis.__MIMIDI_RUNTIME__.React
const R = globalThis.__MIMIDI_RUNTIME__.React
export const jsx = R.createElement
export const jsxs = R.createElement
export const Fragment = R.Fragment
