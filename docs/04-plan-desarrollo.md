# 📘 MiMIDI — Plan de Desarrollo

## 🎯 Visión del Proyecto

MiMIDI es un sistema musical basado en:

- Instrumentos matemáticos (síntesis)
- Separación entre MIDI (intención) y Audio (sonido)
- Screaming Architecture
- Core modular y extensible con plugins
- React solo como capa de presentación

---

## 🧠 Principios Clave

- No usar samples en el core
- Todo sonido es matemático
- No lógica en React
- Dominios separados: audio, MIDI, project
- No usar utils/services genéricos

---

## 🧱 Estructura Objetivo

src/
  engine/
    audio/
    midi/
    project/
  features/
    piano/
    timeline/
  app/
  plugins/

---

## 🚀 FASE 1 — Core de Audio

Objetivo: Motor de audio limpio y desacoplado

Tareas:
- Refactorizar audioEngine
- Soportar múltiples notas
- Control de volumen
- Base ADSR

---

## 🎹 FASE 2 — Sistema de Notas

Tareas:
- Mapear notas a frecuencia
- playNote("C4")
- Soporte acordes

---

## 🎹 FASE 3 — Piano

Tareas:
- UI básica
- Click → sonido

---

## ⏱️ FASE 4 — MIDI básico

Tareas:
- Eventos con tiempo
- Secuenciación

---

## 📊 FASE 5 — Timeline

Tareas:
- Visualizar eventos
- Sincronizar reproducción

---

## 🧩 FASE 6 — Plugins

Tareas:
- Sistema de plugins
- Extensión del core

---

## 🎛️ FASE 7 — Síntesis avanzada

Tareas:
- ADSR
- LFO
- Mezcla

---

## 📦 FASE 8 — Proyecto musical

Tareas:
- Guardar pistas
- Exportar JSON

---

## ⚠️ Anti-patrones

- No lógica en React
- No samples
- No sobrearquitectura

---

## 🧭 Estrategia

1. Funciona
2. Separar
3. Refinar
4. Expandir

---

## 🏁 Meta

Sistema musical modular basado en síntesis matemática

---

## Estado Consolidado (Abril 2026)

Avance confirmado:

- FASE 1: completada
- FASE 2: completada
- FASE 3: completada
- FASE 4: completada
- FASE 5: implementada como timeline editable
- FASE 8: en desarrollo activo (estado avanzado)

Capacidades ya activas:

- grabacion por pistas
- instrumentos matematicos por pista
- exportar/importar JSON
- persistencia local
- timeline editable (mover/redimensionar)
- snap opcional
- duplicar y revertir nota
- historial con undo/redo y limite acotado
- atajos de teclado de historial

Estado de atajos:

- `Ctrl/Cmd + Z`: deshacer
- `Ctrl/Cmd + Y`: rehacer

Los atajos quedaron integrados al mismo motor de historial (`useProjectHistory`)
que usan los botones de UI, por lo que ambos caminos de accion comparten estado.

---

## Mapa Futuro Aplicable (priorizado)

Este mapa convierte tus tareas en orden de ejecucion recomendado para aplicar
sin romper fases ya cerradas.

### Bloque A - Cierre de historial (corto plazo)

Objetivo:
- cerrar por completo `Deshacer/Rehacer` antes de abrir mas superficie de UI.

Tareas:
- test de integracion minimo `timeline + historial` (UI real)
- tooltip corto de ayuda para `Revertir nota`

Cuando aplicarlo:
- inmediato (siguiente iteracion)

Estado:
- completado

### Bloque B - Orden interno del laboratorio monovista (medio plazo)

Objetivo:
- mantener el laboratorio monovista como experiencia visible mientras se reduce
  el acoplamiento interno y se prepara el crecimiento sin romper flujo actual.

Tareas:
- dividir internamente `App.tsx` en piezas mas claras por responsabilidades
- mover coordinacion de UI a features/secciones mas chicas sin cambiar todavia
  a modo app
- este orden interno debera retomarse otra vez como paso obligatorio antes de
  ejecutar el Bloque I, aunque la implementacion visible de vistas separadas se
  deje para el final
- mejorar estetica y jerarquia visual:
  - layout en columnas/paneles
  - espaciado y densidad
  - toolbar estable
- agregar menu dedicado de SMC Pad
- diseno de baterias matematicas para SMC Pad:
  - kick por seno + pitch envelope
  - snare/hat/clap por capas de ruido filtrado
  - `noise generator` (white noise inicial) en motor de audio
- agregar selector de octavas para definir rango de teclas visibles/tocables

Cuando aplicarlo:
- despues de cerrar Bloque A

Estado parcial:
- completado:
  - division inicial de `App.tsx` en secciones del laboratorio
  - extraccion de panel de proyecto, controles de sonido, acciones y editor de
    nota
  - selector de octavas para controlar rango visible/tocable del piano
  - `noise generator` base en el motor de audio
  - mini `SMC Pad` de prueba dentro del laboratorio actual
- pendiente:
  - mejora visual/jerarquia del laboratorio
  - menu dedicado de SMC Pad
  - baterias matematicas para SMC Pad
  - refinamiento serio de sonido/UX del `SMC Pad` cuando exista su vista
    dedicada

### Bloque C - FASE 7 Sintesis avanzada (retomar fase faltante)

Objetivo:
- enriquecer sonido manteniendo instrumentos matematicos.

Tareas:
- modulacion LFO
- mejoras de envolvente/mezcla por pista
- parametros automatizables basicos

Cuando aplicarlo:
- despues de Bloque B

Estado:
- completado en alcance MVP actual:
  - base de LFO opcional en el motor de audio
  - modulacion sobre frecuencia (`Vibrato Lead`)
  - modulacion sobre ganancia (`Tremolo Pad`)
  - separacion de instrumentos matematicos en `Base / Avanzado`
  - envolvente editable por pista para notas nuevas y reproduccion grabada
  - mezcla por pista con volumen, mute, solo y pan
  - automatizacion basica de volumen por pista con dos puntos minimos

### Bloque D - Exportacion audible (alta prioridad de producto)

Objetivo:
- exportar audio de buena calidad del proyecto.

Formato recomendado:
- WAV PCM 32-bit float (sin perdida, alta calidad)
- opcion secundaria: WAV PCM 24/16-bit para compatibilidad

Estrategia tecnica:
- `OfflineAudioContext` para render no realtime
- mezcla por pistas y timeline en render offline
- exportador WAV en infraestructura

Tareas completas necesarias:
- definir un renderer offline aislado del motor realtime actual
- construir una ruta de reproduccion offline para:
  - notas normales
  - golpes `SMC Pad`
  - ADSR por nota
  - instrumento matematico por nota
  - mezcla por pista
  - panorama por pista
  - automatizacion basica de volumen por pista
- calcular duracion total del render con margen de `release`
- crear encoder `WAV` en infraestructura sin depender del navegador para la
  logica de mezcla
- soportar primero exportacion `WAV PCM 32-bit float`
- dejar extension preparada para `24-bit` y `16-bit`
- crear flujo de aplicacion para:
  - pedir render
  - recibir `Blob` o buffer exportable
  - descargar archivo
- agregar UI minima de exportacion dentro del laboratorio actual
- documentar limitaciones iniciales del exportador

Orden recomendado de implementacion:
1. utilidades de timeline/render length
2. renderer offline base con notas melodicas
3. soporte offline para `SMC Pad`
4. mezcla por pista en offline (`volume`, `mute`, `solo`, `pan`)
5. automatizacion basica de volumen en offline
6. encoder `WAV PCM 32-bit float`
7. caso de uso de exportacion
8. boton/UI de exportar audio
9. validacion manual con proyectos simples y multipista

Validaciones esperadas:
- una sola pista melodica exporta con duracion correcta
- dos pistas exportan sincronizadas
- `mute` y `solo` afectan el audio exportado
- `pan` se refleja en el archivo final
- automatizacion de volumen se escucha en el render exportado
- golpes del mini `SMC Pad` si aparecen en timeline tambien aparecen en el
  audio final
- el archivo descargado abre correctamente en reproductor o DAW externo

Cuando aplicarlo:
- despues de Bloque C

Estado:
- completado en alcance MVP actual:
  - renderer offline con `OfflineAudioContext`
  - soporte de notas melodicas y mini `SMC Pad`
  - mezcla por pista durante render (`volume`, `mute`, `solo`, `pan`)
  - automatizacion basica de volumen por pista en exportacion
  - exportacion `WAV PCM 32-bit float`
  - flujo minimo de descarga desde el laboratorio actual
- pendiente:
  - exponer opciones secundarias `24-bit` / `16-bit` en UI si se necesitan
  - validacion manual amplia con proyectos multipista mas complejos

### Bloque E - Modo Arpegiador (notas y acordes)

Objetivo:
- convertir acordes/sostenidos en patrones ritmicos MIDI controlables.

Tareas:
- integrar arpegiador dentro del laboratorio actual antes del modo app
- modos de patron:
  - Up
  - Down
  - Up/Down
  - Random
  - Chord (referencia)
- controles minimos:
  - rate (1/4, 1/8, 1/16, triplet)
  - gate
  - octave range
  - latch
- grabacion del resultado en timeline como eventos/notas reales

Tareas completas necesarias:
- definir modelo de arpegiador desacoplado de React
- crear generador de patrones a partir de:
  - nota unica
  - acorde
  - rango de octavas
- soportar modos:
  - Up
  - Down
  - Up/Down
  - Random
  - Chord
- soportar controles base:
  - `rate`
  - `gate`
  - `octave range`
  - `latch`
- decidir como convive el arpegiador con:
  - modo nota
  - modo acorde
  - pista activa
- reproducir el patron en tiempo real dentro del laboratorio
- grabar el resultado como notas reales en timeline
- asegurar compatibilidad con mezcla por pista y exportacion audible
- agregar UI minima de arpegiador dentro del laboratorio actual
- documentar limites iniciales del arpegiador MVP

Orden recomendado de implementacion:
1. modelo/estado del arpegiador
2. generador de patron musical
3. scheduler realtime del arpegio
4. integracion con pista activa
5. grabacion del patron como notas reales
6. UI minima de controles
7. validacion con exportacion y timeline

Validaciones esperadas:
- una nota sostenida genera patron estable segun `rate`
- un acorde genera patron correcto segun modo elegido
- `gate` cambia la longitud percibida de cada nota arpegiada
- `octave range` expande correctamente el patron
- `latch` mantiene el patron cuando corresponde
- el resultado puede grabarse como notas reales en timeline
- lo grabado puede reproducirse y exportarse a `WAV`

Cuando aplicarlo:
- despues de Bloque D

Estado:
- completado en alcance MVP actual:
  - arpegiador integrado dentro del laboratorio actual
  - modos `Up`, `Down`, `Up/Down`, `Random` y `Chord`
  - controles `rate`, `gate`, `octave range` y `latch`
  - disparo desde nota unica o acorde
  - grabacion del resultado como notas reales en timeline
  - compatibilidad con reproduccion grabada y exportacion audible
- pendiente:
  - validacion manual amplia con flujos mas largos y multipista

### Bloque F - Timeline de tracks (alto valor)

Objetivo:
- sumar timeline por pistas ademas del timeline de notas.

Tareas:
- vista de tracks (lanes por pista)
- seleccion de pista desde timeline de tracks
- sincronizacion track timeline <-> note timeline

Cuando aplicarlo:
- despues de Bloque E

Estado:
- completado en alcance MVP actual:
  - timeline general por pistas dentro del laboratorio monovista
  - un clip temporal movible por pista para decidir cuando entra en el arreglo
  - reproduccion realtime y exportacion `WAV` respetan el offset temporal de
    cada pista
  - seleccion de pista activa desde la timeline de tracks
  - sincronizacion entre timeline de tracks, panel de proyecto y timeline de
    notas de detalle
  - duracion configurable del timeline de notas por pista activa
- pendiente:
  - ampliar de un clip por pista a multiples clips por pista cuando haga falta
  - sumar recorte/duplicado de clips sin convertir aun esta superficie en modo
    app
  - seguir refinando la jerarquia visual cuando se acerque la transicion a
    vistas separadas

### Bloque G - FASE 6 Plugins (retomar fase faltante)

Objetivo:
- definir extensibilidad real del core.

Tareas:
- contrato minimo de plugin
- carga/registro de plugins internos
- primer plugin de ejemplo sin samples

Cuando aplicarlo:
- despues de Bloque F

Estado:
- iniciado:
  - contrato minimo de plugin interno
  - registro interno de plugins
  - primer plugin de instrumentos matematicos
  - catalogo combinado core + plugin en laboratorio
  - manager visible de plugins internos en el laboratorio
  - persistencia del estado activo/inactivo dentro del proyecto
  - resolucion coherente del catalogo activo en reproduccion y exportacion
  - extraccion inicial de coordinacion de grabacion fuera de `App.tsx`
- pendiente:
  - seguir extrayendo coordinacion de `App.tsx` hacia hooks/catalogos/fronteras
    de producto compatibles con plugins
  - preparar arquitectura del futuro modo app antes de abrir mas superficie de
    plugins
  - documentar y crear shell horizontal para multiples pantallas con inspiracion
    de app de escritorio clasica
  - mover el laboratorio actual a una ruta propia para liberar `/` como entrada
    del futuro modo app
  - dejar el modo vertical como fase posterior al modo horizontal estable
  - preparar base multilenguaje antes de llenar fuerte las nuevas vistas
  - diferir nuevas superficies extensibles de plugins hasta que exista una UI
    mas ordenada
  - reevaluar despues del modo app si la siguiente superficie pluginizable sera:
    - acciones del laboratorio o de pantalla
    - herramientas del timeline
    - paneles dedicados

### Bloque H - Sampler (menu separado)

Objetivo:
- incorporar sampler como capacidad opcional y separada del core matematico.

Tareas:
- integrar sampler como modulo aislado aunque el laboratorio siga monovista
- grabar audio desde entrada del usuario
- catalogar samples en lista/banco
- disparo de samples desde interfaz dedicada

Regla de arquitectura:
- el sampler vive como modulo separado del core de sintesis matematica.

Cuando aplicarlo:
- despues de Bloque G o en paralelo tardio con Bloque G

### Bloque I - Modo App y vistas separadas (etapa final de reorganizacion)

Objetivo:
- pasar del laboratorio monovista a una estructura de app con navegacion clara
  cuando las capacidades core pendientes ya esten estables.

Prerequisito explicito:
- antes de abrir este bloque, debe haberse completado el orden interno de
  `App.tsx` y la separacion interna de responsabilidades definida en Bloque B,
  aunque esa tarea ya haya sido mencionada anteriormente

Tareas:
- separar vistas por contexto:
  - Piano/Grabacion
  - Edicion/Timeline
  - Proyecto/Exportacion
  - Settings
  - Plugins
- convertir la division interna previa en navegacion visible de app
- redistribuir herramientas sin apelotonar controles
- facilitar validacion manual mas clara de flujos multipista que hoy resultan
  incomodos de probar en la monovista, especialmente mezcla, `mute`, `solo`,
  panorama y automatizacion basica

Cuando aplicarlo:
- al final, despues de cerrar los bloques funcionales principales

Estado:
- iniciado en fase de migracion controlada:
  - shell horizontal inicial
  - base visual clasica documentada
  - base multilenguaje inicial
  - vistas reales `Edit`, `Project` y `Perform` montadas desde el laboratorio
  - primer aterrizaje visual real de `Perform` guiado por mockup
  - catalogo inicial de estilos compartidos del modo app
  - app Expo separada creada en `apps/mimidi-expo`
  - pendiente:
  - foco inmediato:
    - consolidar la app web actual como frente principal y fuente de verdad del
      producto
    - llevar el responsive del modo app web a una lectura lo mas fiel posible a
      los mockups actuales, especialmente en `Perform`, `SMC Pad`, `Plugins`,
      `Settings` y `Edit / Timelines`
    - priorizar primero estructura, densidad visual, jerarquia y comportamiento
      responsive antes de abrir mas features o mas vistas
    - completar en web lo necesario para que cada vista existente tenga base
      suficiente antes de seguir creciendo superficie
    - documentar cada ajuste visible y cada decision de alcance en `docs/05`
      para no perder continuidad durante la iteracion de mockups
    - dejar Expo congelado por ahora, en posible purga, sin seguir invirtiendo
      tiempo de producto hasta que el frente web quede mas solido
  - tareas importantes para despues:
    - evaluar si conviene separar formalmente el repo en:
      - `apps/web`
      - `apps/app`
      - `packages/core`
      si luego se decide extraer un modulo mobile serio a partir del trabajo web
      y no desde un reinicio paralelo
    - preparar una publicacion temprana de la version web para mostrar el
      instrumento mientras el modo app madura
    - evaluar despliegue de demo publica en:
      - GitHub Pages o similar para web estatica
      - `itch.io` si termina teniendo sentido como instrumento interactivo
    - seguir extrayendo coordinacion de `App.tsx` hacia hooks/fronteras mas
      reutilizables
    - consolidar `LabApp` como fuente de verdad reutilizable durante la
      migracion
    - desacoplar gradualmente cada vista del laboratorio sin destruir el
      sandbox
    - evaluar mas adelante si `SMC Pad`, `Edit` y el resto del modo app mobile
      convienen nacer desde un core compartido extraido del web ya maduro
    - decidir despues si Expo sigue teniendo sentido, si se purga, o si el
      futuro modulo mobile nace con otra base mas alineada al producto web
    - disenar compatibilidad de plugins entre web y app alrededor de un dominio
      compartido y no de componentes compartidos
  - decision posterior:
    - definir si la entrada futura del modo app web convivira con una app mobile
      separada o si el modo responsive web cubrira primero parte importante de
      esa necesidad antes de abrir una segunda app

---

## Resumen de Aplicacion

Orden recomendado:

1. Bloque A (cerrar historial)
2. Bloque B (orden interno del laboratorio monovista)
3. Bloque C (FASE 7 sintesis avanzada)
4. Bloque D (exportacion audible WAV alta calidad)
5. Bloque E (modo arpegiador)
6. Bloque F (timeline de tracks)
7. Bloque G (FASE 6 plugins)
8. Bloque H (sampler en menu separado)
9. Bloque I (modo app y vistas separadas)
