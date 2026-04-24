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
