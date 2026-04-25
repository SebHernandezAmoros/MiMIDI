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

### Bloque B - Modo App y vistas (medio plazo)

Objetivo:
- dejar de tener todo en una sola vista "apelotonada" y pasar a estructura de
  app con navegacion clara.

Tareas:
- separar vistas por contexto:
  - Piano/Grabacion
  - Edicion/Timeline
  - Proyecto/Exportacion
- mejorar estetica y jerarquia visual:
  - layout en columnas/paneles
  - espaciado y densidad
  - toolbar estable

Cuando aplicarlo:
- despues de cerrar Bloque A

### Bloque C - Timeline de tracks (alto valor)

Objetivo:
- sumar timeline por pistas ademas del timeline de notas.

Tareas:
- vista de tracks (lanes por pista)
- seleccion de pista desde timeline de tracks
- sincronizacion track timeline <-> note timeline

Cuando aplicarlo:
- despues del Bloque B (ya con modo app)

### Bloque D - FASE 6 Plugins (retomar fase faltante)

Objetivo:
- definir extensibilidad real del core.

Tareas:
- contrato minimo de plugin
- carga/registro de plugins internos
- primer plugin de ejemplo sin samples

Cuando aplicarlo:
- despues de Bloque C

### Bloque E - FASE 7 Sintesis avanzada (retomar fase faltante)

Objetivo:
- enriquecer sonido manteniendo instrumentos matematicos.

Tareas:
- modulacion LFO
- mejoras de envolvente/mezcla por pista
- parametros automatizables basicos

Cuando aplicarlo:
- en paralelo tardio con FASE 6 o despues de FASE 6

### Bloque F - Exportacion audible (alta prioridad de producto)

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
- despues de Bloque C (ideal con modo app + track timeline listos)

---

## Resumen de Aplicacion

Orden recomendado:

1. Bloque A (cerrar historial)
2. Bloque B (modo app + estetica)
3. Bloque C (timeline de tracks)
4. Bloque D (FASE 6 plugins)
5. Bloque E (FASE 7 sintesis avanzada)
6. Bloque F (exportacion audible WAV alta calidad)
