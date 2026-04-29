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

### Bloque C - FASE 7 Sintesis avanzada (retomar fase faltante)

Objetivo:
- enriquecer sonido manteniendo instrumentos matematicos.

Tareas:
- modulacion LFO
- mejoras de envolvente/mezcla por pista
- parametros automatizables basicos

Cuando aplicarlo:
- despues de Bloque B

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

Cuando aplicarlo:
- despues de Bloque C

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

Cuando aplicarlo:
- despues de Bloque D

### Bloque F - Timeline de tracks (alto valor)

Objetivo:
- sumar timeline por pistas ademas del timeline de notas.

Tareas:
- vista de tracks (lanes por pista)
- seleccion de pista desde timeline de tracks
- sincronizacion track timeline <-> note timeline

Cuando aplicarlo:
- despues de Bloque E

### Bloque G - FASE 6 Plugins (retomar fase faltante)

Objetivo:
- definir extensibilidad real del core.

Tareas:
- contrato minimo de plugin
- carga/registro de plugins internos
- primer plugin de ejemplo sin samples

Cuando aplicarlo:
- despues de Bloque F

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

Cuando aplicarlo:
- al final, despues de cerrar los bloques funcionales principales

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
