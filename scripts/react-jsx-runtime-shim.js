// Shim para el automatic JSX transform de esbuild (React 17+ new JSX transform).
// El host expone React en globalThis.__MIMIDI_RUNTIME__.React
//
// IMPORTANTE: La firma del JSX runtime automático es:
//   jsx(type, props, maybeKey)  — props.children contiene los hijos
//   jsxs(type, props, maybeKey) — igual, children es un array
//
// No es lo mismo que React.createElement(type, config, ...children):
//   en createElement, el 3er argumento son HIJOS, no la key.
//   En el JSX runtime, la key llega como 3er argumento separado de props.children.
// Si se mapea jsx = createElement directamente, cualquier elemento con key=
// tiene sus hijos reemplazados por el valor de la key (bug silencioso).
const R = globalThis.__MIMIDI_RUNTIME__.React

function h(type, props, maybeKey) {
  const { children, ref, ...rest } = props != null ? props : {}
  if (maybeKey !== undefined) rest.key = maybeKey
  if (ref !== undefined) rest.ref = ref
  if (Array.isArray(children)) {
    return R.createElement(type, rest, ...children)
  }
  if (children !== undefined) {
    return R.createElement(type, rest, children)
  }
  return R.createElement(type, rest)
}

export const jsx = h
export const jsxs = h
export const Fragment = R.Fragment
