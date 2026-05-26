/**
 * Shim que redirige imports de 'react' al runtime inyectado por MiMIDI.
 *
 * Uso en esbuild:
 *   --alias:react=./scripts/react-shim.js
 *
 * El host llama a exposeRuntime() antes del import() dinámico, por lo que
 * globalThis.__MIMIDI_RUNTIME__ siempre está disponible al evaluar el módulo.
 */
const R = globalThis.__MIMIDI_RUNTIME__.React

export default R

export const {
  Children,
  Component,
  Fragment,
  PureComponent,
  StrictMode,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} = R
