# Reglas de Diseño UI — MiMIDI

## Regla: Dos menús, una línea

En todas las vistas de la app (excepto `/lab` y `/catalog`) el header siempre tiene exactamente **dos zonas de menú**, ambas en una sola línea sin wrapping:

1. **Menú de navegación** (`app-mode-nav`) — izquierda del header. Botones para cambiar entre vistas (Piano, SMC Pad, Plugins, Editor, Ajustes).
2. **Menú de opciones de vista** — cada vista tiene su propia toolbar dentro del contenido de la vista (p. ej. `perform-mode-toolbar`, `app-mock-toolbar`). Contiene los controles específicos de esa vista.

### Restricciones

- Ambas zonas **siempre deben caber en una sola línea**. Si un control no cabe, hay que integrarlo en uno de los grupos existentes, no dejarlo caer a una segunda línea.
- El transporte (grabar/reproducir) y los controles de parámetro (OCT, ARP) se agrupan juntos con separadores visuales dentro del mismo bloque — no en filas separadas.

### Botón de tres puntos (⋮)

- Se ubica en el **extremo derecho** del header, después del botón de pantalla completa.
- Al pulsarlo abre un modal específico de la vista activa (`settingsOpen` / `onSettingsClose`).
- En el futuro reemplazará al botón de pantalla completa.

### Estructura del header

```
[ brand ] ←————————————————————————————→ [ nav ] [ fullscreen ] [ ⋮ ]
```

### Props estándar para modales de vista

Cada Screen recibe:
- `settingsOpen: boolean`
- `onSettingsClose: () => void`

Estos se gestionan en `AppMode.tsx` y se pasan vía `resolveScreen`. El modal de cada vista define su propio contenido en `*Screen.tsx`.

**Excepción — Edit view:** el `AppDialog` de la vista Edit lo renderiza `LabApp` internamente, no `EditScreen`. El flujo de props es: `AppMode → EditScreen → EditWorkspace → LabApp → AppDialog`. El contenido del modal son: duración del timeline e inicio compacto.

---

## Regla: Iconos — usar Lucide React

Todos los iconos nuevos deben usar `lucide-react` (MIT, tree-shakeable). No crear SVGs inline nuevos.

```tsx
import { Trash2 } from "lucide-react"
<Trash2 size={16} />
```

Los iconos activos se documentan en `/catalog` en la sección "Iconos — Lucide React".

---

## Regla: Tamaño de iconos en `.app-mock-toolbar` — trampa de especificidad

### El problema

Los botones `ui-icon-btn` dentro de `.app-mock-toolbar` tienen los íconos visualmente pequeños aunque el SVG tenga un `size` correcto. La causa son **dos conflictos de especificidad en cascada**:

**1. El padding comprime el área de contenido**

`.app-theme-classic button { padding: 0.58rem 0.82rem }` tiene especificidad **(0,1,1)** y gana sobre `.ui-icon-btn { padding: 0 }` que tiene **(0,1,0)**. Con `box-sizing: border-box`, ese padding reduce el área disponible para el ícono dentro del botón de tamaño fijo.

**2. El tamaño del SVG lo controla CSS, no el prop `size`**

Lucide React graba `width="N"` como atributo SVG, pero CSS tiene prioridad sobre atributos de presentación SVG. La regla `.ui-icon-btn svg { width: 1.35rem }` de `ui-library.css` es la que realmente controla el tamaño visible, no el `size={18}` del JSX.

### La solución

En `appModeCatalog.css`, el selector `.app-mock-toolbar .ui-icon-btn` tiene especificidad **(0,2,0)** que sí gana sobre `.app-theme-classic button` **(0,1,1)**:

```css
/* appModeCatalog.css */
.app-mock-toolbar .ui-icon-btn {
  width: 2.15rem;
  height: 2.15rem;
  padding: 0;           /* ← crítico: neutraliza el padding del tema */
  border-radius: 0.75rem;
}

.app-mock-toolbar .ui-icon-btn svg {
  width: 1.45rem !important;   /* ← !important porque ui-library.css se carga después */
  height: 1.45rem !important;
}
```

Y el tamaño base global del SVG se controla en `ui-library.css`:

```css
.ui-icon-btn svg {
  width: 1.35rem;   /* ← cambiar aquí para ajustar tamaño global de ui-icon-btn */
  height: 1.35rem;
}
```

### Para cambiar el tamaño de los iconos en la toolbar

- **Solo toolbar**: cambiar `width`/`height` en `.app-mock-toolbar .ui-icon-btn svg` en `appModeCatalog.css`
- **Todos los `ui-icon-btn`**: cambiar en `.ui-icon-btn svg` en `ui-library.css`
- El `size={N}` en JSX de Lucide **no tiene efecto real** mientras exista la regla CSS — se puede ignorar o mantener como referencia visual

---

## Regla: Toggle global visual — data-attribute en raíz

Para toggles visuales globales (ej. mostrar/ocultar etiquetas del piano) usar `data-*` en el elemento raíz de `AppMode` + selector CSS. **No** propagar la prop por el árbol de componentes.

```tsx
// AppMode.tsx
<section data-show-key-labels={showKeyLabels ? undefined : "false"}>
```

```css
/* PianoPreview.css */
[data-show-key-labels="false"] .piano-key-label { visibility: hidden; }
```

---

## Regla: Especificidad CSS — teclas de piano

`.app-theme-classic button` tiene especificidad (0,1,1) y pisa `.piano-key-sharp` (0,1,0). Para sobreescribir color/fondo de teclas dentro de un workspace, usar `.perform-workspace .piano-key-sharp` (0,2,1) o mayor.

---

## Regla: Toolbar de la vista Edit — una sola línea

El orden fijo de controles en la toolbar del editor de timeline:

```
[NOTAS|TRACKS] [select pista*] [rango] [▶/■] | [SNAP] [paso*] [↩] [↪] [🗑*]
```

`*` = visible solo en modo NOTAS o cuando aplica.

El modal 3-puntos de esta vista contiene: duración del timeline + ajustar al contenido + compactar inicio.
