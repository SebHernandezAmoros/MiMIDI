# Prompt de continuidad para nuevos chats de Codex

Usa este prompt cuando abras un nuevo chat y quieras que Codex continue MiMIDI
sin perder contexto ni disciplina documental.

---

## Prompt sugerido

Quiero que continues el proyecto `MiMIDI` respetando la documentacion viva de
`docs/`.

Reglas obligatorias:

- Antes de proponer cambios, lee y usa como fuente de verdad:
  - `docs/00-README-DOCS.md`
  - `docs/01-arquitectura.md`
  - `docs/03-contexto-y-metas.md`
  - `docs/04-plan-desarrollo.md`
  - `docs/05-contexto-vivo-desarrollo.md`
  - `docs/06-ideas-de-plugins.md`
- MiMIDI usa Screaming Architecture. No lo reorganices como app centrada en
  carpetas genericas tipo `components`, `utils` o `services`.
- El core sigue la restriccion de instrumentos matematicos. No metas samples al
  core.
- Cualquier cambio importante de codigo debe quedar documentado en
  `docs/05-contexto-vivo-desarrollo.md`.
- Si cambias prioridades, roadmap o estados de bloques, actualiza tambien
  `docs/04-plan-desarrollo.md`.
- No marques algo como completado si no quedo realmente implementado y
  validado.
- Mantente dentro del plan actual salvo que se te pida reordenarlo.

Estado estrategico actual:

- Seguimos en laboratorio monovista; el modo app con vistas separadas va al
  final.
- Bloque B ya avanzo bastante:
  - `App.tsx` mas ordenado
  - selector de octavas
  - `noise generator`
  - mini `SMC Pad` funcional dentro del laboratorio
- El refinamiento final de `SMC Pad` se difiere para cuando exista su vista
  dedicada.
- Bloque C ya esta iniciado:
  - LFO sobre frecuencia
  - LFO sobre ganancia
  - instrumentos `Vibrato Lead` y `Tremolo Pad`
  - categoria de instrumentos `Base / Avanzado`
  - envolvente por pista
  - volumen/mezcla base por pista

Forma de trabajar:

- Analiza primero el estado real del codigo.
- Di que aprendiste y cual es el siguiente paso segun `04` y `05`.
- Implementa cambios pequenos, coherentes y acumulativos.
- Valida con `npm run lint` y `npm run build` cuando aplique.
- Al cerrar, resume que cambiaste, como probarlo y que sigue.

Si hay ambiguedad, prioriza:

1. mantener coherencia arquitectonica
2. no romper flujo actual del laboratorio
3. dejar trazabilidad clara en docs

---

## Nota operativa

Si el siguiente Codex necesita retomar rapido, puede empezar preguntando:

`Lee docs/00, 04, 05 y dime estado actual, ultimo avance real y siguiente paso recomendado antes de tocar codigo.`
