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
- **ya tiene primer audio local prototipo en web y native, pero no usa aun el
  dominio real de proyecto, MIDI o plugins**;
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

Ademas, ya cuenta con primer comportamiento local real:

- grabacion mock `idle / recording`
- agregar track
- cambiar track activo
- cambiar octava
- activar nota desde el teclado
- reflejar estado activo en el panel inferior
- primer sonido sintetico real del teclado en entorno web
- primer sonido sintetico real del teclado en entorno native

#### `edit`

Ya no es placeholder puro.

Hoy muestra:

- toolbar base con cambios mock de vista y rango
- timeline de notas prototipo con playhead movible
- seleccion local de nota
- preview de timeline de tracks con estados `mute / solo`
- resumen local del estado de edicion

#### `plugins`

Ya no es placeholder puro.

Hoy muestra:

- acciones `IMPORT` y `PLUGIN FOLDER`
- lista visual de plugins mock
- seleccion local de plugin
- activar/desactivar plugins con estado local
- resumen del rack activo y detalle del plugin seleccionado

#### `smc-pad`

Ya no es placeholder puro.

Hoy muestra:

- selectores de kit y ajuste
- grilla visual 2x4 de pads

#### `settings`

Ya no es placeholder puro.

Hoy muestra:

- idioma ciclico local
- tema mock con switch
- salida de audio mock
- estado MIDI mock
- resumen local de preferencias de sesion

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

Pero ya no es solo maqueta visual en `Perform`: ahora existe un primer nivel de
estado local funcional y un primer sonido sintetico real tanto en web como en
native, sin compartir todavia dominio real con la app web.

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

## 6.1 Decision estrategica mas reciente

La decision activa mas reciente del proyecto cambia el peso de Expo dentro del
workspace:

- Expo queda **congelado por ahora**;
- Expo entra en **posible purga**;
- no se seguira invirtiendo producto ahi mientras el frente web no quede mas
  maduro;
- la prioridad inmediata vuelve a ser la app web, especialmente su modo app y
  su responsive guiado por mockups.

Lectura operativa:

- `apps/mimidi-expo` no se borra todavia;
- pero deja de ser frente activo de iteracion diaria;
- su existencia pasa a servir solo como referencia de lo ya explorado;
- cualquier nuevo esfuerzo fuerte debe ir primero al web.

Motivo de esta decision:

- empezar de cero desde Expo hoy seria una inversion pobre frente al avance
  funcional ya acumulado en web;
- el responsive web puede absorber gran parte del objetivo del modo app sin
  perder el dominio real ya construido;
- si luego nace un modulo mobile serio, deberia apoyarse en lo validado en web
  y, mas adelante, en un core compartido mejor extraido.

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
- `Plugins`, `Settings` y `Edit` con primer estado local funcional

## 7.1 Las 4 capas para replicar web hacia Expo

La forma mas facil de entender esta migracion es:

- no se copia toda la app web tal cual;
- se replica por capas;
- algunas capas se comparten o adaptan;
- otras capas se rehacen en Expo.

### Capa 1 - Producto

Que es:

- la estructura general de la experiencia
- el mapa de pantallas
- la organizacion funcional del producto

Ejemplos:

- `Perform`
- `Edit`
- `Project`
- `Plugins`
- `Settings`
- `SMC Pad`

Que hacemos con esta capa:

- **si se replica en Expo**

Lectura simple:

- aqui copiamos la idea del producto, no los componentes web.

### Capa 2 - Dominio puro

Que es:

- modelos
- tipos
- reglas de negocio que no dependen de navegador ni de layout

Ejemplos:

- tracks
- notas
- octavas
- seleccion de pista
- estado del proyecto
- parte del modelo de timeline
- contratos de plugins

Que hacemos con esta capa:

- **luego se puede compartir o adaptar**

Lectura simple:

- esta es una de las mejores candidatas para viajar desde web a Expo cuando
  este suficientemente limpia.

### Capa 3 - Casos de uso

Que es:

- la logica que coordina acciones del producto
- la forma en que el usuario provoca cambios de estado

Ejemplos:

- cambiar pista activa
- agregar track
- activar o desactivar plugin
- seleccionar nota
- cambiar octava
- detener reproduccion

Que hacemos con esta capa:

- **se puede migrar parcialmente**

Lectura simple:

- parte ya puede vivir en Expo con estado local;
- luego puede alinearse o compartirse con web si conviene.

### Capa 4 - UI e infraestructura

Que es:

- render visual concreto
- componentes de plataforma
- estilos
- audio e integraciones dependientes del runtime

Ejemplos:

- DOM y CSS de web
- componentes React pensados para navegador
- `Web Audio API`
- layout HTML/CSS del timeline web
- componentes React Native / Expo

Que hacemos con esta capa:

- **no se copia tal cual**
- **se rehace o se adapta fuerte en Expo**

Lectura simple:

- esta es la capa menos portable;
- aqui casi siempre se reconstruye la experiencia segun la plataforma.

## 7.2 Resumen facil

La version corta es esta:

1. `Producto`
   - si lo replicamos en Expo
2. `Dominio`
   - luego lo compartimos o adaptamos
3. `Casos de uso`
   - parte ya puede pasar a Expo
4. `UI e infraestructura`
   - eso se rehace en Expo

## 7.3 Regla practica de trabajo

Cuando dudemos si algo debe pasar de web a Expo, usamos esta regla:

- si define la experiencia del producto:
  - va hacia Expo
- si es dominio puro:
  - se evalua para compartir
- si es logica de accion sin dependencia de plataforma:
  - se puede adaptar pronto
- si es UI web o infraestructura web:
  - no se copia, se rehace

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

1. consolidar el modo app web como frente principal del producto;
2. llevar el responsive web a una fidelidad alta contra los mockups actuales;
3. terminar de aterrizar en web las vistas ya abiertas:
   - `Perform`
   - `SMC Pad`
   - `Plugins`
   - `Settings`
   - `Edit / Timelines`
4. documentar en `docs/05` cada ajuste importante de layout, jerarquia o
   alcance;
5. preparar una salida publica temprana de la version web para mostrar y
   probar;
6. reevaluar despues si conviene extraer un core compartido para un futuro
   modulo mobile.

## 9.1 Dudas abiertas para revisar

Estas son las preguntas reales que siguen abiertas y no deben perderse:

1. Si conviene mantener Expo como app paralela o pasar a un monorepo mas limpio
   con:
   - `apps/web`
   - `apps/app`
   - `packages/core`
2. Si el modo responsive web puede cubrir primero buena parte del objetivo
   mobile antes de abrir otra app.
3. Si la primera publicacion visible debe ser:
   - demo web publica
   - build de app mas adelante
4. Como volver compatibles los plugins entre web y app sin atar la UI a una
   sola plataforma.

## 10. Resumen corto

Hoy MiMIDI ya tiene una app Expo dentro de `apps/`, pero no es aun una app
funcional del producto completo.

Su estado correcto es:

- **prototipo paralelo del modo app**
- **horizontal primero**
- **cinco pantallas visibles dentro del shell Expo**
- **`Perform` como referencia visual principal**
- **`Perform` con primer audio local en web y native**
- **`SMC Pad` como prototipo visual inicial**
- **`Plugins`, `Settings` y `Edit` con primer estado local funcional**
- **sin integracion profunda con el core web todavia**
- **y congelado por ahora mientras la prioridad vuelve al web responsive**

Ese es el punto de partida real que debe guiar las siguientes iteraciones.
