# App Expo actual en `apps/mimidi-expo`

Este documento deja por escrito el estado real de la app Expo creada dentro del
workspace para empujar el modo app de MiMIDI.

Su funcion no es vender la app como si ya estuviera integrada al core, sino
dejar claro:

- que existe hoy dentro de `apps/`,
- que papel cumple realmente,
- que cosas si estan construidas,
- que cosas aun no funcionan,
- y como debe convivir con la app web actual.

## 1. Estado real

Hoy existe una app Expo separada en:

- `apps/mimidi-expo`

Esta app ya no es una idea futura. Ya fue creada con Expo Router y ya contiene
una primera bajada visual del modo app.

Pero su estado actual debe describirse con precision:

- **no es aun la app funcional principal de MiMIDI**;
- **no esta conectada al motor musical del proyecto web**;
- **no reproduce audio ni usa aun el dominio real de proyecto, MIDI o plugins**;
- **funciona hoy como prototipo de UI y navegacion para el modo app**.

En otras palabras:

- la app web en `src/` sigue siendo la fuente principal del comportamiento real;
- la app Expo en `apps/mimidi-expo` es una segunda superficie en fase de
  prototipo visual/estructural.

## 2. Objetivo de crear Expo ahora

Expo se creo para adelantar el modo app sin esperar a cerrar toda la migracion
del shell web y sin obligar a meter React Native dentro del `src/` actual.

La intencion real hoy es:

1. validar layout del modo app;
2. bajar mockups a una superficie movil/nativa o web mobile;
3. explorar navegacion por tabs y experiencia tipo app;
4. definir que partes del producto convendra compartir mas adelante;
5. evitar que toda la exploracion visual quede atrapada dentro del laboratorio
   web.

## 3. Regla activa de orientacion

La direccion actual del prototipo Expo debe ser:

- **modo horizontal primero**

Eso significa:

- el objetivo actual no es soportar bien vertical y horizontal al mismo tiempo;
- el layout prioritario debe pensarse para una composicion horizontal tipo app;
- el modo vertical puede explorarse despues, pero no debe gobernar la
  implementacion base de esta etapa.

Implementacion actual:

- `app.json` ya esta alineado a:
  - `orientation: "landscape"`
- la app muestra un aviso de rotacion cuando se abre en vertical;
- el workspace principal solo se expone en horizontal durante esta etapa.

## 4. Lo que existe hoy en `apps/mimidi-expo`

### 4.1 Base tecnica

La app fue creada con:

- `expo`
- `expo-router`
- React Native
- tabs basadas en router

Archivos base relevantes:

- `apps/mimidi-expo/package.json`
- `apps/mimidi-expo/app.json`
- `apps/mimidi-expo/app/_layout.tsx`
- `apps/mimidi-expo/app/(tabs)/_layout.tsx`

### 4.2 Pantallas actuales

Hoy existen estas rutas/pantallas en Expo:

- `index`
- `edit`
- `plugins`
- `smc-pad`
- `settings`

Y dentro de `src/` de la app Expo ya existen piezas separadas por capacidad:

- `src/features/perform/PerformPrototypeScreen.tsx`
- `src/features/smc-pad/SmcPadPrototypeScreen.tsx`
- `src/features/plugins/PluginsPrototypeScreen.tsx`
- `src/features/edit/EditPrototypeScreen.tsx`
- `src/features/settings/SettingsPrototypeScreen.tsx`
- `src/components/PrototypeShell.tsx`
- `src/components/PrototypeUI.tsx`
- `src/navigation/appTabs.ts`

### 4.3 Estado funcional de las vistas

#### `index`

`index` monta:

- `PerformPrototypeScreen`

Esta pantalla ya tiene trabajo visual real y queda como referencia del frente
Expo.

#### `edit`

Ya no es placeholder puro.

Hoy muestra:

- toolbar base
- timeline de notas prototipo
- preview de timeline de tracks como siguiente superficie

#### `plugins`

Ya no es placeholder puro.

Hoy muestra:

- acciones `IMPORT` y `PLUGIN FOLDER`
- lista visual de plugins mock
- estados activos/inactivos simulados

#### `smc-pad`

Ya no es placeholder puro.

Hoy muestra:

- selectores de kit y ajuste
- grilla visual 2x4 de pads

#### `settings`

Ya no es placeholder puro.

Hoy muestra:

- idioma
- tema
- audio
- MIDI

## 5. Problemas reales detectados al analizar Expo

### 5.1 Base de tabs ya corregida

El archivo:

- `apps/mimidi-expo/app/(tabs)/_layout.tsx`

ya quedo alineado con las rutas reales:

- `index`
- `smc-pad`
- `plugins`
- `edit`
- `settings`

La tab bar nativa queda oculta y la navegacion visible pasa por el shell visual
propio del prototipo.

### 5.2 README de Expo ya adaptado

`apps/mimidi-expo/README.md` ya describe:

- rol de Expo dentro del proyecto
- regla horizontal
- pantallas actuales
- alcance de esta etapa

### 5.3 Sin integracion al core real

La app Expo no usa hoy:

- el motor de audio de la app web;
- el dominio de proyecto;
- el sistema real de timeline;
- el sistema real de plugins internos;
- la reproduccion/exportacion del proyecto principal.

Eso significa que hoy no debe venderse como "MiMIDI funcionando en Expo", sino
como:

- prototipo de modo app con una primera pantalla aterrizada y varias pantallas
  pendientes.

## 6. Decision tecnica actual sobre Expo

La decision vigente pasa a ser esta:

- `apps/mimidi-expo` existe y se conserva;
- su rol actual es **prototipo paralelo del modo app**;
- no reemplaza todavia la app web;
- no es aun la nueva fuente de verdad del producto.

Traduccion operativa:

- el comportamiento real del sistema sigue viviendo principalmente en la app
  web;
- Expo sirve hoy para validar shell, navegacion, layout y mockups;
- la integracion profunda con el core se deja para despues de estabilizar la
  estructura de pantallas y la direccion visual.

## 7. Relacion correcta entre web y Expo

### App web actual

Responsabilidad principal:

- comportamiento real del proyecto musical

Incluye hoy:

- timeline
- pistas
- mezcla
- exportacion
- arpegiador
- plugins internos
- laboratorio vivo
- shell web del modo app en migracion

### App Expo actual

Responsabilidad principal:

- exploracion del modo app como experiencia de interfaz

Incluye hoy:

- shell visual propio con navegacion superior
- tema inicial compartido para el prototipo
- `Perform` real de referencia
- `SMC Pad`, `Plugins`, `Edit` y `Settings` como prototipos visuales iniciales

## 8. Restricciones activas para seguir trabajando en Expo

1. No duplicar el core musical dentro de Expo sin una estrategia clara.
2. No describir Expo como app ya funcional si sigue siendo prototipo.
3. Mantener Expo fuera de `src/` del proyecto web.
4. Priorizar horizontal primero.
5. Mantener una sola fuente visual compartida (`PrototypeShell` +
   `PrototypeUI`) antes de fragmentar estilos.
6. Documentar cada avance real de `apps/mimidi-expo` en `docs/05`.

## 9. Siguiente paso recomendado

Orden recomendado inmediato:

1. consolidar `PerformPrototypeScreen` como referencia visual horizontal;
2. pulir densidad, proporciones y detalle de `Plugins` y `Settings`;
3. decidir si `Edit` se queda un tiempo como vista unica de timelines o se
   separa despues en notas/tracks;
4. bajar `Sampler` como siguiente pantalla visible cuando haga sentido;
5. solo despues evaluar que parte del estado o de la logica de producto merece
   compartirse entre web y Expo.

## 10. Resumen corto

Hoy MiMIDI ya tiene una app Expo dentro de `apps/`, pero no es aun una app
funcional del producto completo.

Su estado correcto es:

- **prototipo paralelo del modo app**
- **horizontal primero**
- **cinco pantallas visibles dentro del shell Expo**
- **`Perform` como referencia visual principal**
- **`SMC Pad`, `Plugins`, `Edit` y `Settings` como prototipos iniciales**
- **sin integracion profunda con el core web todavia**

Ese es el punto de partida real que debe guiar las siguientes iteraciones.
