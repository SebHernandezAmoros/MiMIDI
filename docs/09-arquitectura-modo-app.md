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

### 1.4 Modo vertical, pero despues

Tambien deberia existir un `modo vertical`, pero no ahora.

Orden correcto:

1. primero consolidar el modo app horizontal
2. validar que shell, navegacion y pantallas funcionen bien
3. recien despues explorar un modo vertical como variacion de layout o plugin
   visual futuro

La idea es no abrir dos direcciones de UI grandes al mismo tiempo.

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

### Paso 2. Crear `AppShell` sin matar el laboratorio

Luego:

- crear `AppShell`
- crear navegacion horizontal minima
- mantener una vista que inicialmente siga montando partes del laboratorio
- dejar el laboratorio vivo en `/lab`
- dejar `/` libre para evolucionar el shell del modo app

### Paso 3. Extraer la primera pantalla real

La primera pantalla recomendable es:

- `Edit`

porque ya tiene fronteras relativamente claras:

- timeline de tracks
- timeline de notas
- editor de nota

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
3. crear modelo de navegacion interna
4. definir enum o union de vistas activas
5. crear `EditScreen` como primera pantalla real
6. mover `Project` a su propia pantalla
7. mover `Perform` a su propia pantalla
8. crear `PluginsScreen`
9. recien ahi abrir segunda superficie extensible de plugins

## 11. Resultado esperado

Si seguimos esta ruta, vamos a lograr:

- menos caos en `App.tsx`
- una base clara para modo app
- mejor lugar para validar flujos complejos
- mejor contexto para que plugins afecten algo mas que instrumentos
- una UI mas cercana a app de escritorio real y menos a laboratorio largo

Ese es el siguiente paso correcto antes de empujar mucho mas el sistema de
plugins.
