# Catalogo de Componentes UI

## Estado

Libreria visual activa. Los primitivos viven en `src/app/styles/ui-library.css`
y se visualizan en vivo en la ruta `/catalog` del servidor de desarrollo.

## Objetivo

Evitar que cada vista resuelva por su cuenta:

- pills y botones de accion
- icon buttons
- toggles y checkboxes
- listas con icon + label + valor + chevron
- grids de pads (SMC)
- contadores/steppers
- selects estilizados
- dialogs anchos y estandar

## Archivo principal

`src/app/styles/ui-library.css`

Importado automaticamente desde `src/app/styles/appModeCatalog.css`.

## Sistema de tokens

Dos modos declarados con CSS custom properties:

```css
:root, [data-ui-theme="light"] { ... }  /* modo claro por defecto */
[data-ui-theme="dark"], .ui-dark { ... } /* modo oscuro */
```

Para invertir colores en un bloque: agregar `data-ui-theme="dark"` al
contenedor padre. No requiere cambios en componentes hijos.

### Tokens disponibles

| Token | Descripcion |
|---|---|
| `--ui-color-text` | Texto principal |
| `--ui-color-text-muted` | Texto secundario / placeholders |
| `--ui-color-accent` | Rojo record / estados activos |
| `--ui-color-surface` | Fondo de tarjetas y filas |
| `--ui-color-surface-raised` | Superficie elevada |
| `--ui-color-surface-inset` | Superficie hundida / hover |
| `--ui-color-border` | Borde suave general |
| `--ui-color-border-strong` | Borde de mayor contraste |
| `--ui-btn-bg` | Gradiente de boton normal |
| `--ui-btn-shadow` | Sombra interna de boton |
| `--ui-btn-active-bg` | Gradiente de boton presionado |
| `--ui-btn-active-shadow` | Sombra de boton presionado |
| `--ui-toggle-off` / `-on` / `-thumb` | Toggle switch |
| `--ui-smc-accent-kick/snare/hat/clap/perc` | Colores de pad SMC |
| `--ui-radius-sm/md/lg/pill` | Radios de borde |

## Componentes

### ui-badge

Cuadrado pequeño con etiqueta (ej: "MC", "MR" en lista de plugins).

```html
<span class="ui-badge">MC</span>
```

Ubicacion: `src/features/plugins-view/PluginsWorkspace.tsx`

---

### ui-toggle

Switch tipo iOS para estados on/off.

```html
<label class="ui-toggle">
  <input type="checkbox">
  <span></span>
</label>
```

Ubicaciones:
- `src/features/settings-view/SettingsScreen.tsx` (modo oscuro)
- `src/features/plugins-view/PluginsWorkspace.tsx` (activar/desactivar plugin)

---

### ui-checkbox

Checkbox cuadrado con checkmark grafico.

```html
<label class="ui-checkbox">
  <input type="checkbox">
  <span></span>
</label>
```

Disponible en catalogo. Pendiente de uso en vistas.

---

### ui-list-row / ui-list-section

Fila de lista con icono + label + valor + chevron.
Agrupable con `ui-list-section` + `ui-list-section-title`.

```html
<section class="ui-list-section">
  <span class="ui-list-section-title">AUDIO</span>
  <button class="ui-list-row">
    <span class="ui-list-icon">A</span>
    <span class="ui-list-label">Salida de Audio</span>
    <span class="ui-list-value">Dispositivo</span>
    <span class="ui-list-arrow">›</span>
  </button>
</section>
```

Variantes:
- `.ui-list-row-static` — sin cursor, para filas con controles internos
- `.ui-list-row-plugin` — layout badge + copy + toggle + arrow

Ubicacion: `src/features/settings-view/SettingsScreen.tsx`

---

### ui-plugin-copy

Bloque de texto de dos lineas para filas de plugin.

```html
<div class="ui-plugin-copy">
  <strong>M Compressor</strong>
  <span>v1.0.0 · Dynamics</span>
</div>
```

Ubicacion: `src/features/plugins-view/PluginsWorkspace.tsx`

---

### ui-smc-grid / ui-smc-btn

Grid 4x2 de pads del SMC Pad. Los botones tienen variantes de acento
por tipo de sonido.

```html
<div class="ui-smc-grid">
  <button class="ui-smc-btn ui-smc-btn-kick">
    <span class="ui-smc-btn-num">1</span>
    <span class="ui-smc-btn-label">KICK</span>
    <span class="ui-smc-btn-desc">Golpe grave</span>
  </button>
  <!-- ... -->
</div>
```

Clases de acento: `ui-smc-btn-kick`, `ui-smc-btn-snare`,
`ui-smc-btn-hat`, `ui-smc-btn-clap`, `ui-smc-btn-perc`.

Ubicacion: `src/features/sampler/SamplerScreen.tsx`

---

### ui-pill-btn

Boton capsula con texto. Accion principal o selector.

```html
<button class="ui-pill-btn">+ TRACK</button>
<button class="ui-pill-btn ui-pill-btn-active">VIBRATO LEAD</button>
<button class="ui-pill-btn ui-pill-btn-accent">ACCENT</button>
```

Ubicacion: `src/features/plugins-view/PluginsWorkspace.tsx`

---

### ui-icon-btn

Boton circular con solo un icono SVG.

```html
<button class="ui-icon-btn">
  <svg viewBox="0 0 24 24">...</svg>
</button>
```

Ubicaciones:
- `src/features/edit/EditWorkspace.tsx` (buscar)
- `src/features/sampler/SamplerScreen.tsx` (reset)

---

### ui-counter

Control de incremento/decremento: `-` valor `+`.

```html
<div class="ui-counter">
  <button class="ui-counter-btn">−</button>
  <span class="ui-counter-value">4</span>
  <button class="ui-counter-btn">+</button>
</div>
```

Disponible en catalogo. Pendiente de extraccion desde `PerformResponsiveToolbar`.

---

### ui-track-pill

Selector de pista con flechas: `< TRACK 1 >`.

```html
<div class="ui-track-pill">
  <button class="ui-icon-btn">‹</button>
  <span class="ui-track-pill-display">TRACK 1</span>
  <button class="ui-icon-btn">›</button>
</div>
```

Disponible en catalogo. Pendiente de extraccion desde `PerformResponsiveToolbar`.

---

### ui-select

Select estilizado que respeta el tema claro/oscuro.

```html
<select class="ui-select">
  <option>NOTAS</option>
  <option>TRACKS</option>
</select>
```

Ubicaciones:
- `src/features/edit/EditWorkspace.tsx`
- `src/features/sampler/SamplerScreen.tsx`

---

### ui-toolbar / ui-toolbar-group

Barra de herramientas horizontal con grupos de controles.

```html
<div class="ui-toolbar">
  <div class="ui-toolbar-group">...</div>
  <div class="ui-toolbar-group">...</div>
</div>
```

Pendiente de extraccion desde `PerformResponsiveToolbar`.

---

### app-dialog-wide

Modificador del dialog estandar para contenido de dos columnas.
Se aplica junto con `.app-dialog`.

```tsx
<AppDialog className="app-dialog-wide" ... />
```

Ubicacion: `src/features/perform/components/PerformInstrumentDialog.tsx`

## Catalogo visual

Ruta de desarrollo: `http://localhost:5173/catalog`

Muestra todos los componentes en modo claro y oscuro con toggle interactivo.
Permite verificar visualmente los tokens y variantes antes de usarlos en vistas.

## Componentes listos para extraer (siguiente iteracion)

Estos existen embebidos en `PerformResponsiveToolbar` pero no aun como
primitivos independientes:

1. `ui-counter` — control de octava (ya definido en libreria, pendiente de usar)
2. `ui-track-pill` — selector de pista (ya definido, pendiente de usar)
3. `ui-toolbar` — barra de toolbar del Perform (ya definido, pendiente de migrar)

## Regla de la libreria

- Si un patron aparece en dos vistas, pasa a `ui-library.css`.
- Si solo existe en una vista, primero se estabiliza en su CSS local.
- El catalogo en `/catalog` es la fuente de verdad visual de los primitivos.
