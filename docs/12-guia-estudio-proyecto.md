# MiMIDI - Guia de estudio rapido del proyecto

Este documento esta pensado para alguien que necesita entender MiMIDI rapido,
sin leer todo el repo en orden aleatorio.

La idea no es estudiar "todo TypeScript" o "todo React", sino entender:

- que esta construyendo realmente el proyecto,
- donde vive la logica importante,
- que partes ya son core real,
- que partes siguen siendo laboratorio o prototipo,
- y en que orden conviene estudiar para ser funcional rapido.

## 1. Que es MiMIDI hoy

MiMIDI es una app musical experimental enfocada en:

- tocar notas y acordes,
- grabar eventos/ideas musicales,
- visualizarlos en timelines,
- reproducirlos y exportarlos,
- y preparar una base extensible para plugins.

La restriccion mas importante del proyecto hoy es esta:

- el core usa sintesis matematica, no samples.

Eso significa que el corazon del sistema esta mas cerca de:

- Web Audio API,
- notas MIDI,
- instrumentos matematicos,
- y modelo de proyecto musical

que de librerias pesadas de audio o bancos de sonido.

## 2. Stack actual real

### Web principal

- React 19
- TypeScript
- Vite
- CSS plano
- Vitest
- Testing Library
- ESLint

Archivo base:

- [package.json](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/package.json)

### App paralela

Existe una segunda app en:

- `apps/mimidi-expo`

Su rol hoy no es reemplazar la web principal. Funciona mas como:

- prototipo paralelo,
- shell de navegacion,
- laboratorio visual para modo app.

Tecnologias principales ahi:

- Expo
- React Native
- Expo Router
- expo-audio

Archivo base:

- [apps/mimidi-expo/package.json](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/apps/mimidi-expo/package.json)

## 3. Arquitectura real actual

La arquitectura conceptual del proyecto esta bien pensada, pero el codigo real
esta en una fase intermedia.

### Lo que ya esta bien separado

- `src/engine/audio/`
  - motor de audio, envelopes, ruido, voces, paneo.
- `src/engine/midi/`
  - notas, conversion MIDI/frecuencia, eventos y notas grabadas.
- `src/engine/project/`
  - modelo de proyecto, pistas, timeline, automatizacion, parseo/importacion.
- `src/engine/plugins/`
  - contrato de plugins e instrumentos aportados por plugins internos.
- `src/application/use-cases/`
  - coordinacion entre dominio y acciones: tocar, reproducir, exportar.
- `src/features/`
  - capacidades visibles: piano, timeline, perform, edit, project, settings.
- `src/app/`
  - shell, rutas, navegacion interna, i18n y tema del modo app.

### Lo que sigue concentrado y debes entender como "centro operativo"

El archivo mas importante del repo hoy es:

- [src/features/lab/LabApp.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/lab/LabApp.tsx)

Ese archivo hoy funciona como:

- laboratorio integral,
- ensamblador de flujo musical,
- coordinador de proyecto,
- puente entre UI, grabacion, reproduccion y timeline.

En otras palabras:

- la arquitectura objetivo ya existe por carpetas,
- pero parte importante de la orquestacion todavia vive en `LabApp.tsx`.

Esto no es un error casual. Es parte de la etapa actual del proyecto.

## 4. Mapa mental del flujo principal

Si quieres entender el proyecto rapido, piensa el sistema asi:

1. La UI dispara una accion.
2. La accion pasa por `features/` o por `LabApp`.
3. Los casos de uso en `application/use-cases/` coordinan la intencion.
4. `engine/midi/` representa notas y eventos.
5. `engine/audio/` genera el sonido real.
6. `engine/project/` guarda la estructura musical.
7. `projectStorage.ts` persiste en `localStorage`.

El mejor ejemplo de flujo completo es:

- tocar una nota en el piano,
- grabarla,
- verla en timeline,
- reproducirla despues.

Archivos clave para seguir ese recorrido:

- [src/features/piano/PianoPreview.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/piano/PianoPreview.tsx)
- [src/features/lab/useLabRecordingSession.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/lab/useLabRecordingSession.ts)
- [src/engine/midi/events.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/midi/events.ts)
- [src/engine/project/projectModel.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/project/projectModel.ts)
- [src/application/use-cases/playRecordedNotes.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/application/use-cases/playRecordedNotes.ts)
- [src/features/transport/usePlaybackTransport.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/transport/usePlaybackTransport.ts)

## 5. Que partes son core y que partes son prototipo

### Core real que si debes estudiar con atencion

- `src/engine/audio/audioEngine.ts`
- `src/engine/audio/mathematicalInstruments.ts`
- `src/engine/audio/instrumentCatalog.ts`
- `src/engine/midi/notes.ts`
- `src/engine/midi/events.ts`
- `src/engine/project/projectModel.ts`
- `src/engine/project/projectStorage.ts`
- `src/engine/plugins/pluginModel.ts`
- `src/engine/plugins/pluginRegistry.ts`
- `src/application/use-cases/`

### Capa importante pero todavia en consolidacion

- `src/features/lab/LabApp.tsx`
- `src/features/lab/useLabRecordingSession.ts`
- `src/features/history/useProjectHistory.ts`
- `src/features/transport/usePlaybackTransport.ts`

### UI de modo app que mezcla realidad con replicacion

- `src/app/`
- `src/features/perform/`
- `src/features/edit/`
- `src/features/project-view/`
- `src/features/settings-view/`

Aqui hay una idea importante:

- varias vistas del modo app reutilizan `LabApp` por modos parciales
  como `perform-only`, `edit-only` y `project-only`.

Eso significa que la UI nueva existe, pero buena parte del comportamiento real
todavia viene del laboratorio.

### Prototipo o placeholder que puedes estudiar al final

- `src/features/plugins-view/PluginsWorkspace.tsx`
- parte de `apps/mimidi-expo/`

Importante:

- el sistema de plugins del engine si es real,
- pero la pantalla `Plugins` del modo app aun es mayormente mock visual.

## 6. Orden recomendado de lectura

Si intentas leer todo por carpetas alfabeticas, vas a perder tiempo. Este orden
es mucho mejor.

### Etapa 1 - Entender la entrada y las dos superficies

Lee primero:

- [src/App.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/App.tsx)
- [src/app/AppMode.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/app/AppMode.tsx)
- [src/features/lab/LabApp.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/lab/LabApp.tsx)

Objetivo:

- entender que existen dos entradas principales:
  - `/lab`
  - `/` con modo app

### Etapa 2 - Entender el dominio musical minimo

Lee:

- [src/engine/midi/notes.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/midi/notes.ts)
- [src/engine/midi/events.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/midi/events.ts)
- [src/engine/audio/audioEngine.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/audio/audioEngine.ts)
- [src/engine/audio/mathematicalInstruments.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/audio/mathematicalInstruments.ts)

Objetivo:

- entender como una nota termina convertida en audio.

### Etapa 3 - Entender el modelo de proyecto

Lee:

- [src/engine/project/projectModel.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/project/projectModel.ts)
- [src/engine/project/projectStorage.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/project/projectStorage.ts)
- [src/features/history/useProjectHistory.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/history/useProjectHistory.ts)

Objetivo:

- entender que es una pista,
- como se guardan notas,
- como funciona timeline,
- y como se persiste/rehace/deshace.

### Etapa 4 - Entender grabacion y reproduccion

Lee:

- [src/features/lab/useLabRecordingSession.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/lab/useLabRecordingSession.ts)
- [src/application/use-cases/playNote.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/application/use-cases/playNote.ts)
- [src/application/use-cases/playRecordedNotes.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/application/use-cases/playRecordedNotes.ts)
- [src/features/transport/usePlaybackTransport.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/transport/usePlaybackTransport.ts)

Objetivo:

- entender el flujo de grabar, detener, reproducir y cancelar.

### Etapa 5 - Entender la UI funcional mas importante

Lee:

- [src/features/piano/PianoPreview.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/piano/PianoPreview.tsx)
- [src/features/timeline/TimelinePreview.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/timeline/TimelinePreview.tsx)
- [src/features/timeline/TrackTimelinePreview.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/timeline/TrackTimelinePreview.tsx)
- [src/features/lab/LabNoteEditor.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/lab/LabNoteEditor.tsx)
- [src/features/lab/LabProjectPanel.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/features/lab/LabProjectPanel.tsx)

Objetivo:

- ver como se expone visualmente el dominio.

### Etapa 6 - Entender extensibilidad y modo app

Lee:

- [src/engine/plugins/pluginModel.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/plugins/pluginModel.ts)
- [src/engine/plugins/pluginRegistry.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/plugins/pluginRegistry.ts)
- [src/engine/plugins/internalPlugins.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/engine/plugins/internalPlugins.ts)
- [src/app/appRoutes.ts](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/app/appRoutes.ts)
- [src/app/AppShell.tsx](C:/SEBASTIAN/5.%20EMPRENDIMIENTO/REACT/MiMIDI/src/app/AppShell.tsx)

Objetivo:

- separar lo que ya es extensible de lo que aun es shell/prototipo.

## 7. Que debes estudiar fuera del repo

No hace falta estudiar 20 temas externos. Solo estos tienen retorno inmediato:

### Prioridad alta

- React moderno con hooks y composicion de estado.
- TypeScript basico/intermedio.
- Web Audio API:
  - `AudioContext`
  - `OscillatorNode`
  - `GainNode`
  - envelopes
  - scheduling basico
- conceptos MIDI basicos:
  - nota
  - numero MIDI
  - velocity
  - `note-on`
  - `note-off`
- manejo de estado inmutable en objetos/arrays.

### Prioridad media

- testing con Vitest y Testing Library.
- `localStorage`.
- fullscreen API del navegador.
- Expo Router y React Native, solo si vas a tocar `apps/mimidi-expo`.

### No urgente todavia

- DSP avanzado
- audio profesional de baja latencia
- plugins externos complejos
- optimizacion extrema de React
- arquitectura nativa profunda de Expo

## 8. Plan de estudio rapido y funcional

Este plan esta pensado para entender el proyecto rapido, no para volverte
experto en todo el stack antes de tocar codigo.

### Plan de 3 dias

#### Dia 1 - Entender el mapa

1. Lee `README.md`.
2. Lee `docs/01`, `docs/05` y `docs/09`.
3. Lee `src/App.tsx`, `src/app/AppMode.tsx` y `src/features/lab/LabApp.tsx`.
4. Corre la app y navega:
   - `/lab`
   - `/?view=perform`
   - `/?view=edit`
   - `/?view=project`

Resultado esperado:

- ya entiendes que partes son laboratorio, shell y vistas replicadas.

#### Dia 2 - Entender el core

1. Lee `engine/midi`.
2. Lee `engine/audio`.
3. Lee `projectModel.ts`.
4. Lee `useLabRecordingSession.ts`.
5. Lee `playRecordedNotes.ts`.

Resultado esperado:

- ya entiendes como se toca, se graba, se guarda y se reproduce una nota.

#### Dia 3 - Entender la UI y probar cambios mentales

1. Lee `PianoPreview`, `TimelinePreview`, `TrackTimelinePreview`.
2. Lee `useProjectHistory.ts`.
3. Lee `App.integration.test.tsx`.
4. Haz este ejercicio mental:
   - "si quiero agregar una nueva accion de proyecto, en que capa iria?"
   - "si quiero agregar un nuevo instrumento, en que archivo iria?"
   - "si quiero cambiar la vista `Perform`, que parte es UI y que parte es core?"

Resultado esperado:

- ya puedes moverte por el repo con criterio y no solo por intuicion.

## 9. Plan aun mas corto si solo tienes unas horas

Si solo tienes entre 2 y 4 horas, haz esto:

1. Lee `README.md`.
2. Lee `src/App.tsx`.
3. Lee `src/features/lab/LabApp.tsx` sin obsesionarte con cada linea.
4. Lee `src/engine/midi/notes.ts`.
5. Lee `src/engine/midi/events.ts`.
6. Lee `src/engine/audio/audioEngine.ts`.
7. Lee `src/engine/project/projectModel.ts`.
8. Lee `src/features/lab/useLabRecordingSession.ts`.
9. Lee `src/application/use-cases/playRecordedNotes.ts`.
10. Lee `src/App.integration.test.tsx`.

Con eso ya deberias captar el 80% del proyecto actual.

## 10. Preguntas guia para comprobar que ya entendiste

Si puedes responder esto, ya estas funcional:

- Como entra el usuario a `lab` y como entra al `modo app`?
- Donde se convierte una nota tipo `A4` en frecuencia?
- Donde vive la logica de grabacion?
- Donde se guardan las notas grabadas?
- Como se decide si una pista suena o esta muteada/solo?
- Como entran los instrumentos aportados por plugins?
- Que partes del modo app son UI nueva y cuales reciclan `LabApp`?

## 11. Riesgos de comprension que debes evitar

- Pensar que `AppMode` es el core del producto.
  - No lo es; es shell/navegacion.
- Pensar que `PluginsWorkspace` representa el sistema de plugins real.
  - No del todo; hoy es mas mock UI que manager definitivo.
- Pensar que Expo ya es la app principal.
  - No lo es; la web sigue siendo la fuente principal de comportamiento.
- Pensar que `LabApp.tsx` es "solo UI".
  - No; hoy es una pieza de coordinacion clave.
- Pensar que audio y MIDI son lo mismo.
  - El proyecto los separa deliberadamente.

## 12. Recomendacion final de estudio

Si quieres entender MiMIDI de forma rapida y util, estudialo en esta secuencia:

1. entrada de app,
2. laboratorio,
3. dominio MIDI,
4. dominio audio,
5. modelo de proyecto,
6. grabacion/reproduccion,
7. timelines,
8. plugins,
9. shell del modo app,
10. Expo al final.

Ese orden te da contexto real pronto y evita perderte en detalles visuales o en
prototipos que todavia no son la fuente principal de verdad.
