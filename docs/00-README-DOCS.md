# MiMIDI - Documentacion base

Este directorio contiene la documentacion viva del proyecto MiMIDI, una
aplicacion centrada en creacion, edicion, reproduccion y extension de
experiencias musicales basadas en MIDI, sintesis matematica y arquitectura
modular preparada para plugins/mods.

## Indice

- `01-arquitectura.md` -> arquitectura general, capas, responsabilidades,
  principios y decisiones estructurales.
- `02-proyecto-base-react.md` -> propuesta concreta del proyecto inicial en
  React, estructura de carpetas y primer alcance funcional.
- `03-contexto-y-metas.md` -> vision del proyecto, restricciones deliberadas,
  metas, contexto del core y lineamientos sobre instrumentos matematicos.
- `04-plan-desarrollo.md` -> fases incrementales de desarrollo del proyecto.
- `05-contexto-vivo-desarrollo.md` -> registro vivo de cambios, decisiones y
  siguientes pasos.
- `06-ideas-de-plugins.md` -> backlog inicial de ideas para futuros plugins y
  extensiones.
- `07-prompt-continuidad-codex.md` -> prompt de continuidad para nuevos chats de
  Codex, con contexto operativo y reglas de comportamiento/documentacion.
- `08-guia-crear-plugins.md` -> guia practica para crear y registrar plugins en
  el MVP actual del proyecto.
- `09-arquitectura-modo-app.md` -> mapa tecnico del futuro modo app con
  multiples pantallas, shell horizontal y reglas para seguir agregando archivos
  sin romper la arquitectura.
- `10-app-expo-actual.md` -> estado real de la app Expo en `apps/`,
  decisiones activas, limites actuales y siguiente tramo recomendado.

## Proposito de esta carpeta

Esta documentacion debe funcionar como una fuente de verdad viva para el
proyecto. No esta pensada como documentacion decorativa, sino como un sistema de
memoria tecnica y de producto para evitar:

- decisiones inconsistentes,
- crecimiento caotico,
- acoplamiento excesivo,
- desviaciones del core,
- perdida de compatibilidad futura con mods/plugins.

## Regla de mantenimiento

Cuando el proyecto cambie, esta carpeta debe actualizarse. Si una decision
importante no esta aqui, todavia no esta consolidada.
