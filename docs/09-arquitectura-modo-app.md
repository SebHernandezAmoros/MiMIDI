# Arquitectura propuesta para el modo app de MiMIDI

Este documento deja el mapa de como deberia construirse el futuro `modo app`
de MiMIDI cuando dejemos atras el laboratorio monovista como interfaz principal.

La idea no es congelar la implementacion desde ahora, sino dejar una base clara
para:

- seguir extrayendo responsabilidad de `App.tsx`
- preparar multiples pantallas sin romper Screaming Architecture
- ordenar mejor plugins, timeline, exportacion y sampler
- facilitar que una futura iteracion en ChatGPT o Codex implemente la UI con
  menos caos

## 1. Decisiones base

### 1.1 Lo que sigue ahora

El siguiente foco real no es expandir mas plugins dentro de la monovista.

Lo que sigue es:

1. seguir sacando coordinacion de `App.tsx`
2. preparar la arquitectura del futuro modo app
3. definir como se parte la experiencia en pantallas horizontales
4. dejar a plugins complejos para cuando exista una UI mas ordenada

### 1.1.1 Regla de migracion desde el laboratorio

El laboratorio actual no se destruye ni se vacia.

Debe quedar siempre como:

- sandbox completo
- referencia funcional viva
- respaldo de comportamiento mientras las vistas nuevas maduran

La migracion correcta no es "mover todo y romper el laboratorio", sino:

1. conservar `LabApp` integro
2. replicar por vistas las capacidades del laboratorio
3. extraer logica compartida a hooks/use-cases
4. comparar cada vista nueva contra el laboratorio
5. solo cuando el modo app este maduro, dejar de depender del laboratorio como
   centro

### 1.2 Lo que se difiere

Se difiere para despues:

- segunda superficie extensible fuerte de plugins
- plugins que alteren acciones, timeline o UI
- pluginizacion de aspecto visual
- crecimiento fuerte del panel de plugins

La razon es simple: hoy el laboratorio sigue siendo demasiado denso para abrir
esa complejidad sin aumentar caos.

### 1.3 Direccion visual del modo app

Cuando llegue el modo app, la experiencia principal debe ser:

- horizontal
- mas cercana a una app de escritorio clasica
- con aire de `Mac OS` original, pero sin copiarlo literalmente

Eso implica una direccion aproximada como esta:

- barra superior o cabecera liviana
- navegacion horizontal por modulos
- panel principal ancho
- paneles laterales o inferiores segun contexto
- menos sensacion de formulario largo vertical

No significa hacer retro puro. Significa tomar de ahi:

- claridad de secciones
- lectura horizontal
- paneles bien delimitados
- jerarquia fuerte entre navegacion y workspace

### 1.3.1 Referencia visual concreta

La referencia visual base toma el espiritu de `Mac OS Classic`, pero sin
copiarlo de forma literal ni convertir la app en parodia retro.

Los principios visuales importantes son:

1. UI basada en bloques
2. bordes definidos
3. relieve falso tipo 3D en vez de sombras modernas
4. funcionalidad por encima de decoracion
5. contraste por grises y lineas, no por gigantismo
6. botones fisicos con sensacion tactil

### 1.3.2 Paleta base del shell

La UI debe poder construirse solo con estos 5 colores representativos, sin
necesidad de blanco puro:

- gris muy oscuro: `#2B2B2B`
- gris oscuro: `#555555`
- gris medio: `#808080`
- gris claro: `#C0C0C0`
- gris muy claro: `#E0E0E0`

Uso sugerido:

- `#2B2B2B`
  - texto fuerte
  - titulos
  - elementos activos de alto contraste
- `#555555`
  - bordes
  - separadores
  - parte oscura del relieve
- `#808080`
  - base estructural
  - barras
  - fondos secundarios
- `#C0C0C0`
  - fondos principales
  - superficie del shell
- `#E0E0E0`
  - luces del relieve
  - bordes superiores/izquierdos
  - estados levantados

### 1.3.3 Tipografia base

La referencia original usaria `Chicago`, pero como no esta disponible de forma
practica para este proyecto, la recomendacion principal es:

- `VT323`

Alternativa mas limpia y menos retro agresiva:

- `IBM Plex Mono`

La decision final puede depender del equilibrio entre:

- identidad retro
- legibilidad
- fatiga visual en pantallas largas

### 1.3.4 Regla de relieve

La ilusion de relieve debe construirse asi:

- arriba e izquierda:
  - gris muy claro
- abajo y derecha:
  - gris oscuro

Esto aplica a:

- botones
- tabs
- paneles
- bloques activos

No se deberia depender de:

- blur
- glassmorphism
- transparencias
- sombras modernas suaves
- animaciones blandas como base de jerarquia

### 1.3.5 Horizontal, pero no rigido

El modo app nace horizontal, pero no debe quedar tan cerrado que impida un modo
vertical despues.

Por eso, desde el principio conviene:

- separar shell, nav y workspace
- evitar coordenadas demasiado fijas
- usar wrappers y regiones reordenables
- pensar la navegacion como piezas que luego puedan apilarse

La idea es que el futuro modo vertical sea sobre todo una reorganizacion de
layout y botones, no una reescritura total del sistema.

### 1.4 Modo vertical, pero despues

Tambien deberia existir un `modo vertical`, pero no ahora.

Orden correcto:

1. primero consolidar el modo app horizontal
2. validar que shell, navegacion y pantallas funcionen bien
3. recien despues explorar un modo vertical como variacion de layout o plugin
   visual futuro

La idea es no abrir dos direcciones de UI grandes al mismo tiempo.

El objetivo tecnico es que el modo vertical luego sea una variacion de layout,
no una segunda app paralela.

### 1.5 Rutas base desde ahora

Desde esta etapa conviene separar rutas:

- `/` queda reservado para el futuro modo app principal
- `/lab` queda como hogar del laboratorio actual

Esto libera la raiz para construir el shell nuevo sin seguir mezclandolo con la
pantalla monovista heredada.

## 2. Pantallas propuestas

El modo app deberia dividirse en estas pantallas principales:

1. `Perform`
   - piano
   - control rapido de instrumento
   - arpegiador
   - mini `SMC Pad` o futuro `SMC Pad`
   - grabacion de toma

2. `Edit`
   - timeline de tracks
   - timeline de notas
   - seleccion/edicion de nota
   - herramientas de snap, duplicado, compactado

3. `Project`
   - nombre del proyecto
   - gestion de pistas
   - mezcla por pista
   - exportacion JSON / WAV
   - estados globales del proyecto

4. `Plugins`
   - manager visible de plugins
   - activacion/desactivacion
   - documentacion corta por plugin
   - luego: superficies nuevas aportadas por plugins

5. `Settings`
   - volumen maestro
   - preferencias generales
   - futuros parametros globales de audio o UI

6. `Sampler`
   - vista separada
   - no mezclada con el core matematico

## 3. Shell general recomendado

La app futura deberia tener un `AppShell` horizontal con esta idea:

```txt
+--------------------------------------------------------------+
| Top bar / Brand / Project status / Quick transport          |
+--------------------------------------------------------------+
| Nav horizontal: Perform | Edit | Project | Plugins | ...    |
+--------------------------------------------------------------+
| Workspace principal de la vista activa                      |
|                                                              |
|  segun vista:                                                |
|  - paneles laterales                                         |
|  - timeline                                                  |
|  - piano                                                     |
|  - mixer                                                     |
|  - plugin manager                                            |
|                                                              |
+--------------------------------------------------------------+
```

La clave es que la navegacion ya no viva mezclada dentro de la misma pagina
larga, sino en un shell estable.

En la etapa actual, la ruta `/` puede empezar como placeholder o home
estructural del shell, mientras `/lab` conserva el laboratorio real.

## 3.1 Shell preparado para horizontal y vertical

Aunque el primer objetivo sea horizontal, el shell deberia nacer ya dividido en
regiones semanticas:

- `topbar`
- `navigation`
- `workspace`
- `context panel` opcional

Si esa separacion existe desde ahora, el modo vertical despues puede surgir por
reordenamiento de regiones:

- nav arriba o lateral
- panel contextual a la derecha o debajo
- workspace expandido

No por recrear vistas desde cero.

## 4. Regla arquitectonica para construirlo

El modo app no debe organizarse por "componentes UI sueltos", sino por
capacidades de producto.

Eso significa seguir hablando de:

- audio
- midi
- project
- piano
- transport
- timeline
- plugins
- smc-pad
- sampler
- app-shell

No de:

- `components/common/form`
- `widgets/random`
- `helpers/ui-everywhere`

## 5. Estructura sugerida de carpetas

Esto no implica mover todo de golpe. Es una direccion:

```txt
src/
  app/
    AppShell.tsx
    app-routes.ts
    app-navigation.ts
    app-view-model.ts
    app-theme.ts
    app-i18n.ts

  engine/
    audio/
    midi/
    project/
    plugins/

  application/
    use-cases/

  features/
    perform/
      PerformScreen.tsx
      PerformWorkspace.tsx
    edit/
      EditScreen.tsx
      EditWorkspace.tsx
    project-view/
      ProjectScreen.tsx
      ProjectWorkspace.tsx
    plugins-view/
      PluginsScreen.tsx
      PluginsWorkspace.tsx
    settings-view/
      SettingsScreen.tsx
    sampler/
      SamplerScreen.tsx

    piano/
    timeline/
    transport/
    smc-pad/
    lab/
```

## 6. Como migrar sin romper todo

La migracion no deberia ser de golpe. El orden recomendado es:

### Paso 1. Seguir extrayendo `App.tsx`

Primero:

- sacar coordinacion restante a hooks/use-cases
- separar view-models
- reducir `App.tsx` a ensamblador del laboratorio
- identificar que partes del laboratorio pertenecen a:
  - `Perform`
  - `Edit`
  - `Project`

### Paso 2. Crear `AppShell` sin matar el laboratorio

Luego:

- crear `AppShell`
- crear navegacion horizontal minima
- mantener una vista que inicialmente siga montando partes del laboratorio
- dejar el laboratorio vivo en `/lab`
- dejar `/` libre para evolucionar el shell del modo app
- dejar el shell preparado para reordenarse despues a vertical

### Paso 3. Extraer la primera pantalla real

La primera pantalla recomendable es:

- `Edit`

porque ya tiene fronteras relativamente claras:

- timeline de tracks
- timeline de notas
- editor de nota

### Paso 3.1 Replicar, no vaciar

Cada pantalla nueva debe nacer replicando capacidades del laboratorio, no
arrancando desde cero y tampoco vaciando `LabApp`.

Orden recomendado de replica:

1. `Edit`
2. `Project`
3. `Perform`
4. `Plugins`

## 6.1 Plan de replicacion por vistas

### `Edit`

Debe absorber:

- timeline de tracks
- timeline de notas
- editor de nota
- snap
- compactar inicio
- historial de edicion visible

### `Project`

Debe absorber:

- resumen del proyecto
- nombre de proyecto y pista
- seleccion y gestion de pistas
- mezcla por pista
- automatizacion base
- exportacion JSON/WAV

### `Perform`

Debe absorber:

- piano
- seleccion de nota y acorde
- grabacion
- arpegiador
- `SMC Pad`

### `Plugins`

Debe absorber:

- manager visible de plugins
- informacion de procedencia
- luego: nuevas superficies extensibles

### Paso 4. Extraer `Project`

Despues:

- gestion de proyecto
- mezcla
- exportacion
- estado de plugins basico

### Paso 5. Extraer `Perform`

Luego:

- piano
- arpegiador
- `SMC Pad`
- grabacion

### Paso 6. Mover `Plugins` a vista propia

Recien ahi conviene crecer plugins como sistema mas ambicioso.

## 7. Como agregar archivos nuevos

Regla rapida:

### Si el archivo representa dominio

Debe ir en:

- `src/engine/...`

Ejemplos:

- modelo de proyecto
- contratos de plugin
- reglas de timeline

### Si coordina dominio con acciones reales

Debe ir en:

- `src/application/use-cases/...`

Ejemplos:

- reproducir notas grabadas
- exportar audio
- disparar golpe `SMC Pad`

### Si representa una capacidad visible del producto

Debe ir en:

- `src/features/...`

Ejemplos:

- pantalla `Edit`
- panel `Plugins`
- piano
- timeline

### Si representa infraestructura del shell o navegacion

Debe ir en:

- `src/app/...`

Ejemplos:

- `AppShell.tsx`
- tabs horizontales
- ruteo interno
- layout principal
- tema y tokens visuales
- configuracion de idioma

### Si representa contenido de idioma o traduccion

Debe vivir cerca de `src/app/` o en una carpeta dedicada de i18n, no enterrado
adentro de una vista puntual.

Objetivo:

- poder cambiar idioma sin reescribir componentes
- evitar strings regados por toda la app

## 7.1 Preparacion multilenguaje

Este proyecto deberia prepararse desde ahora para multiples idiomas.

No hace falta construir hoy todo el sistema final, pero si dejar la arquitectura
lista para:

- idioma por configuracion
- diccionarios por lenguaje
- claves estables de texto
- separacion entre texto y componentes

Recomendacion estructural:

```txt
src/
  app/
    app-i18n.ts
  i18n/
    es.ts
    en.ts
    index.ts
```

Reglas:

1. no hardcodear nuevos textos grandes en pantallas futuras
2. usar claves semanticas
3. centralizar el idioma activo
4. permitir que shell y vistas lean el idioma desde una sola fuente

## 8. Convenciones recomendadas al crear nuevas pantallas

Por cada pantalla nueva conviene tener:

- `NombreScreen.tsx`
- `NombreWorkspace.tsx`
- opcionalmente un hook tipo `useNombreScreenModel.ts`
- CSS o estilos propios solo si realmente pertenece a esa pantalla

Ejemplo:

```txt
features/
  edit/
    EditScreen.tsx
    EditWorkspace.tsx
    useEditScreenModel.ts
```

La idea es separar:

- shell de pantalla
- workspace real
- coordinacion de estado

## 9. Como deberia convivir esto con plugins

Hoy los plugins ya agregan instrumentos.

Despues, cuando exista modo app ordenado, pueden crecer hacia:

- instrumentos
- acciones de laboratorio o de pantalla
- paneles dedicados
- alteraciones visuales controladas
- herramientas de timeline

Eso coincide con las ideas de [06-ideas-de-plugins.md](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/docs/06-ideas-de-plugins.md):

- `circuit bending`
- `cassette`
- `vertical mode`
- `sfxr`
- `wave designer`
- `bitcrusher`
- `pattern generator`
- `sampler`
- `oscillator`

Por eso conviene esperar a tener shell y pantallas claras antes de pluginizar
mas superficie de UI.

## 10. Plan tecnico recomendado desde ahora

Orden sugerido:

1. seguir extrayendo coordinacion de `App.tsx`
2. crear `src/app/AppShell.tsx`
3. definir tokens visuales del shell clasico
4. preparar i18n base
5. crear modelo de navegacion interna
6. definir enum o union de vistas activas
7. crear `EditScreen` como primera pantalla real
8. mover `Project` a su propia pantalla
9. mover `Perform` a su propia pantalla
10. crear `PluginsScreen`
11. recien ahi abrir segunda superficie extensible de plugins

## 10.1 Plan concreto para implementar el layout

### Etapa A. Tokens y direccion visual

1. crear tema base con los 5 grises principales
2. definir reglas de borde y relieve
3. elegir tipografia base:
   - `VT323`
   - o `IBM Plex Mono`
4. aplicar tokens al shell antes de tocar vistas profundas

### Etapa B. Preparacion multilenguaje

1. crear fuente central de idioma activo
2. crear diccionario inicial `es`
3. dejar listo `en` aunque sea parcial
4. mover labels del shell a claves de idioma

### Etapa C. Shell horizontal flexible

1. header superior
2. barra de navegacion horizontal
3. workspace principal
4. panel contextual opcional
5. layout preparado para reordenarse despues

### Etapa D. Replica por vistas

1. `Edit`
2. `Project`
3. `Perform`
4. `Plugins`
5. `Settings`
6. `Sampler`

### Etapa E. Preparacion del modo vertical

1. no reescribir logica
2. reordenar regiones del shell
3. apilar o recolocar navegacion y paneles
4. reutilizar mismas vistas

## 11. Estado ya preparado en codigo

La base inicial ya puede dejar listos estos archivos aunque todavia esten en
modo placeholder:

- `src/app/AppMode.tsx`
- `src/app/AppShell.tsx`
- `src/app/appI18n.ts`
- `src/app/appNavigation.ts`
- `src/app/appRoutes.ts`
- `src/app/appTheme.ts`
- `src/features/edit/EditScreen.tsx`
- `src/features/edit/EditWorkspace.tsx`
- `src/features/perform/PerformScreen.tsx`
- `src/features/perform/PerformWorkspace.tsx`
- `src/features/project-view/ProjectScreen.tsx`
- `src/features/project-view/ProjectWorkspace.tsx`
- `src/features/plugins-view/PluginsScreen.tsx`
- `src/features/plugins-view/PluginsWorkspace.tsx`
- `src/features/settings-view/SettingsScreen.tsx`
- `src/features/sampler/SamplerScreen.tsx`
- `src/i18n/es.ts`
- `src/i18n/en.ts`
- `src/i18n/index.ts`

La meta de este paso no es que las vistas ya hagan todo, sino que ya tengan:

- lugar oficial
- nombre estable
- frontera clara
- shell horizontal donde montarse
- direccion visual base compartida
- textos centralizados para idioma configurable

## 11.1 Primera migracion viva recomendada

La primera pantalla real a nacer debe ser `Edit`.

No conviene reescribir toda su logica desde cero al principio. La ruta mas sana
es:

1. conservar `LabApp` intacto como sandbox completo
2. darle modos parciales reutilizables cuando haga falta
3. montar esos modos dentro de vistas nuevas del shell

Primer ejemplo concreto:

- `LabApp mode="edit-only"`

Ese modo puede renderizar solo:

- timeline de tracks
- lista de notas
- editor de nota
- timeline de notas

Asi la vista `Edit` ya nace con comportamiento real, pero el laboratorio sigue
existiendo como referencia completa. Esta misma estrategia puede repetirse mas
adelante con:

- `Project`
- `Perform`

Segundo ejemplo concreto ya previsto por la misma linea:

- `LabApp mode="project-only"`

Ese modo puede concentrar:

- panel de proyecto
- pistas activas
- mezcla
- automatizacion
- envolvente
- import/export
- acciones estructurales del proyecto

La regla sigue siendo la misma:

- primero replicar comportamiento real
- despues extraer coordinacion comun a hooks o view-models

Tercer ejemplo natural de la misma estrategia:

- `LabApp mode="perform-only"`

Ese modo puede concentrar:

- controles de sonido
- arpegiador
- piano
- mini `SMC Pad`
- acciones de tocar/grabar
- log MIDI

Con `Edit`, `Project` y `Perform` ya replicados de esta forma, el siguiente
paso deja de ser crear mas placeholders y pasa a ser refinar fronteras de
coordinacion compartida.

## 12. Resultado esperado

Si seguimos esta ruta, vamos a lograr:

- menos caos en `App.tsx`
- una base clara para modo app
- mejor lugar para validar flujos complejos
- mejor contexto para que plugins afecten algo mas que instrumentos
- una UI mas cercana a app de escritorio real y menos a laboratorio largo

Ese es el siguiente paso correcto antes de empujar mucho mas el sistema de
plugins.

## 13. Plan inmediato para arrancar el modo app con mockups

Esta seccion baja el documento desde arquitectura general a plan de ejecucion
concreto para las siguientes iteraciones, asumiendo que ya existen mockups y
que la prioridad pasa a ser "empezar a hacer visibles las pantallas del modo
app" sin perder el laboratorio como sandbox.

### 13.1 Objetivo de esta etapa

No se busca aun:

- reescribir todo el producto,
- abandonar el laboratorio,
- ni convertir cada vista nueva en implementacion final cerrada.

Se busca:

1. usar los mockups como direccion visible;
2. consolidar el shell horizontal real;
3. aterrizar pantallas vivas sobre comportamiento existente;
4. extraer poco a poco coordinacion del laboratorio hacia fronteras mas
   reutilizables;
5. dejar el sistema listo para decidir despues si Expo sera companion app,
   wrapper o prototipo paralelo.

### 13.2 Resultado esperado al cerrar esta etapa

Al terminar esta etapa inicial del modo app deberiamos tener:

- `AppShell` estable como entrada principal del modo app;
- vistas `Edit`, `Project` y `Perform` con layout mas cercano a mockup;
- placeholders restantes (`Plugins`, `Settings`, `Sampler`) con estructura real
  de pantalla, aunque aun sin toda la logica;
- menos responsabilidad directa dentro de `LabApp`;
- y una decision explicitada sobre como convivira la rama web actual con una
  futura experiencia Expo.

## 14. Orden recomendado de implementacion desde ahora

### Iteracion 1 - Consolidar shell y navegacion

Objetivo:

- dejar el modo app con esqueleto visual serio y coherente con mockups.

Tareas:

- ajustar `AppShell` para que:
  - topbar
  - navegacion horizontal
  - workspace principal
  - panel contextual opcional
  queden como regiones claras y estables;
- mapear los mockups a regiones concretas del shell;
- mover decisiones visuales comunes a tema/tokens, no a cada pantalla;
- terminar de limpiar copy temporal o labels que aun se sientan placeholder.

Resultado:

- el modo app deja de verse como maqueta tecnica y empieza a parecer producto.

### Iteracion 2 - Consolidar vistas reales ya iniciadas

Objetivo:

- hacer que `Edit`, `Project` y `Perform` dejen de ser replicas funcionales
  "crudas" y pasen a ser workspaces adaptados al modo app.

Tareas:

- revisar `EditWorkspace` contra mockup:
  - layout
  - bloques
  - jerarquia
  - paneles auxiliares;
- revisar `ProjectWorkspace` contra mockup:
  - lugar de mezcla
  - lugar de plugins
  - acciones de proyecto;
- revisar `PerformWorkspace` contra mockup:
  - zona de piano
  - zona de arpegiador
  - zona de acciones
  - log MIDI o panel contextual.

Resultado:

- las vistas vivas se ven intencionales dentro del shell, no solo incrustadas.

### Iteracion 3 - Seguir sacando coordinacion de `LabApp`

Objetivo:

- reducir el costo de seguir replicando pantallas.

Tareas:

- identificar coordinaciones todavia densas en `LabApp`;
- extraer primero las mas reutilizables:
  - seleccion de pista
  - timeline edit state
  - project actions
  - plugin activation state
  - perform interactions;
- moverlas a hooks, view-models o fronteras por capacidad.

Resultado:

- las vistas dejan de depender tanto del laboratorio como contenedor monolitico.

### Iteracion 4 - Convertir `Plugins`, `Settings` y `Sampler` en pantallas reales

Objetivo:

- cerrar el mapa visible del modo app.

Tareas:

- `Plugins`
  - manager real
  - descripcion corta
  - estados activos/inactivos
  - espacio reservado para futuras superficies registrables;
- `Settings`
  - preferencias globales reales
  - idioma
  - tema o variantes futuras si aplica;
- `Sampler`
  - aun puede empezar como estructura guiada,
  - pero con layout real y lugar oficial dentro del shell.

Resultado:

- el modo app ya tiene su mapa completo de pantallas, aunque algunas sigan en
  version inicial.

### Iteracion 5 - Desacople gradual del laboratorio

Objetivo:

- preparar el momento en que el shell y las pantallas ya no dependan tanto de
  `LabApp`.

Tareas:

- medir que partes del laboratorio siguen siendo fuente de verdad compartida;
- convertir las mas sanas en estado compartido reutilizable;
- dejar `LabApp` como sandbox integral, no como cuello de botella.

Resultado:

- la migracion deja de ser solo "montar LabApp en modos parciales" y pasa a ser
  separacion estructural real.

## 15. Plan de trabajo guiado por mockups

Cuando haya mockups, el orden sano no es "copiar la imagen completa de una".

El orden recomendado es:

1. detectar regiones fijas del shell;
2. identificar componentes visuales repetidos;
3. mapear cada bloque del mockup a:
   - `AppShell`
   - `Workspace`
   - `Context panel`
   - `Toolbar`
   - `Transport`
4. implementar primero layout y jerarquia;
5. conectar despues comportamiento real.

Regla importante:

- primero se debe parecer al mockup en estructura,
- luego en comportamiento fino,
- y recien al final en polish.

Eso evita perder tiempo en detalles visuales sobre una estructura todavia
equivocada.

## 16. Como decidir si conviene meter Expo

Esta decision no deberia tomarse como "instalar Expo dentro del Vite actual y
ya".

Hoy `MiMIDI` es una app web React/Vite con arquitectura propia. Expo introduce
otro runtime, otra estructura de app y otra forma de pensar UI.

Por eso, antes de tocar nada, hay que separar 3 objetivos posibles:

### Opcion A - Expo como prototipo paralelo del modo app

Uso:

- experimentar vistas;
- validar mockups;
- explorar navegacion y layout mobile/desktop;
- aprender que regiones de UI conviene compartir conceptualmente.

Ventajas:

- no rompe la app web actual;
- no fuerza migracion total;
- permite experimentar rapido.

Costo:

- duplica parte de la UI temporalmente;
- la logica compartida tendra que planearse con cuidado despues.

### Opcion B - Expo como segunda app oficial del monorepo

Uso:

- tener `MiMIDI Web` y `MiMIDI Expo` conviviendo.

Ventajas:

- separacion clara entre web actual y app universal;
- buena base si de verdad quieres version nativa.

Costo:

- requiere plan de monorepo o multi-app;
- obliga a decidir que compartes y que no;
- sube el costo de mantenimiento.

### Opcion C - Intentar convertir la app actual directamente a Expo

No es la opcion recomendada hoy.

Riesgos:

- mezclar Vite y Expo sin estrategia;
- frenar el avance del modo app;
- abrir demasiados frentes tecnicos al mismo tiempo.

Conclusion recomendada:

- si quieres empezar ya con mockups y vistas del modo app, la opcion mas sana
  es `Expo como prototipo paralelo` o `Expo como segunda app`, no como
  sustitucion inmediata del repo actual.

## 17. Recomendacion concreta para Expo en MiMIDI

La recomendacion actual para este proyecto es:

1. mantener este repo web como fuente principal del producto actual;
2. si decides usar Expo, crearlo como app separada dentro del mismo workspace o
   como carpeta hermana;
3. usar Expo para arrancar el shell y los mockups del modo app;
4. no mover de golpe el motor musical ni la logica completa al lado Expo.

En otras palabras:

- primero prototipa la experiencia;
- despues decide que compartir realmente.

## 18. Comando base actual para crear Expo

Segun la documentacion oficial de Expo, la forma recomendada actual para crear
un proyecto es:

```bash
npx create-expo-app@latest --template default@sdk-55
```

La documentacion tambien indica que:

- `create-expo-app` es la herramienta oficial para iniciar el proyecto;
- el template `default` ya viene orientado a apps de multiples pantallas;
- y `npx expo start` es el flujo base para arrancarlo despues.

Referencia oficial:

- https://docs.expo.dev/more/create-expo/
- https://docs.expo.dev/router/installation/

## 19. Donde convendria poner Expo si damos ese paso

La opcion mas sana seria una estructura tipo:

```txt
MiMIDI/
  src/               <- app web actual
  docs/
  apps/
    mimidi-expo/     <- nueva app Expo
```

o incluso:

```txt
MiMIDI/
  web/
  expo/
  docs/
```

La decision exacta puede depender de cuanto codigo quieras compartir despues,
pero el principio es el mismo:

- no mezclar el arranque de Expo dentro del `src/` actual.

## 20. Siguiente paso recomendado si ya tienes mockups

Si ya tienes mockups y quieres empezar el modo app en serio, el siguiente paso
mas sano es:

1. consolidar `AppShell` web actual contra esos mockups;
2. mapear cada mockup a una de las vistas:
   - `Perform`
   - `Edit`
   - `Project`
   - `Plugins`
   - `Settings`
   - `Sampler`
3. implementar primero esas vistas dentro del modo app web actual;
4. dejar como tarea importante para despues:
   - seguir sacando coordinacion de `App.tsx`
   - seguir desacoplando `LabApp`
   - preparar correctamente Expo como app separada;
5. solo despues decidir si Expo sera:
   - prototipo paralelo,
   - o segunda app del workspace;
6. solo despues crear la app Expo.

La razon es simple:

- primero debes tener claro que experiencia construyes,
- luego eliges el casco tecnico correcto,
- y no al reves.

## 21. Actualizacion: Expo ya existe en `apps/`

La situacion del proyecto ya cambio respecto de secciones anteriores:

- la app Expo ya fue creada en:
  - `apps/mimidi-expo`

Eso obliga a ajustar la lectura de esta arquitectura.

### 21.1 Nuevo estado correcto

Expo ya no es solo una opcion teorica pendiente de crear.

Ahora pasa a ser:

- una app separada real dentro del workspace;
- un prototipo paralelo del modo app;
- una superficie util para mockups, layout y navegacion;
- una app todavia no integrada al core musical completo.

### 21.2 Lo que no debe asumirse

La existencia de `apps/mimidi-expo` no significa aun que:

- el modo app principal ya se haya mudado a Expo;
- la logica de MiMIDI ya sea compartida entre web y native;
- el laboratorio web haya dejado de ser la fuente principal de comportamiento;
- Expo ya este listo como experiencia completa de producto.

### 21.3 Regla de orientacion vigente

Para esta etapa, la direccion de Expo debe ser:

- horizontal primero

Si algun archivo de configuracion o layout lo contradice, la arquitectura debe
considerar eso como desalineacion a corregir, no como nueva direccion oficial.

### 21.4 Prioridad inmediata con Expo ya creado

Ahora que la app ya existe, el siguiente orden sano pasa a ser:

1. ordenar la estructura base de Expo;
2. alinear tabs, orientacion y documentacion de esa app;
3. seguir usandola como prototipo paralelo del modo app;
4. decidir mas adelante que partes del core conviene compartir de verdad.

### 21.5 Fuente de verdad complementaria

El estado real de Expo debe seguirse tambien en:

- `docs/10-app-expo-actual.md`

porque este documento (`09`) describe la direccion arquitectonica general del
modo app, mientras que `10` deja trazado el estado concreto de la app Expo del
workspace.
