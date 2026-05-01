# MiMIDI - Contexto vivo de desarrollo

Este documento registra que se esta moviendo, por que se mueve y como se mueve.
Su objetivo es dejar memoria tecnica viva del trabajo incremental, para que el
proyecto no dependa del chat ni de memoria informal.

## Regla de uso

Cada vez que una fase avance con una decision relevante, este archivo debe
actualizarse con:

- fecha o momento del cambio,
- fase afectada,
- archivos modificados,
- intencion del cambio,
- decision tecnica,
- validacion realizada,
- siguiente paso recomendado.

## Restricciones activas

- El core no usa samples.
- Todo sonido del core debe venir de sintesis matematica.
- React actua como presentacion, no como lugar de logica musical.
- Audio y MIDI se mantienen separados.
- La arquitectura debe seguir hablando del producto: audio, MIDI, instrumentos,
  proyecto, transporte, piano, timeline y plugins.

## Estado actual

El proyecto completo la primera base de la FASE 1: Core de Audio.

Tambien empezo la FASE 3: Piano.

Ahora empezo la FASE 4: MIDI basico.

La app ya permite probar sonido desde una UI temporal:

- seleccionar un instrumento matematico,
- seleccionar una nota musical de prueba,
- tocar una nota de prueba,
- tocar un acorde de prueba,
- alternar el piano entre modo nota y modo acorde,
- tocar notas desde un piano visual de preview,
- sostener notas mientras una tecla del piano esta presionada,
- ver teclas naturales y sostenidas con layout tipo piano,
- registrar eventos MIDI basicos al tocar el piano,
- convertir pares `note-on` / `note-off` en notas con duracion,
- visualizar notas grabadas en una timeline horizontal minima,
- agrupar notas iguales en lanes de timeline,
- limpiar eventos y notas grabadas sin recargar la app,
- reproducir notas grabadas desde la timeline,
- usar un transporte minimo `idle` / `playing`,
- ajustar volumen maestro,
- detener voces activas.

La UI sigue siendo un laboratorio temporal. No representa aun el producto final.

## Movimiento 1 - Refactor del motor de audio

Fase: FASE 1 - Core de Audio

Archivos movidos:

- `src/engine/audio/audioEngine.ts`
- `src/App.tsx`
- `src/App.css`

Intencion:

Convertir el motor inicial, que solo podia tocar una frecuencia simple, en un
core de audio minimo pero extensible.

Como se movio:

- Se mantuvo Web Audio API encapsulada dentro de `audioEngine.ts`.
- Se agrego soporte para multiples voces simultaneas.
- Se agrego `VoiceId` para poder identificar voces activas.
- Se agregaron funciones de control:
  - `startFrequency`
  - `stopVoice`
  - `stopAllVoices`
  - `playFrequency`
  - `setMasterVolume`
- Se agrego una base ADSR:
  - attack
  - decay
  - sustain
  - release
- Se agrego control de waveform usando osciladores nativos:
  - sine
  - square
  - sawtooth
  - triangle

Decision tecnica:

El motor trabaja con osciladores matematicos de Web Audio API. No se introducen
samples, bancos de sonido ni dependencias externas de audio.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El core puede reproducir nota y acorde con varias voces simultaneas, volumen
maestro y envolvente ADSR basica.

## Movimiento 2 - Instrumentos matematicos como presets

Fase: FASE 1 - Core de Audio

Archivos movidos:

- `src/engine/audio/mathematicalInstruments.ts`
- `src/App.tsx`

Intencion:

Evitar que React conozca detalles crudos de sintesis como waveform, volumen por
nota y ADSR. La UI debe elegir instrumentos, no construir sonido.

Como se movio:

- Se creo `mathematicalInstruments.ts`.
- Se definio `MathematicalInstrument`.
- Se definio `MathematicalInstrumentId`.
- Se agregaron presets iniciales:
  - `Pure Sine`
  - `Soft Triangle`
  - `Bright Square`
  - `Saw Lead`
- Se agrego `findMathematicalInstrument`.
- Se agrego `createPlayOptions`.
- `App.tsx` paso de seleccionar una forma de onda a seleccionar un instrumento
  matematico.

Decision tecnica:

Los presets viven junto al dominio de audio porque todavia son parte del core
matematico inicial. No son plugins aun.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La UI consume un concepto musical mas claro: instrumento matematico. Los detalles
de sintesis quedan fuera del componente React.

## Movimiento 3 - Sistema inicial de notas musicales

Fase: FASE 2 - Sistema de Notas

Archivos movidos:

- `src/engine/midi/notes.ts`
- `src/application/use-cases/playNote.ts`
- `src/App.tsx`

Intencion:

Dejar de usar frecuencias crudas en la UI y empezar a expresar intenciones
musicales con notas como `A4`, `C4`, `E4` y `G4`.

Como se movio:

- Se creo `src/engine/midi/notes.ts`.
- Se definio `NoteName`.
- Se definio `Octave`.
- Se definio `MusicalNote`.
- Se agrego `noteToMidiNumber`.
- Se agrego `noteToFrequency`.
- Se agrego una lista inicial `availableNotes`.
- Se creo `src/application/use-cases/playNote.ts`.
- Se agrego `playNote`.
- Se agrego `playNotes`.
- `App.tsx` dejo de llamar `playFrequency(440)` directamente.
- La nota de prueba ahora usa `playNote("A4")`.
- El acorde de prueba ahora usa `playNotes(["C4", "E4", "G4"])`.

Decision tecnica:

El motor MIDI no reproduce sonido. Solo convierte intencion musical en datos
utiles, como numero MIDI y frecuencia.

La coordinacion entre MIDI y audio vive en la capa de aplicacion, dentro de
`src/application/use-cases/playNote.ts`. Esto evita que:

- React tenga logica musical,
- audio conozca reglas MIDI,
- MIDI dependa de Web Audio API.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El sistema ya permite tocar notas musicales por nombre. Este es el primer paso
real hacia piano, acordes y eventos MIDI.

## Movimiento 4 - Octava cromatica y seleccion de nota

Fase: FASE 2 - Sistema de Notas

Archivos movidos:

- `src/engine/midi/notes.ts`
- `src/App.tsx`

Intencion:

Pasar de una nota fija (`A4`) a una nota seleccionable desde la UI temporal,
usando una lista ordenada que pueda alimentar el futuro piano.

Como se movio:

- Se agrego `chromaticNoteNames`.
- Se amplio `pianoPreviewNotes` a una octava cromatica desde `C4` hasta `C5`.
- `availableNotes` ahora apunta a esa lista de preview.
- `App.tsx` agrego estado `selectedNote`.
- `App.tsx` agrego un selector `Nota musical`.
- `playTestNote` ahora llama `playNote(selectedNote)`.

Decision tecnica:

La lista de notas vive en `src/engine/midi/notes.ts` porque representa dominio
MIDI/musical. La UI solo consume `availableNotes`.

La lista se mantiene pequena a proposito: una octava cromatica es suficiente
para validar el sistema y preparar FASE 3 sin convertir la UI temporal en un
piano completo todavia.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya puede tocar cualquier nota de la octava de preview sin usar
frecuencias crudas en React.

## Movimiento 5 - Primer piano visual de preview

Fase: FASE 3 - Piano

Archivos movidos:

- `src/features/piano/PianoPreview.tsx`
- `src/features/piano/PianoPreview.css`
- `src/App.tsx`

Intencion:

Pasar de un selector de nota a una primera interaccion musical visual con teclas
clicables.

Como se movio:

- Se creo `src/features/piano/`.
- Se creo `PianoPreview.tsx`.
- Se creo `PianoPreview.css`.
- `PianoPreview` recibe:
  - `notes`
  - `selectedNote`
  - `playOptions`
  - `onSelectNote`
- Cada tecla llama `playNote(note, 0.75, playOptions)`.
- Las teclas naturales y sostenidas tienen estilos distintos.
- La tecla seleccionada queda marcada visualmente.
- `App.tsx` mantiene el estado de nota seleccionada y pasa datos a la feature.

Decision tecnica:

El piano vive en `src/features/piano` porque es una capacidad de producto, no un
componente generico. Esta feature consume notas del dominio MIDI y reproduce a
traves del caso de uso `playNote`; no llama directamente a Web Audio API.

El piano actual es solo preview. Todavia no es un teclado completo ni una vista
final de performance.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya tiene una primera superficie musical visual. Las notas de
`availableNotes` se pueden tocar como teclas clicables, preparando la expansion
hacia interaccion de piano mas completa.

## Movimiento 6 - Presionar y soltar notas en el piano

Fase: FASE 3 - Piano

Archivos movidos:

- `src/application/use-cases/playNote.ts`
- `src/features/piano/PianoPreview.tsx`

Intencion:

Hacer que el piano se comporte mas como un instrumento real: la nota empieza al
presionar una tecla y termina al soltarla.

Como se movio:

- Se agrego `ActiveNoteId`.
- Se agrego `startNote(note, options)`.
- Se agrego `stopNote(activeNoteId)`.
- `startNote` convierte la nota musical a frecuencia y delega en
  `startFrequency`.
- `stopNote` delega en `stopVoice`.
- `PianoPreview` ahora usa eventos pointer:
  - `onPointerDown`
  - `onPointerUp`
  - `onPointerCancel`
  - `onPointerLeave`
- `PianoPreview` guarda voces activas por nota en un `Map`.
- `PianoPreview` usa estado `activeNotes` para reflejar visualmente teclas
  sostenidas.
- Enter y Space mantienen una reproduccion corta con `playNote` para uso basico
  desde teclado.

Decision tecnica:

La feature de piano no llama a `startFrequency` ni `stopVoice` directamente.
Sigue usando la capa de aplicacion (`startNote` / `stopNote`) para coordinar
MIDI y audio.

El `Map` de voces activas vive dentro de `PianoPreview` porque corresponde a la
interaccion actual del usuario con esa superficie de piano, no al dominio MIDI
todavia.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Las teclas del piano ya pueden sostener notas mientras estan presionadas y
liberarlas al soltar, usando ADSR y voces del motor de audio.

## Movimiento 7 - Layout visual tipo piano

Fase: FASE 3 - Piano

Archivos movidos:

- `src/features/piano/PianoPreview.tsx`
- `src/features/piano/PianoPreview.css`

Intencion:

Mejorar la representacion visual del piano para dejar de mostrar una fila plana
de botones y acercarse a una disposicion real de teclas naturales y sostenidas.

Como se movio:

- `PianoPreview` separa notas naturales y sostenidas.
- Se agrego `getNaturalNotes`.
- Se agrego `getSharpNotePosition`.
- Las teclas naturales se renderizan en una grilla.
- Las teclas sostenidas se ubican sobre las naturales usando posicion absoluta.
- El CSS usa variables locales:
  - `--natural-key-count`
  - `--sharp-key-position`
- Se elimino el scroll horizontal innecesario del preview.

Decision tecnica:

Este cambio sigue viviendo solo en la feature `piano`; no modifica el dominio
MIDI ni el motor de audio. La forma visual del piano es responsabilidad de la
feature, mientras que notas, frecuencias y sonido siguen desacoplados.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El piano de preview se ve mas parecido a un piano real, con teclas negras
superpuestas sobre teclas blancas, y mantiene la interaccion de presionar y
soltar.

## Movimiento 8 - Registro inicial de eventos MIDI

Fase: FASE 4 - MIDI basico

Archivos movidos:

- `src/engine/midi/events.ts`
- `src/features/midi-events/MidiEventLog.tsx`
- `src/features/midi-events/MidiEventLog.css`
- `src/features/piano/PianoPreview.tsx`
- `src/App.tsx`

Intencion:

Empezar a representar intencion musical como eventos MIDI basicos, no solo como
sonido generado.

Como se movio:

- Se creo `src/engine/midi/events.ts`.
- Se definio `MidiNoteEventType` con:
  - `note-on`
  - `note-off`
- Se definio `MidiNoteEvent`.
- Se agrego `createMidiNoteEvent`.
- `PianoPreview` recibio callbacks opcionales:
  - `onNoteOn`
  - `onNoteOff`
- `PianoPreview` emite `note-on` al presionar una tecla.
- `PianoPreview` emite `note-off` al soltar una tecla.
- Se creo `MidiEventLog`.
- `App.tsx` registra los ultimos 12 eventos.
- `App.tsx` muestra los eventos MIDI con tipo, nota y tiempo relativo.

Decision tecnica:

El dominio MIDI define la forma del evento, pero no decide como se muestra ni
como suena. La feature `piano` solo emite eventos hacia arriba. La lista visual
vive en `features/midi-events`.

El tiempo del evento se calcula de forma relativa desde el primer evento
registrado, no desde el render inicial de React. Esto evita impureza durante
render y mantiene el componente estable.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya registra una historia minima de eventos `note-on` y `note-off` al
tocar el piano. Esto abre la puerta a timeline y secuenciacion.

## Movimiento 9 - Notas MIDI completas con duracion

Fase: FASE 4 - MIDI basico

Archivos movidos:

- `src/engine/midi/events.ts`
- `src/features/midi-events/RecordedNoteList.tsx`
- `src/features/midi-events/RecordedNoteList.css`
- `src/App.tsx`

Intencion:

Convertir eventos sueltos `note-on` y `note-off` en una representacion mas util
para edicion musical: notas con inicio y duracion.

Como se movio:

- Se agrego `MidiRecordedNote`.
- Se agrego `createMidiRecordedNote`.
- `App.tsx` mantiene `activeNoteEventsRef` para recordar eventos `note-on`
  activos.
- Cuando llega un `note-off`, se busca su `note-on`.
- Si existe el par, se crea una nota grabada con:
  - `note`
  - `startTime`
  - `duration`
  - `velocity`
- Se creo `RecordedNoteList`.
- La UI muestra notas grabadas con nota, inicio y duracion.

Decision tecnica:

Los eventos `note-on` y `note-off` siguen existiendo como registro crudo. Las
notas grabadas son una segunda representacion derivada, mas cercana a timeline y
edicion.

La asociacion temporal vive por ahora en `App.tsx` como estado de laboratorio.
Cuando aparezca un modelo de proyecto o timeline, esta logica debera moverse a
una capa de aplicacion o dominio mas estable.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya puede transformar una accion de tocar y soltar en una nota MIDI con
duracion. Esto deja listo el camino para una timeline minima.

## Movimiento 10 - Timeline visual minima

Fase: FASE 5 - Timeline

Archivos movidos:

- `src/features/timeline/TimelinePreview.tsx`
- `src/features/timeline/TimelinePreview.css`
- `src/App.tsx`

Intencion:

Convertir la lista de notas grabadas en una primera visualizacion temporal,
posicionando cada nota segun su inicio y dimensionandola segun su duracion.

Como se movio:

- Se creo `src/features/timeline/`.
- Se creo `TimelinePreview.tsx`.
- Se creo `TimelinePreview.css`.
- `TimelinePreview` recibe `MidiRecordedNote[]`.
- Ordena notas por `startTime`.
- Calcula una longitud minima de timeline.
- Muestra una regla simple desde `0s` hasta el final detectado.
- Dibuja cada nota en una fila con:
  - etiqueta de nota,
  - posicion relativa por `startTime`,
  - ancho relativo por `duration`.
- `App.tsx` ensambla `TimelinePreview` usando `recordedNotes`.

Decision tecnica:

La timeline es una feature de visualizacion. No reproduce sonido, no crea
eventos y no modifica el dominio MIDI. Consume notas ya grabadas y las presenta
temporalmente.

La representacion es deliberadamente minima: filas por nota grabada, no aun una
DAW completa ni un editor de clips.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya tiene una timeline horizontal basica que permite ver cuando empieza
cada nota y cuanto dura.

## Movimiento 11 - Lanes de timeline por nota musical

Fase: FASE 5 - Timeline

Archivos movidos:

- `src/features/timeline/TimelinePreview.tsx`

Intencion:

Hacer la timeline mas legible agrupando todas las notas iguales en una misma
lane, en lugar de crear una fila por cada nota grabada.

Como se movio:

- Se agrego `TimelineLane`.
- Se agrego `groupNotesByPitch`.
- La timeline agrupa `MidiRecordedNote[]` por `note`.
- Cada lane contiene varias notas grabadas de la misma altura.
- Las notas dentro de cada lane se ordenan por `startTime`.
- Las lanes se ordenan por altura musical usando `noteToMidiNumber`.
- La escala temporal sigue siendo comun para todas las lanes.

Decision tecnica:

La timeline usa `noteToMidiNumber` del dominio MIDI para ordenar por altura, en
lugar de ordenar alfabeticamente o segun orden de grabacion. Esto conserva la
semantica musical sin mezclar audio con visualizacion.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La timeline ya muestra varias ocurrencias de la misma nota en una sola fila.
Esto se acerca mas a una vista tipo piano roll, sin convertirse aun en un editor
completo.

## Movimiento 12 - Limpieza de sesion de prueba

Fase: FASE 5 - Timeline

Archivos movidos:

- `src/App.tsx`

Intencion:

Permitir seguir probando grabacion, eventos y timeline sin recargar la app ni
arrastrar datos viejos.

Como se movio:

- Se agrego `clearSession`.
- `clearSession` llama `stopAllVoices`.
- Limpia `activeNoteEventsRef`.
- Reinicia `startedAtRef`.
- Limpia `midiEvents`.
- Limpia `recordedNotes`.
- Se agrego el boton `Limpiar` junto a las acciones del laboratorio.

Decision tecnica:

La limpieza vive por ahora en `App.tsx` porque todavia es estado de laboratorio.
Cuando exista un modelo de proyecto o sesion, esta accion debera moverse a una
capa de aplicacion.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La sesion de prueba puede reiniciarse sin recargar el navegador. La siguiente
grabacion vuelve a empezar con tiempo relativo `0s`.

## Movimiento 13 - Reproduccion de notas grabadas

Fase: FASE 5 - Timeline

Archivos movidos:

- `src/application/use-cases/playRecordedNotes.ts`
- `src/App.tsx`

Intencion:

Permitir escuchar lo que ya se ve en la timeline, usando notas grabadas con
`startTime` y `duration`.

Como se movio:

- Se creo `playRecordedNotes`.
- Se creo `PlaybackHandle`.
- `playRecordedNotes` recibe `MidiRecordedNote[]`.
- Calcula el primer `startTime` como punto cero de reproduccion.
- Agenda cada nota con `window.setTimeout`.
- Cada nota se reproduce con `playNote(note, duration, options)`.
- Devuelve `cancel` para limpiar timers pendientes.
- Tolera listas vacias devolviendo un handle cancelable sin efectos.
- `App.tsx` agrego `playbackHandleRef`.
- `App.tsx` agrego `playRecording`.
- `App.tsx` agrego `stopPlayback`.
- El boton `Detener` ahora cancela reproduccion grabada y detiene voces.
- El boton `Limpiar` tambien cancela reproduccion pendiente.
- Se agrego el boton `Reproducir grabacion`.

Decision tecnica:

La reproduccion grabada vive en `application/use-cases` porque coordina datos
MIDI grabados con reproduccion de audio. No pertenece a la timeline visual ni al
motor MIDI puro.

El scheduling actual usa timers del navegador como primera base funcional. Mas
adelante puede reemplazarse por scheduling mas preciso con Web Audio si el
proyecto lo necesita.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya puede grabar notas, visualizarlas en timeline y reproducir la captura
basica usando instrumentos matematicos.

## Movimiento 14 - Transporte minimo para reproduccion

Fase: FASE 5 - Timeline

Archivos movidos:

- `src/application/use-cases/playRecordedNotes.ts`
- `src/App.tsx`
- `src/App.css`
- `.gitignore`

Intencion:

Dar un primer estado de transporte a la reproduccion grabada para evitar doble
play, mostrar cuando algo esta sonando y preparar controles mas claros.

Como se movio:

- Se agrego `PlayRecordedNotesOptions`.
- `playRecordedNotes` acepta `onComplete`.
- `playRecordedNotes` agenda un timer de finalizacion.
- `PlaybackHandle.cancel` cancela notas pendientes y finalizacion.
- `App.tsx` agrego `TransportState`.
- `App.tsx` agrego estado `transportState`.
- `playRecording` no inicia si ya esta en `playing`.
- El boton de reproduccion se deshabilita cuando no hay notas o esta sonando.
- El texto del boton cambia a `Reproduciendo`.
- `stopPlayback` vuelve el transporte a `idle`.
- `App.css` agrego estilo para botones deshabilitados.
- Se quito `/docs` de `.gitignore` para que la documentacion viva pueda
  versionarse.

Decision tecnica:

El transporte todavia es minimo y vive en `App.tsx` porque el proyecto sigue en
modo laboratorio. La reproduccion concreta sigue encapsulada en
`playRecordedNotes`.

La documentacion de `docs/` debe versionarse porque funciona como fuente de
verdad viva del proyecto.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La reproduccion grabada ya tiene estado visible y evita doble ejecucion. La app
tambien conserva la documentacion como parte versionable del proyecto.

## Movimiento 15 - Transporte separado de App

Fase: FASE 5 - Timeline

Archivos movidos:

- `src/features/transport/usePlaybackTransport.ts`
- `src/App.tsx`

Intencion:

Reducir responsabilidad de `App.tsx` y convertir la reproduccion grabada en una
capacidad de transporte separada.

Como se movio:

- Se creo `src/features/transport/`.
- Se creo `usePlaybackTransport`.
- Se definio `TransportState`.
- El hook mantiene estado `idle` / `playing`.
- El hook guarda el `PlaybackHandle` activo.
- El hook expone:
  - `state`
  - `isPlaying`
  - `play`
  - `stop`
- `App.tsx` dejo de guardar `transportState`.
- `App.tsx` dejo de guardar `playbackHandleRef`.
- `App.tsx` delega play/stop en `usePlaybackTransport`.

Decision tecnica:

Se uso `features/transport` porque todavia es una capacidad de UI/laboratorio
para reproducir una captura. Si el transporte crece hacia tempo, posicion,
looping o secuenciacion, debera migrar o dividirse hacia `engine/transport` y
casos de uso mas estables.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

`App.tsx` vuelve a ser mas ensamblador y menos dueño de la reproduccion. El
transporte minimo ya tiene una frontera propia.

## Movimiento 16 - Proyecto musical minimo

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/App.tsx`

Intencion:

Dejar de tratar las notas grabadas como estado suelto del laboratorio y empezar
a representarlas dentro de un proyecto musical minimo.

Como se movio:

- Se creo `projectModel.ts`.
- Se definio `ProjectTrack`.
- Se definio `MusicalProject`.
- Se agrego `createDefaultProject`.
- Se agrego `appendNoteToTrack`.
- Se agrego `clearTrackNotes`.
- `App.tsx` reemplazo `recordedNotes` por `project`.
- `App.tsx` consume `project.tracks[0]` como pista principal actual.
- Al grabar una nota, se agrega a `project.tracks[0].notes`.
- `RecordedNoteList`, `TimelinePreview` y `playRecording` ahora usan la pista
  del proyecto.

Decision tecnica:

Se eligio una estructura minima con una sola pista inicial para no sobrecargar
la arquitectura antes de tiempo. El objetivo es abrir la puerta a persistencia y
exportacion, no construir todavia un editor multipista completo.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Las notas grabadas ya viven dentro de un proyecto musical minimo. Esto hace que
el siguiente paso natural sea persistir o exportar esa estructura.

## Movimiento 17 - Visibilidad y exportacion del proyecto

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.tsx`
- `src/App.css`

Intencion:

Hacer visible el proyecto actual y permitir sacar su estructura a un archivo
JSON real.

Como se movio:

- `App.tsx` muestra un resumen del proyecto actual:
  - nombre del proyecto,
  - nombre de la pista,
  - cantidad de notas.
- Se agrego `exportProject`.
- `exportProject` serializa `project` con `JSON.stringify`.
- Se crea un `Blob` de tipo `application/json`.
- Se genera una URL temporal.
- Se descarga el archivo con nombre basado en `project.name`.
- Se agrego el boton `Exportar JSON`.
- `App.css` agrega estilos para `project-summary`.

Decision tecnica:

La exportacion vive por ahora en `App.tsx` porque sigue siendo una accion de
laboratorio sobre el proyecto actual. Si luego aparece import/export mas serio,
debera pasar a una capa de aplicacion o infraestructura.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El proyecto ya no solo existe en memoria: puede inspeccionarse en la UI y
exportarse a JSON.

## Movimiento 18 - Importacion de proyecto desde JSON

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/App.tsx`
- `src/App.css`

Intencion:

Cerrar el ciclo basico de persistencia: exportar un proyecto y volver a cargarlo
en la app.

Como se movio:

- Se agrego `parseImportedProject`.
- `parseImportedProject` valida estructura basica de:
  - proyecto,
  - pistas,
  - notas grabadas.
- `App.tsx` agrego `importInputRef`.
- `App.tsx` agrego `openImportDialog`.
- `App.tsx` agrego `importProjectFile`.
- La importacion:
  - lee el archivo JSON,
  - intenta parsearlo,
  - detiene reproduccion activa,
  - limpia eventos temporales,
  - reemplaza el proyecto en memoria.
- Se agrego el boton `Importar JSON`.
- Se agrego `projectMessage` para mostrar feedback corto al usuario.

Decision tecnica:

La validacion del formato vive en `projectModel.ts` para que el dominio del
proyecto sea quien define que es un proyecto valido. La UI solo pide el archivo
y reacciona al resultado.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El proyecto ya puede exportarse e importarse como JSON. Eso establece una
persistencia ligera real, aunque todavia sin almacenamiento automatico.

## Movimiento 19 - Persistencia local automatica

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectStorage.ts`
- `src/App.tsx`

Intencion:

Permitir que el proyecto se restaure automaticamente al volver a abrir la app,
sin depender siempre de importar un archivo manualmente.

Como se movio:

- Se creo `projectStorage.ts`.
- Se agrego `PROJECT_STORAGE_KEY`.
- Se agrego `loadStoredProject`.
- Se agrego `saveProject`.
- `loadStoredProject` usa `parseImportedProject` para validar lo guardado.
- `App.tsx` ahora intenta cargar el proyecto inicial desde `localStorage`.
- Si no existe proyecto guardado, crea el proyecto por defecto.
- `App.tsx` persiste automaticamente el proyecto cada vez que cambia.
- `App.tsx` muestra mensaje inicial si se restauraron notas desde almacenamiento.

Decision tecnica:

La persistencia local vive en `engine/project` porque sigue siendo una
infraestructura muy cercana al dominio del proyecto. No se introdujo base de
datos, backend ni sincronizacion externa.

La restauracion sigue validando formato con `parseImportedProject`, para evitar
que un JSON invalido en `localStorage` rompa el arranque.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya recuerda automaticamente el ultimo proyecto guardado en el navegador.
Esto reduce friccion y hace que MiMIDI empiece a sentirse como una herramienta
persistente.

## Estado de archivos relevantes

### `src/engine/audio/audioEngine.ts`

Responsabilidad actual:

- Encapsular Web Audio API.
- Crear y detener voces.
- Aplicar volumen maestro.
- Aplicar ADSR.
- Reproducir frecuencias.

No debe:

- conocer React,
- conocer componentes,
- usar samples,
- mezclar reglas MIDI.

### `src/engine/audio/mathematicalInstruments.ts`

Responsabilidad actual:

- Definir presets matematicos del core.
- Convertir instrumentos a opciones reproducibles por el motor de audio.

No debe:

- cargar archivos de audio,
- depender de UI,
- convertirse en marketplace de plugins.

### `src/App.tsx`

Responsabilidad actual:

- Laboratorio temporal para probar el core.
- Permitir seleccionar instrumento matematico.
- Permitir seleccionar una nota musical de prueba.
- Disparar nota musical, acorde musical y detener voces.
- Ensamblar la feature `PianoPreview`.
- Registrar y mostrar eventos MIDI basicos de preview.
- Derivar notas grabadas desde pares `note-on` / `note-off`.
- Ensamblar la timeline minima con notas grabadas.
- Limpiar la sesion de prueba.
- Reproducir y detener grabaciones basicas.
- Consumir transporte minimo `idle` / `playing`.
- Consumir un proyecto musical minimo.
- Mostrar y exportar el proyecto actual.
- Importar el proyecto actual desde JSON.
- Permitir renombrar proyecto y pista.
- Manejar pista activa y creacion de nuevas pistas.

No debe:

- contener logica de sintesis,
- contener mapeo MIDI complejo,
- crecer como pantalla final sin separar features.

### `src/engine/midi/events.ts`

Responsabilidad actual:

- Definir eventos MIDI basicos.
- Crear eventos `note-on` y `note-off` con nota, tiempo y velocity.
- Definir notas MIDI grabadas con inicio y duracion.
- Crear notas grabadas desde pares de eventos.

No debe:

- reproducir sonido,
- renderizar UI,
- depender de React,
- depender de Web Audio API.

### `src/engine/project/projectModel.ts`

Responsabilidad actual:

- Definir un proyecto musical minimo.
- Definir pistas del proyecto.
- Agregar notas a una pista.
- Limpiar notas de una pista.
- Parsear e importar un proyecto JSON valido.
- Renombrar proyecto y pista.
- Crear y agregar nuevas pistas.
- Limpiar notas de todas las pistas.

No debe:

- reproducir audio,
- renderizar UI,
- depender de React,
- definir timeline visual.

### `src/engine/project/projectStorage.ts`

Responsabilidad actual:

- Guardar proyecto en `localStorage`.
- Restaurar proyecto desde `localStorage`.
- Reutilizar el parser del dominio del proyecto al cargar datos.

No debe:

- renderizar UI,
- reproducir audio,
- definir estructura del proyecto por si sola,
- saltarse la validacion del formato.

### `src/features/midi-events/MidiEventLog.tsx`

Responsabilidad actual:

- Mostrar una lista simple de eventos MIDI recientes.

No debe:

- crear eventos,
- reproducir audio,
- convertirse en timeline completa todavia.

### `src/features/midi-events/RecordedNoteList.tsx`

Responsabilidad actual:

- Mostrar notas MIDI grabadas con inicio y duracion.

No debe:

- reproducir audio,
- calcular frecuencias,
- convertirse en timeline visual completa todavia.

### `src/features/timeline/TimelinePreview.tsx`

Responsabilidad actual:

- Visualizar notas grabadas en una linea temporal simple.
- Agrupar notas por altura musical.
- Posicionar notas por `startTime`.
- Dimensionar notas por `duration`.

No debe:

- reproducir audio,
- crear eventos MIDI,
- editar clips todavia,
- contener logica de sintesis.

### `src/features/piano/PianoPreview.tsx`

Responsabilidad actual:

- Renderizar notas como teclas clicables.
- Marcar la nota seleccionada.
- Iniciar notas al presionar.
- Detener notas al soltar.
- Separar visualmente teclas naturales y sostenidas.
- Delegar reproduccion al caso de uso `playNote`, `startNote` y `stopNote`.

No debe:

- implementar sintesis,
- convertir notas a frecuencia,
- manejar Web Audio API,
- cargar samples.

### `src/engine/midi/notes.ts`

Responsabilidad actual:

- Representar nombres de notas musicales.
- Exponer una lista ordenada de notas para pruebas y futuro piano.
- Convertir nota musical a numero MIDI.
- Convertir nota musical a frecuencia.

No debe:

- reproducir audio,
- depender de Web Audio API,
- conocer componentes React,
- cargar samples.

### `src/application/use-cases/playNote.ts`

Responsabilidad actual:

- Coordinar la intencion musical de tocar una nota con el motor de audio.
- Convertir `MusicalNote` a frecuencia usando el motor MIDI.
- Delegar reproduccion corta a `audioEngine`.
- Iniciar y detener notas sostenidas desde intencion musical.

No debe:

- definir UI,
- implementar sintesis,
- guardar estado de proyecto.

### `src/application/use-cases/playRecordedNotes.ts`

Responsabilidad actual:

- Reproducir notas MIDI grabadas.
- Agendar notas por `startTime`.
- Delegar sonido a `playNote`.
- Permitir cancelar timers pendientes.
- Notificar finalizacion de reproduccion.

No debe:

- renderizar UI,
- definir instrumentos,
- modificar eventos MIDI,
- usar samples.

### `src/features/transport/usePlaybackTransport.ts`

Responsabilidad actual:

- Manejar estado de transporte `idle` / `playing`.
- Iniciar reproduccion de notas grabadas.
- Detener reproduccion y voces activas.
- Guardar el handle de reproduccion activa.

No debe:

- renderizar UI,
- definir notas MIDI,
- sintetizar sonido directamente,
- convertirse en modelo final de proyecto.

## Movimiento 20 - Renombrar proyecto y pista

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/App.tsx`
- `src/App.css`

Intencion:

Hacer que la persistencia sea realmente util permitiendo personalizar el nombre
del proyecto y de la pista actual.

Como se movio:

- Se agrego `renameProject`.
- Se agrego `renameTrack`.
- `App.tsx` agrega edicion de:
  - `project.name`
  - `primaryTrack.name`
- Se agregaron `updateProjectName` y `updateTrackName`.
- La UI ahora tiene inputs para renombrar proyecto y pista.
- Los nombres actualizados siguen funcionando con:
  - exportacion JSON,
  - importacion JSON,
  - `localStorage`.

Decision tecnica:

El renombrado vive en `projectModel.ts` porque sigue siendo una operacion sobre
el dominio del proyecto, no una transformacion exclusiva de UI.

La UI usa valores por defecto cuando el usuario deja un nombre vacio, para
evitar estados incompletos en el proyecto.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El proyecto ya no es una estructura fija generica. Ahora puede tener identidad
propia y esa identidad persiste.

## Movimiento 21 - Multipista minima

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/App.tsx`
- `src/App.css`

Intencion:

Dar el primer paso real hacia proyecto multipista sin convertir MiMIDI todavia
en un editor complejo.

Como se movio:

- Se agrego `createProjectTrack`.
- Se agrego `appendTrack`.
- Se agrego `clearAllTrackNotes`.
- `App.tsx` ahora maneja `activeTrackId`.
- La UI permite seleccionar `Pista activa`.
- La UI permite crear `Nueva pista`.
- Las notas nuevas se graban en la pista activa.
- `RecordedNoteList` y `TimelinePreview` muestran la pista activa.
- `Reproducir grabacion` usa notas de todas las pistas.
- `Limpiar` limpia notas de todo el proyecto.
- El resumen del proyecto ahora muestra cantidad de pistas.

Decision tecnica:

La multipista se mantiene deliberadamente minima:

- sin borrar pistas,
- sin mute/solo,
- sin timeline separada por pista visual completa,
- sin mezcla avanzada.

Eso permite validar el modelo antes de crecer.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya no depende de una sola pista. El proyecto puede contener varias pistas
y grabar en cualquiera de ellas.

## Movimiento 22 - Instrumento por pista y acordes grabados

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/midi/events.ts`
- `src/engine/project/projectModel.ts`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/App.tsx`

Intencion:

Corregir una limitacion importante del modelo: que las notas grabadas recuerden
con que instrumento fueron creadas y que `Tocar acorde` deje de ser solo una
demo sonora para convertirse en grabacion real.

Como se movio:

- `MidiRecordedNote` ahora guarda `instrumentId`.
- `ProjectTrack` ahora guarda `instrumentId`.
- Se agrego `updateTrackInstrument`.
- El selector de instrumento ahora modifica la pista activa.
- Cada nota grabada conserva el `instrumentId` del momento en que fue creada.
- La reproduccion grabada usa el `instrumentId` guardado en cada nota.
- Se agrego `appendNotesToTrack`.
- `Tocar acorde` ahora:
  - construye notas desde raiz + tipo de acorde,
  - las reproduce,
  - las guarda simultaneamente en la pista activa.
- Se agrego selector de `Tipo de acorde`.
- `Tocar nota` tambien graba una nota simple en la pista activa.
- Las notas sostenidas del piano recuerdan `trackId` e `instrumentId` del
  momento de `note-on`.

Decision tecnica:

Se eligio guardar `instrumentId` en cada nota grabada, ademas del instrumento de
la pista. Eso permite que una grabacion antigua no cambie retroactivamente de
sonido si luego el usuario cambia el instrumento actual de la pista.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La grabacion ya es mucho mas fiel al proyecto musical real: cada pista tiene su
instrumento y los acordes grabados quedan persistidos correctamente.

## Movimiento 23 - Modo de piano y borrado puntual de notas

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/features/piano/PianoPreview.tsx`
- `src/engine/project/projectModel.ts`
- `src/features/midi-events/RecordedNoteList.tsx`
- `src/features/midi-events/RecordedNoteList.css`
- `src/App.tsx`
- `src/App.css`

Intencion:

Corregir el desacople entre el selector de tipo de acorde y el teclado visual,
y dar una primera capacidad real de edicion sobre la pista activa.

Como se movio:

- Se agrego un modo de interaccion del piano:
  - `note`
  - `chord`
- `App.tsx` ahora expone un switch visual `Nota / Acorde`.
- El piano recibe `interactionMode`.
- El piano recibe `getPlayableNotes`.
- En modo `chord`, al presionar una tecla del piano:
  - se calcula el acorde desde esa raiz,
  - se disparan varias voces,
  - se emiten varios eventos `note-on`,
  - al soltar se emiten varios `note-off`.
- Se agrego `removeNoteFromTrack`.
- `RecordedNoteList` ahora puede borrar una nota individual.
- `App.tsx` conecta ese borrado a la pista activa.

Decision tecnica:

El teclado visual no calcula acordes por si solo. Recibe desde arriba la forma
de resolver que notas reales debe tocar. Asi la feature `piano` sigue siendo
una superficie de interaccion y no absorbe reglas musicales que pertenecen a la
aplicacion.

El borrado se implemento primero desde la lista grabada para abrir edicion
basica sin convertir la timeline todavia en editor complejo.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El selector de tipo de acorde ahora tambien afecta al piano visual cuando el
modo esta en `Acorde`, y la pista activa ya permite corregir errores borrando
notas puntuales.

## Movimiento 24 - Reinicio de proyecto, borrado de pista y edicion desde timeline

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/features/midi-events/RecordedNoteList.tsx`
- `src/features/midi-events/RecordedNoteList.css`
- `src/features/timeline/TimelinePreview.tsx`
- `src/features/timeline/TimelinePreview.css`
- `src/App.tsx`
- `src/App.css`

Intencion:

Resolver una confusion de UX en la accion `Limpiar` y avanzar la edicion para
que lista y timeline trabajen juntas sobre la misma nota seleccionada.

Como se movio:

- Se agrego `removeTrack`.
- Se agrego `resetProject`.
- `App.tsx` ahora separa:
  - `Limpiar notas`: borra solo notas/eventos,
  - `Reiniciar proyecto`: vuelve a una sola pista y nombre por defecto.
- Se agrego boton `Eliminar pista`.
- Se protege la regla de negocio: siempre debe quedar al menos una pista.
- Se agrego `selectedRecordedNoteId` en `App.tsx`.
- `RecordedNoteList` ahora permite seleccionar nota.
- `TimelinePreview` ahora permite seleccionar nota con click.
- `TimelinePreview` agrega `Borrar nota seleccionada`.
- Lista y timeline comparten seleccion y resaltado visual.

Decision tecnica:

Se mantuvo `Limpiar notas` como accion rapida de sesion y se agrego
`Reiniciar proyecto` como accion estructural. Asi se evita mezclar dos
intenciones diferentes en un solo boton.

La seleccion se centralizo en `App.tsx` para no duplicar estado en lista y
timeline.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ahora permite:

- borrar pistas de forma controlada,
- reiniciar proyecto completo sin ambiguedad,
- seleccionar la misma nota desde lista y timeline,
- borrar esa nota desde cualquiera de las dos superficies.

## Movimiento 25 - Edicion de inicio y duracion de nota seleccionada

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/App.tsx`
- `src/App.css`

Intencion:

Pasar de una edicion basada solo en borrar a una edicion de correccion temporal
sobre la nota seleccionada.

Como se movio:

- Se agrego `updateNoteInTrack`.
- `App.tsx` calcula `selectedRecordedNote` desde la pista activa.
- Se agrego panel `Editar nota seleccionada`.
- El panel muestra:
  - nota,
  - inicio en segundos,
  - duracion en segundos.
- Se agregaron handlers:
  - `updateSelectedNoteStartTime`
  - `updateSelectedNoteDuration`
- Se aplican limites:
  - `startTime >= 0`
  - `duration >= 0.01`
- Lista y timeline se actualizan inmediatamente al editar.
- Se agrego ajuste responsive para que el panel no rompa en movil.

Decision tecnica:

La actualizacion de notas se implemento en el modelo (`projectModel`) para que
la regla de cambio no quede acoplada a una vista concreta.

El panel vive en `App.tsx` porque todavia estamos en etapa de laboratorio y
validacion de flujo.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El proyecto ya permite corregir posicion y duracion de notas sin regrabar ni
recrear la pista.

## Movimiento 26 - Edicion por arrastre en timeline

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/features/timeline/TimelinePreview.tsx`
- `src/features/timeline/TimelinePreview.css`
- `src/App.tsx`

Intencion:

Pasar de edicion por inputs a una interaccion directa en timeline para mover y
redimensionar notas con gestos simples.

Como se movio:

- `TimelinePreview` ahora acepta `onUpdateNote`.
- Se agrego gesto de arrastre del bloque para mover `startTime`.
- Se agrego tirador lateral para cambiar `duration`.
- El movimiento usa conversion pixel-a-segundos segun ancho real del track.
- Se conservan limites:
  - `startTime >= 0`
  - `duration >= 0.01`
- `App.tsx` centraliza `updateRecordedNote` y lo comparte con:
  - panel `Editar nota seleccionada`,
  - timeline por arrastre.

Decision tecnica:

Se reutilizo la misma operacion de dominio (`updateNoteInTrack`) para todas las
formas de edicion, evitando reglas duplicadas entre vista y modelo.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Las notas ahora pueden ajustarse con interaccion directa sobre la timeline, no
solo con campos numericos.

## Movimiento 27 - Snap opcional y duplicado de nota

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/engine/project/projectModel.ts`
- `src/App.tsx`
- `src/App.css`

Intencion:

Agregar precision opcional al editar notas y acelerar iteracion musical con una
accion rapida de duplicado.

Como se movio:

- Se agrego `duplicateNoteInTrack`.
- Se agrego switch `Snap` en herramientas de timeline.
- Se agrego selector de paso en segundos:
  - `0.05`
  - `0.10`
  - `0.25`
  - `0.50`
- `updateRecordedNote` ahora aplica cuantizacion cuando `Snap` esta activo.
- Se agrego boton `Duplicar nota` para la nota seleccionada.
- El duplicado usa offset corto:
  - con snap: el paso seleccionado,
  - sin snap: `0.05s`.

Decision tecnica:

Se mantuvo `Snap` desactivado por defecto para no romper el flujo libre de
edicion. La cuantizacion se aplica en el mismo punto de actualizacion que usan
timeline y panel numerico, garantizando consistencia.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La edicion ahora combina libertad y precision: se puede editar libremente o con
grid temporal, y duplicar notas seleccionadas en un paso.

## Movimiento 28 - Undo/Redo basico con historial acotado

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.tsx`
- `src/App.css`

Intencion:

Permitir recuperar y reaplicar cambios de edicion sin perder progreso,
manteniendo bajo control el uso de memoria.

Como se movio:

- Se agrego historial en memoria:
  - `undoStack`
  - `redoStack`
- Se agrego limite de historial `HISTORY_LIMIT = 20`.
- Se agrego helper `applyProjectUpdate` para centralizar mutaciones de proyecto.
- Las mutaciones del proyecto ahora registran historial y limpian `redo`.
- Se agregaron acciones:
  - `undoProjectEdit`
  - `redoProjectEdit`
- Se agregaron botones `Deshacer` y `Rehacer` en herramientas de timeline.
- Al importar proyecto se limpia historial para evitar deshacer sobre otra base.

Decision tecnica:

El historial se guarda por snapshots de `project` para mantener implementacion
simple y robusta en esta fase de laboratorio. El limite de 20 entradas evita
crecimiento indefinido.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La app ya permite deshacer y rehacer cambios recientes de proyecto/edicion con
una UX directa y acotada.

## Movimiento 29 - Undo visible por arrastre + atajos de teclado

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/features/timeline/TimelinePreview.tsx`
- `src/App.tsx`
- `src/App.css`

Intencion:

Corregir la sensacion de que `Deshacer/Rehacer` no cambia nada al mover notas en
timeline y hacer el flujo mas rapido con teclado.

Como se movio:

- La edicion por arrastre ahora distingue dos fases:
  - `transient`: preview visual durante movimiento,
  - `commit`: cierre del gesto para historial.
- Cada arrastre/redimensionado guarda un solo paso de historial.
- `updateRecordedNote` ahora acepta `historyMode`.
- Se agregaron atajos:
  - `Ctrl/Cmd + Z` para deshacer,
  - `Ctrl/Cmd + Shift + Z` para rehacer.
- Se ignoran atajos cuando el foco esta en inputs/selects para no romper
  escritura.
- Se agrego indicador de historial visible:
  - `Historial: x/20 | Rehacer: y`.
- Se ajusto layout de herramientas para evitar controles comprimidos.

Decision tecnica:

Separar preview de commit evita llenar el historial con micro-variaciones del
puntero y hace que cada click en `Deshacer` produzca un cambio claramente
visible.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

`Deshacer/Rehacer` ahora es perceptible tras arrastrar notas y el usuario tiene
feedback claro de cuanto historial queda disponible.

## Movimiento 30 - Commit de drag y atajo Ctrl/Cmd+Y

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.tsx`
- `src/App.css`

Intencion:

Corregir el caso en el que los botones `Deshacer/Rehacer` parecian no mover
notas tras un arrastre, y alinear el atajo de rehacer a `Ctrl/Cmd + Y`.

Como se movio:

- Se agrego referencia `transientHistoryBaseRef` para capturar estado base al
  iniciar drag.
- Durante drag (`transient`) se actualiza la UI sin empujar historial.
- Al soltar (`commit`) se guarda un solo snapshot en `undoStack`.
- Se limpia estado transitorio al hacer:
  - importar proyecto,
  - limpiar notas,
  - reiniciar proyecto,
  - deshacer/rehacer.
- Se cambio atajo de rehacer a:
  - `Ctrl/Cmd + Y`
- Se agrego texto corto de atajos visible en herramientas.

Decision tecnica:

Separar historial transitorio de historial comprometido evita pasos de deshacer
invisibles y hace que cada click de boton tenga efecto claro.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Los botones `Deshacer/Rehacer` ahora reflejan cambios visibles tras mover notas
en timeline, igual que los atajos de teclado.

## Movimiento 31 - Revertir nota seleccionada

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.tsx`

Intencion:

Permitir recuperar una nota puntual sin tener que deshacer cambios globales del
proyecto paso por paso.

Como se movio:

- Se agrego accion `Revertir nota`.
- La accion busca en `undoStack` el ultimo snapshot donde esa nota existia con
  `startTime` o `duration` diferentes.
- Si encuentra candidato:
  - restaura ese snapshot,
  - mueve estado actual a `redoStack`,
  - recorta `undoStack` hasta el punto restaurado.
- Si no hay candidato, muestra mensaje informativo.

Decision tecnica:

Se implemento como salto controlado de historial para priorizar velocidad de
edicion focalizada, manteniendo compatibilidad con `Deshacer/Rehacer`.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

La nota seleccionada puede volver rapidamente a su ultimo estado comprometido
sin revertir toda la sesion de edicion.

## Movimiento 32 - Undo robusto, atajos globales y estado de nota

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.tsx`
- `src/App.css`

Intencion:

Corregir casos donde `Deshacer/Rehacer` no mostraba cambios visibles y fortalecer
atajos de teclado en escenarios con foco dentro de inputs.

Como se movio:

- Se agrego comparador `areProjectsEquivalent`.
- `undoProjectEdit` ahora salta snapshots equivalentes hasta encontrar un cambio
  visible.
- `redoProjectEdit` aplica la misma logica para evitar rehacer no-op.
- `updateRecordedNote` evita guardar commits sin cambio real.
- Los atajos `Ctrl/Cmd + Z` y `Ctrl/Cmd + Y` ahora funcionan aunque el foco este
  en controles de formulario.
- Se estabilizaron atajos con refs de accion para evitar cierres rotos por
  orden de declaracion y mantener boton/teclado sincronizados.
- Se agrego etiqueta visual de nota:
  - `Nota modificada`
  - `Nota sin cambios`

Decision tecnica:

Filtrar snapshots equivalentes mejora percepcion de `Undo/Redo` sin romper el
historial acotado existente.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Los botones y atajos de historial se comportan de forma consistente y con
feedback visual claro sobre el estado de la nota seleccionada.

## Movimiento 33 - Historial de drag sin no-op + indicador activo

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.tsx`
- `src/App.css`
- `src/features/timeline/TimelinePreview.tsx`

Intencion:

Corregir casos donde `Deshacer` no parecia actuar y dar visibilidad al estado
de interaccion durante arrastre en timeline.

Como se movio:

- Se rehizo el commit de edicion de nota para evitar snapshots sin cambio real.
- Si el commit final no cambia el proyecto, no se agrega historial.
- Si el resultado final coincide con la base transitoria, no se agrega historial.
- Se agrego callback `onDragStateChange` desde `TimelinePreview`.
- Se agrego indicador visual:
  - `Arrastre activo`
  - `Arrastre inactivo`

Decision tecnica:

Evitar no-op en historial hace que cada `Deshacer` tenga efecto visible y evita
botones habilitados con comportamiento confuso.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

`Deshacer/Rehacer` refleja cambios reales tras mover notas y el usuario ve el
estado de arrastre en tiempo real.

## Movimiento 34 - Historial extraido a hook y recuperacion de Undo/Redo

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/features/history/useProjectHistory.ts`
- `src/App.tsx`

Intencion:

Eliminar fragilidad del historial embebido en `App.tsx` y recuperar
confiabilidad de `Deshacer/Rehacer` y atajos en una sola fuente de verdad.

Como se movio:

- Se creo `useProjectHistory`.
- El hook centraliza:
  - `undoStack`
  - `redoStack`
  - `applyUpdate`
  - `applyTransientUpdate`
  - `commitTransientUpdate`
  - `undo`
  - `redo`
  - `replaceState`
- `App.tsx` dejo de manejar manualmente los setters internos del historial.
- `updateRecordedNote` ahora usa el flujo del hook para:
  - preview transitorio de drag,
  - commit unico por gesto.
- `Deshacer/Rehacer` (botones y atajos) ahora consumen el mismo motor.
- `Importar JSON` reemplaza proyecto y limpia historial de forma consistente.

Decision tecnica:

Extraer el historial reduce acoplamiento, hace el comportamiento mas predecible
y facilita evolucion futura sin romper `App.tsx`.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El historial vuelve a registrarse correctamente y `Deshacer/Rehacer` funciona de
forma estable con botones y teclado.

## Movimiento 35 - Prueba unitaria de useProjectHistory

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `package.json`
- `vite.config.ts`
- `src/features/history/useProjectHistory.test.ts`

Intencion:

Blindar el hook de historial para evitar regresiones como las que afectaron
`Deshacer/Rehacer`.

Como se movio:

- Se agrego script `test` con `vitest run`.
- Se configuro entorno de test `jsdom` en `vite.config.ts`.
- Se agrego prueba unitaria para `useProjectHistory` con cobertura de:
  - registro de historial basico,
  - `undo` / `redo`,
  - flujo `transient + commit`,
  - limite de historial.

Decision tecnica:

Se priorizo test de hook en aislamiento, sin UI, para validar reglas de
historial como unidad de dominio de estado.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El motor de historial ahora tiene proteccion automatica contra regresiones en
los casos criticos que ya fallaron en iteraciones previas.

## Movimiento 36 - Consolidacion documental y verificacion de atajos

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Dejar un estado de referencia claro para continuar el desarrollo sin perder
contexto sobre lo que ya se cerro y como se valida.

Como se movio:

- Se agrego en `04` un bloque de estado consolidado por fases.
- Se agrego en `04` lista de capacidades activas.
- Se documento en `04` el estado de atajos:
  - `Ctrl/Cmd + Z`
  - `Ctrl/Cmd + Y`
- Se mantuvo este `05` como bitacora incremental de decisiones tecnicas.

Decision tecnica:

La documentacion de plan (`04`) queda como vista ejecutiva y `05` queda como
historial detallado de cambios/validaciones.

Validacion:

- Confirmacion de flujo funcional en iteraciones recientes.
- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

Queda trazabilidad completa y consistente entre plan y bitacora para retomar el
trabajo en cualquier momento.

## Movimiento 37 - Mapeo de tareas futuras por bloques

Fase: Plan transversal

Archivos movidos:

- `docs/04-plan-desarrollo.md`

Intencion:

Traducir nuevas tareas de producto a una secuencia aplicable con dependencias
claras y momento de ejecucion recomendado.

Como se movio:

- Se agrego `Mapa Futuro Aplicable (priorizado)` en `04`.
- Se incluyeron bloques con orden y criterio de aplicacion:
  - A: cierre de historial (`undo/redo`)
  - B: modo app + estetica/vistas
  - C: timeline de tracks
  - D: FASE 6 plugins
  - E: FASE 7 sintesis avanzada
  - F: exportacion audible de alta calidad
- Se documento recomendacion tecnica de exportacion:
  - WAV PCM con render offline por `OfflineAudioContext`

Decision tecnica:

Se priorizo cerrar primero estabilidad de edicion/historial y luego escalar UI,
timeline de pistas y exportacion. Esto reduce riesgo de retrabajo.

Validacion:

- revision documental cruzada entre `04` y `05`

Resultado:

El roadmap futuro queda mapeado con orden de aplicacion y objetivos concretos.

## Movimiento 38 - Test de integracion timeline+historial y tooltip de revertir

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.integration.test.tsx`
- `src/App.tsx`
- `docs/04-plan-desarrollo.md`

Intencion:

Cerrar Bloque A con una validacion automatica del flujo real de UI e incorporar
ayuda contextual en la accion de `Revertir nota`.

Como se movio:

- Se agrego prueba de integracion en `App` que valida:
  - mover nota en timeline,
  - cambio de historial,
  - `Deshacer/Rehacer` por botones,
  - `Ctrl+Z` y `Ctrl+Y`.
- Se agrego prueba para tooltip de `Revertir nota`.
- Se agrego atributo `title` al boton `Revertir nota`.
- En el plan (`04`) se marco Bloque A como completado.

Decision tecnica:

Se prueban interacciones end-to-end de UI con timeline real para cubrir el punto
de falla historico que no era detectable solo con test unitario del hook.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

Bloque A queda formalmente cerrado: historial estable y cubierto por tests
unitarios + integracion.

## Movimiento 39 - Estabilizacion de test de integracion en entorno jsdom

Fase: FASE 8 - Proyecto musical

Archivos movidos:

- `src/App.integration.test.tsx`

Intencion:

Evitar falsos fallos por dependencias de audio del navegador al ejecutar tests
de integracion en entorno `jsdom`.

Como se movio:

- Se elimino dependencia de `Tocar nota` para preparar escenario de test.
- Se siembra proyecto inicial en `localStorage` antes de cada test.
- Los casos de integracion ahora prueban timeline/historial sin invocar
  `AudioContext`.
- Se agrego `cleanup` explicito entre casos para evitar interferencias.

Decision tecnica:

En tests de integracion de UI se privilegia controlar estado inicial por datos,
no por reproduccion de audio, para mantener pruebas deterministas.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

La suite de integracion queda estable y repetible en CI/local.

## Movimiento 40 - Mapeo ampliado de menus y capacidades futuras

Fase: Plan transversal

Archivos movidos:

- `docs/04-plan-desarrollo.md`

Intencion:

Incorporar nuevas tareas de producto al roadmap con momento de aplicacion y
dependencias claras, ya con `Deshacer/Rehacer` considerado bloque cerrado.

Como se movio:

- Se expandio Bloque B (modo app/vistas) con menus:
  - Settings
  - Plugins
- Se agregaron tareas funcionales en Bloque B:
  - menu dedicado SMC Pad
  - selector de octavas
- Se agrego Bloque G para Sampler como menu separado:
  - grabar audio
  - banco/listado de samples
  - disparo de samples
- Se ajusto el orden recomendado para incluir Sampler antes de Plugins/Sintesis
  avanzada.

Decision tecnica:

Sampler se mantiene separado del core de instrumentos matematicos para respetar
restricciones arquitectonicas del proyecto.

Validacion:

- revision documental cruzada (`04` y `05`)

Resultado:

El roadmap ahora refleja de forma explicita menus, vistas y modulos faltantes
para la siguiente etapa de producto.

## Movimiento 41 - Mapeo de modo arpegiador en roadmap

Fase: Plan transversal

Archivos movidos:

- `docs/04-plan-desarrollo.md`

Intencion:

Agregar el modo arpegiador como capacidad futura explicita para notas/acordes,
con controles musicales y orden de aplicacion definido.

Como se movio:

- Se agrego Bloque H `Modo Arpegiador`.
- Se definieron patrones iniciales:
  - Up
  - Down
  - Up/Down
  - Random
  - Chord
- Se definieron controles minimos:
  - rate
  - gate
  - octave range
  - latch
- Se ubicó aplicacion despues de Bloque C (timeline de tracks).
- Se actualizo el orden general de aplicacion para incluir Bloque H.

Decision tecnica:

Se prioriza integrar arpegiador cuando exista timeline de tracks para registrar
resultado arpegiado como notas/eventos editables y no como efecto efimero.

Validacion:

- revision documental de coherencia entre fases y bloques.

Resultado:

El roadmap ya contempla arpegiador como modulo de producto con entrada y salida
musical clara.

## Movimiento 42 - Requisito de noise generator para SMC Pad

Fase: Plan transversal

Archivos movidos:

- `docs/04-plan-desarrollo.md`

Intencion:

Aterrizar el enfoque tecnico de baterias matematicas para `SMC Pad` sin usar
samples en el core.

Como se movio:

- Se agrego en Bloque B requisito de diseno de baterias matematicas:
  - kick por seno + pitch envelope
  - snare/hat/clap por ruido filtrado
- Se agrego requisito de `noise generator` en motor de audio (white noise
  inicial).

Decision tecnica:

El `noise generator` se define como bloque base para percusion matematica y se
mantiene alineado con la restriccion de no usar samples.

Validacion:

- revision documental de coherencia con restricciones de `03-contexto-y-metas`.

Resultado:

El roadmap de SMC Pad ya incluye requisito tecnico minimo para construir
percusion sintetica realista dentro del core.

## Movimiento 43 - Reordenamiento del roadmap para mantener laboratorio monovista

Fase: Plan transversal

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Consolidar la decision de mantener el laboratorio monovista como experiencia
visible durante el cierre de capacidades core pendientes, dejando el modo app
con vistas separadas para la etapa final.

Como se movio:

- Se redefinio Bloque B para priorizar orden interno del laboratorio monovista.
- Se documento que `App.tsx` debe dividirse internamente por responsabilidades
  antes de cambiar la navegacion visible.
- Se dejo explicito que ese orden interno de `App.tsx` debera retomarse y
  completarse antes de abrir el modo app final, aunque la idea aparezca
  repetida en el roadmap.
- Se reordeno el roadmap funcional de menor friccion a mayor complejidad:
  - sintesis avanzada
  - exportacion audible
  - arpegiador
  - timeline de tracks
  - plugins
- Se movio `modo app y vistas separadas` al final como bloque posterior al
  cierre de capacidades principales.
- Se mantuvo el sampler como modulo separado del core matematico.

Decision tecnica:

Se evita abrir la reorganizacion visible de la app antes de cerrar funciones
core que todavia necesitan validacion en el laboratorio. La prioridad pasa a
ser reducir acoplamiento interno sin cambiar aun la experiencia monovista.

Validacion:

- revision documental cruzada entre `04` y `05`
- alineacion con reglas de Screaming Architecture y con la restriccion de no
  mezclar prematuramente navegacion nueva con funcionalidades aun inestables

Resultado:

El roadmap queda alineado con la estrategia actual: primero ordenar internamente
el laboratorio, luego cerrar capacidades core pendientes, y solo al final pasar
a modo app con vistas separadas.

## Movimiento 44 - Extraccion de secciones del laboratorio desde App

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/App.tsx`
- `src/features/lab/LabActions.tsx`
- `src/features/lab/LabNoteEditor.tsx`
- `src/features/lab/LabProjectPanel.tsx`
- `src/features/lab/LabSoundControls.tsx`

Intencion:

Reducir el apelotonamiento de `App.tsx` sin cambiar todavia la experiencia
visible del laboratorio ni abrir el modo app con vistas separadas.

Como se movio:

- Se extrajeron secciones de render del laboratorio a componentes pequenos:
  - proyecto/pistas/instrumento
  - controles de sonido
  - acciones del laboratorio
  - editor de nota e historial
- `App.tsx` se mantuvo como ensamblador principal del flujo.
- Se conservaron las mismas clases CSS y los mismos handlers de negocio para no
  alterar comportamiento visible.
- No se movio aun la logica musical sensible a nuevos hooks de dominio; esta
  iteracion se enfoco en estructura de UI y claridad del archivo principal.

Decision tecnica:

Antes de seguir con sintesis avanzada y exportacion audible, se prioriza bajar
complejidad superficial de `App.tsx` para que el laboratorio soporte mejor las
proximas capacidades sin mezclar mas render y coordinacion en una sola vista.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

`App.tsx` queda mas corto y legible, mientras el laboratorio conserva el mismo
flujo funcional y queda mejor preparado para continuar Bloque B.

## Movimiento 45 - Selector de octavas para el piano de laboratorio

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/App.tsx`
- `src/engine/midi/notes.ts`
- `src/features/lab/LabSoundControls.tsx`

Intencion:

Agregar control directo sobre el rango visible y tocable del piano sin abrir
todavia nuevas vistas ni tocar la logica avanzada de sintesis.

Como se movio:

- Se agrego generacion dinamica de notas de preview por octava.
- Se agrego lista de opciones de octava visible para el laboratorio.
- El selector de nota y el piano visual ahora comparten el mismo rango visible.
- Al cambiar de octava, la nota seleccionada se reajusta solo si queda fuera del
  nuevo rango visible.

Decision tecnica:

Se eligio un selector de octava visible como paso pequeno y seguro dentro de
Bloque B porque mejora usabilidad del piano sin acoplar aun nuevas
responsabilidades al motor de audio.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El laboratorio ya permite desplazar el rango del piano por octavas visibles,
preparando mejor la base para futuras mejoras de interpretacion y SMC Pad.

## Movimiento 46 - Noise generator base en el motor de audio

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/engine/audio/audioEngine.ts`

Intencion:

Agregar una base reutilizable de ruido blanco dentro del core matematico para
preparar percusion sintetica futura sin introducir samples ni librerias
externas.

Como se movio:

- Se agrego buffer cacheado de ruido blanco en `audioEngine`.
- Se unifico el flujo de voces para soportar tanto osciladores como
  `AudioBufferSourceNode`.
- Se agregaron APIs:
  - `startNoise`
  - `playNoise`
- El ruido usa el mismo sistema de:
  - volumen maestro
  - ADSR
  - parada de voces
  - limpieza de recursos

Decision tecnica:

Se mantuvo el `noise generator` dentro del motor de audio como primitiva base,
sin UI todavia, para que luego pueda reutilizarse en `snare`, `hat`, `clap` y
futuras baterias matematicas del `SMC Pad`.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El core ya cuenta con una fuente de ruido blanco lista para usarse en
instrumentos y percusion matematica, manteniendo la restriccion de no usar
samples en el core.

## Movimiento 47 - Mini SMC Pad audible dentro del laboratorio

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/App.tsx`
- `src/application/use-cases/playSmcPadHit.ts`
- `src/features/smc-pad/MiniSmcPad.tsx`
- `src/features/smc-pad/MiniSmcPad.css`

Intencion:

Dar una prueba funcional audible del `noise generator` y de percusion
matematica basica sin esperar al menu final de `SMC Pad`.

Como se movio:

- Se creo un mini `SMC Pad` embebido dentro del laboratorio actual.
- Se agregaron cuatro golpes de prueba:
  - `Kick`
  - `Snare`
  - `Hat`
  - `Clap`
- Se combinaron seno, triangulo y ruido blanco con envelopes cortos para
  obtener percusion matematica inicial.
- El pad vive como superficie de prueba, no como menu final ni como modulo
  aislado completo todavia.

Decision tecnica:

Se priorizo una validacion audible pequena y directa para probar el motor de
audio expandido antes de invertir en la version final de `SMC Pad`.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El laboratorio ya incluye una superficie minima para probar percusion
matematica y validar en la practica la nueva base de ruido blanco del motor.

## Movimiento 48 - Registro del mini SMC Pad en timeline

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/App.tsx`
- `src/application/use-cases/playSmcPadHit.ts`
- `src/features/smc-pad/MiniSmcPad.tsx`

Intencion:

Hacer que la prueba audible del mini `SMC Pad` tambien participe del flujo de
grabacion del proyecto, para que sus golpes aparezcan en la timeline.

Como se movio:

- Se asigno a cada pad una nota MIDI representativa y una duracion corta.
- El mini `SMC Pad` mantiene el disparo de audio, pero ahora tambien notifica a
  `App` que hubo un golpe.
- `App` registra ese golpe en la pista activa usando el mismo flujo de
  grabacion rapida del laboratorio.

Decision tecnica:

Se eligio una representacion MIDI simple por pad para validar integracion con
timeline sin esperar aun un sistema de percusion/pistas dedicado ni una
calibracion final del mapeo sonoro.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Los pads `Kick`, `Snare`, `Hat` y `Clap` ya no solo suenan: tambien generan una
nota grabada en la pista activa y aparecen en la timeline del proyecto.

## Movimiento 49 - Reproduccion correcta de golpes SMC Pad desde timeline

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/App.tsx`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/engine/midi/events.ts`
- `src/engine/project/projectModel.ts`

Intencion:

Corregir el caso donde los golpes grabados del mini `SMC Pad` aparecian en
timeline pero, al reproducirse, sonaban como notas de piano en lugar de volver
como percusion matematica.

Como se movio:

- Se agrego metadata de reproduccion en `MidiRecordedNote`.
- Los golpes del mini `SMC Pad` ahora se guardan con:
  - `playbackSource: "smc-pad"`
  - `smcPadSoundId`
- `playRecordedNotes` detecta esa metadata y reenruta la reproduccion hacia
  `playSmcPadHit` en vez de `playNote`.
- Se mantuvo compatibilidad con notas musicales normales y con proyectos
  existentes, usando `playbackSource: "note"` como default.

Decision tecnica:

Se distinguio el origen/reproductor de cada nota grabada para no mezclar
material melodico con percusion sintetica, sin romper la representacion comun en
timeline durante esta etapa de laboratorio.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Los golpes del mini `SMC Pad` ya aparecen en timeline y, al reproducir la
grabacion, vuelven a sonar como `Kick`, `Snare`, `Hat` o `Clap` en vez de como
notas de piano.

## Movimiento 50 - Golpes SMC Pad sin resize en timeline

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/App.tsx`
- `src/engine/midi/events.ts`
- `src/features/lab/LabNoteEditor.tsx`
- `src/features/timeline/TimelinePreview.tsx`

Intencion:

Respetar la naturaleza percutiva de los golpes del mini `SMC Pad`, evitando que
puedan alargarse o acortarse como si fueran notas sostenidas.

Como se movio:

- Se agrego helper para detectar notas grabadas provenientes de `smc-pad`.
- Se oculto el handle de resize en timeline para esos golpes.
- Se deshabilito la edicion manual de duracion en el panel cuando la nota
  seleccionada viene del mini `SMC Pad`.
- `App` bloquea ademas cambios programaticos de duracion sobre esos eventos.

Decision tecnica:

Los golpes del mini `SMC Pad` se tratan como triggers movibles en el tiempo,
pero no escalables en duracion, manteniendo una semantica mas cercana a bateria
que a nota melodica sostenida.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Los golpes del mini `SMC Pad` ya se pueden mover dentro de la timeline, pero no
redimensionar ni editar su duracion manualmente.

## Movimiento 51 - Calibracion rapida y mejora visual del mini SMC Pad

Fase: Bloque B - Orden interno del laboratorio monovista

Archivos movidos:

- `src/application/use-cases/playSmcPadHit.ts`
- `src/features/smc-pad/MiniSmcPad.tsx`
- `src/features/smc-pad/MiniSmcPad.css`

Intencion:

Hacer que la prueba del mini `SMC Pad` se sienta menos provisional mediante una
calibracion corta de sonido y una jerarquia visual mas clara dentro del
laboratorio.

Como se movio:

- Se recalibraron `Kick`, `Snare`, `Hat` y `Clap` con envelopes y balances mas
  cortos/claros.
- Se ajustaron descripciones y duraciones representativas de cada golpe.
- Se mejoro la cabecera del pad con:
  - eyebrow contextual
  - badge tecnico
  - copy mas clara
- Se reforzo la presencia visual de los pads con mejor fondo, relieve y
  acentos por color.

Decision tecnica:

Se eligio una calibracion rapida de laboratorio en vez de un rediseño grande
para mantener el foco en validacion funcional y preparar una transicion mas sana
hacia sintesis avanzada.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El mini `SMC Pad` queda mas legible visualmente y con golpes mas distinguibles,
aunque la afinacion final de percusion siga abierta para iteraciones futuras.

Nota de continuidad:

El mini `SMC Pad` se considera suficiente como validacion funcional dentro del
laboratorio monovista, pero su refinamiento fuerte de sonido, identidad visual y
UX se difiere para cuando exista una vista dedicada de `SMC Pad`. No se fuerza
su cierre total dentro de la pantalla monovista actual.

## Movimiento 52 - Inicio de sintesis avanzada con LFO base

Fase: Bloque C - FASE 7 Sintesis avanzada

Archivos movidos:

- `src/engine/audio/audioEngine.ts`
- `src/engine/audio/mathematicalInstruments.ts`

Intencion:

Abrir de forma real la fase de sintesis avanzada con una modulacion reutilizable
que pueda crecer luego a vibrato, movimiento tonal y futuras automatizaciones.

Como se movio:

- Se agrego tipo `AudioLfo` al motor de audio.
- `PlayFrequencyOptions` ahora acepta `lfo` opcional.
- El motor crea un oscilador secundario de baja frecuencia y lo conecta a la
  frecuencia del oscilador principal cuando corresponde.
- Se integraron limpieza y parada del LFO al mismo ciclo de vida de las voces.
- Se agrego un instrumento nuevo:
  - `Vibrato Lead`

Decision tecnica:

Se eligio empezar por LFO sobre frecuencia porque es el camino mas corto y
audible para abrir sintesis avanzada sin introducir todavia mezcla por pista ni
automatizacion compleja.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya tiene una primera base de sintesis avanzada: un LFO opcional en el
motor de audio y un instrumento matematico que usa vibrato real.

## Movimiento 53 - LFO ampliado a tremolo por ganancia

Fase: Bloque C - FASE 7 Sintesis avanzada

Archivos movidos:

- `src/engine/audio/audioEngine.ts`
- `src/engine/audio/mathematicalInstruments.ts`

Intencion:

Ampliar el alcance inicial del LFO para que no quede limitado solo a vibrato y
abrir un segundo destino musical claramente audible: `gain`.

Como se movio:

- `AudioLfo` ahora puede declarar `target`.
- Se agrego ruta de LFO sobre `gain` para lograr `tremolo`.
- El motor mantiene el mismo ciclo de vida y limpieza del modulador.
- Se agrego un instrumento nuevo:
  - `Tremolo Pad`

Decision tecnica:

Se eligio `gain` como segundo destino porque ofrece una diferencia audible clara
respecto a `frequency`, valida mejor la reutilizacion del LFO y prepara el
terreno para modulaciones mas ricas sin abrir aun automatizacion completa.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

El LFO ya no solo sirve para vibrato: tambien puede producir `tremolo`, y
MiMIDI cuenta ahora con dos referencias audibles de sintesis avanzada.

## Movimiento 54 - Categoria de instrumentos y envolvente por pista

Fase: Bloque C - FASE 7 Sintesis avanzada

Archivos movidos:

- `src/App.css`
- `src/App.tsx`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/engine/audio/mathematicalInstruments.ts`
- `src/engine/midi/events.ts`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabProjectPanel.tsx`

Intencion:

Separar mejor los instrumentos matematicos basicos de los avanzados y abrir una
mejora estructural real de sintesis avanzada: envolvente editable por pista.

Como se movio:

- Se agrego categoria `Base / Avanzado` a los instrumentos matematicos.
- La UI del laboratorio ahora permite cambiar primero la categoria y luego el
  instrumento dentro de esa familia.
- Cada pista ahora guarda su propia envolvente:
  - `attack`
  - `decay`
  - `sustain`
  - `release`
- Las notas nuevas grabadas guardan snapshot de esa envolvente para reproducirse
  luego de forma consistente.
- `playRecordedNotes` usa la envolvente guardada por nota en lugar de depender
  del selector actual del laboratorio.

Decision tecnica:

Se eligio abrir primero una envolvente por pista antes que mezcla por pista
porque impacta directo en el caracter sonoro y era el siguiente paso mas claro
despues de LFO, manteniendo el alcance dentro del laboratorio actual.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya distingue mejor sus familias de instrumentos y cada pista puede
modificar su ADSR propio, con persistencia funcional sobre nuevas notas y
reproduccion grabada.

## Movimiento 55 - Mezcla base por pista y ayuda contextual en laboratorio

Fase: Bloque C - FASE 7 Sintesis avanzada

Archivos movidos:

- `src/App.tsx`
- `src/App.css`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/application/use-cases/playSmcPadHit.ts`
- `src/engine/audio/mathematicalInstruments.ts`
- `src/engine/midi/events.ts`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabProjectPanel.tsx`
- `docs/00-README-DOCS.md`

Intencion:

Completar una primera mezcla por pista util dentro del laboratorio y volver mas
autoexplicativa la UI de instrumentos y envolvente sin esperar al modo app
final.

Como se movio:

- Cada pista ahora guarda `volume` propio.
- El volumen de pista afecta:
  - toque en vivo
  - notas nuevas grabadas
  - reproduccion grabada
  - mini `SMC Pad`
- Las notas nuevas guardan snapshot de volumen igual que ya guardaban snapshot
  de envolvente.
- Se agrego descripcion para la categoria de instrumento activa:
  - `Base`
  - `Avanzado`
- Se agrego texto de ayuda para explicar como usar la envolvente por pista.
- Se actualizo el indice de docs para incluir `06` y el nuevo `07`.

Decision tecnica:

Se implemento primero una mezcla base por pista centrada en volumen porque da
valor real inmediato y prepara futuras expansiones de mezcla sin introducir aun
panorama, buses ni UI de mixer separada.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya cuenta con una primera mezcla util por pista y con una interfaz mas
clara para distinguir familias de instrumentos y entender la envolvente activa.

## Movimiento 56 - Cierre MVP de sintesis avanzada con mezcla refinada

Fase: Bloque C - FASE 7 Sintesis avanzada

Archivos movidos:

- `src/App.tsx`
- `src/App.css`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/application/use-cases/playSmcPadHit.ts`
- `src/engine/audio/audioEngine.ts`
- `src/engine/midi/events.ts`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabProjectPanel.tsx`
- `src/features/piano/PianoPreview.tsx`
- `src/features/smc-pad/MiniSmcPad.tsx`
- `docs/04-plan-desarrollo.md`

Intencion:

Cerrar el alcance MVP de Bloque C para que la sintesis avanzada no quede solo
en LFO y ADSR, sino tambien con una mezcla por pista util y una base minima de
automatizacion sonora.

Como se movio:

- Cada pista ahora guarda y expone:
  - `mute`
  - `solo`
  - `pan`
  - `volumeAutomation`
- Se agrego panorama real al motor de audio usando `StereoPannerNode`.
- La reproduccion grabada ahora resuelve mezcla por pista al sonar:
  - respeta `mute`
  - respeta `solo`
  - aplica `pan`
  - aplica automatizacion de volumen por tiempo
- El piano del laboratorio ya no depende de opciones fijas: resuelve `playOptions`
  al tocar para heredar mejor el estado actual de la pista.
- El mini `SMC Pad` dejo de disparar sonido por su cuenta y ahora delega en
  `App`, para compartir exactamente el mismo criterio de mezcla y grabacion.
- La UI del laboratorio sumo un bloque explicito de mezcla por pista y un bloque
  minimo de automatizacion con:
  - volumen inicial
  - tiempo final
  - volumen final
  - interruptor de activacion
- Las notas nuevas siguen guardando snapshot de volumen base, envolvente y pan,
  ademas de `playbackTrackId` para poder reencontrar su pista al reproducirse.

Decision tecnica:

La automatizacion minima se resolvio como una curva lineal de dos puntos para
no abrir aun una UI grande de lanes de automatizacion. Esto basta para validar
el modelo de mezcla por pista sin adelantar el timeline de tracks ni el modo
app final.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

Bloque C queda cerrado en su alcance MVP actual: MiMIDI ya tiene LFO, familias
de instrumentos, ADSR por pista, mezcla por pista y automatizacion basica de
volumen.

Nota de validacion diferida:

Aunque la implementacion tecnica quedo integrada y validada con `lint` y
`build`, la prueba manual completa de mezcla por pista todavia se considera
incomoda dentro del laboratorio monovista actual. Acciones como verificar con
claridad `mute`, `solo`, panorama y automatizacion entre varias pistas quedan
anotadas para retomarse mas adelante, idealmente cuando exista una
reorganizacion por vistas que haga el flujo mas legible y menos caotico.

Pruebas manuales diferidas:

- validar con calma `mute` por pista en escenario multipista
- validar con calma `solo` por pista en escenario multipista
- validar panorama izquierdo/derecho entre varias pistas
- validar automatizacion basica de volumen en reproduccion real
- repetir pruebas de mezcla tambien sobre el mini `SMC Pad`

## Movimiento 57 - Plan detallado para Bloque D de exportacion audible

Fase: Bloque D - Exportacion audible

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Dejar completamente aterrizado el siguiente gran movimiento del proyecto antes
de tocar codigo, para que la exportacion audible entre como un bloque coherente
en vez de una suma de cambios sueltos.

Como se movio:

- Se definio un checklist completo para Bloque D.
- Se dejo explicito que el render debe cubrir:
  - notas melodicas
  - mini `SMC Pad`
  - ADSR
  - mezcla por pista
  - panorama
  - automatizacion basica de volumen
- Se fijo como primer objetivo de formato:
  - `WAV PCM 32-bit float`
- Se ordeno la implementacion en una secuencia concreta:
  - renderer offline base
  - mezcla offline
  - automatizacion offline
  - encoder WAV
  - caso de uso de exportacion
  - UI minima
- Se documentaron validaciones esperadas para no perder el criterio de
  aceptacion del bloque.

Decision tecnica:

La exportacion audible no debe nacer acoplada a la reproduccion realtime del
laboratorio. Se planea como un renderer offline propio, reutilizando el dominio
musical y la mezcla por pista, pero sin depender del transporte visual actual.

Validacion:

- revision documental cruzada entre `04` y `05`
- coherencia con el roadmap posterior a Bloque C

Resultado:

Bloque D queda listo para ejecutarse como un solo movimiento grande con alcance,
orden interno y criterios de prueba ya establecidos.

## Movimiento 58 - Exportacion audible MVP con renderer offline y WAV

Fase: Bloque D - Exportacion audible

Archivos movidos:

- `src/App.tsx`
- `src/application/use-cases/exportProjectAudio.ts`
- `src/engine/audio/offlineAudioRenderer.ts`
- `src/engine/audio/wavEncoder.ts`
- `src/features/lab/LabActions.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Convertir el proyecto musical en un archivo audible real, reutilizando el
material ya grabado en timeline y la mezcla por pista construida en Bloque C.

Como se movio:

- Se creo un renderer offline basado en `OfflineAudioContext`.
- El renderer ahora exporta:
  - notas melodicas
  - golpes del mini `SMC Pad`
  - ADSR por nota
  - instrumento matematico correspondiente
  - mezcla por pista
  - `mute`
  - `solo`
  - `pan`
  - automatizacion basica de volumen
- Se agrego un encoder `WAV` en infraestructura.
- La primera salida oficial queda en:
  - `WAV PCM 32-bit float`
- Se creo un caso de uso dedicado para exportar audio del proyecto.
- El laboratorio actual suma un boton `Exportar WAV`.
- La exportacion descarga un archivo `.wav` usando el nombre del proyecto.

Decision tecnica:

La exportacion audible se resolvio fuera del transporte realtime del
laboratorio. El renderer offline reutiliza el dominio musical y la mezcla por
pista, pero no depende del scheduling visual actual ni de reproducir en tiempo
real para construir el audio final.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya puede convertir un proyecto grabado en un archivo `WAV` audible desde
el propio laboratorio monovista, cubriendo el alcance MVP real de Bloque D.

Limitaciones actuales:

- la UI todavia no expone selector de profundidad `24-bit` / `16-bit`
- la validacion manual profunda sobre proyectos multipista grandes sigue
  pendiente
- la experiencia de exportacion aun vive en la monovista actual y no en una
  vista dedicada de proyecto/exportacion

Nota de validacion diferida:

Aunque la exportacion `WAV` funciona a nivel tecnico y el flujo de descarga ya
esta integrado, varias pruebas manuales finas se difieren para una etapa
posterior porque hoy resulta incomodo recorrer el laboratorio monovista y
confirmar con claridad escenarios multipista complejos.

Pruebas manuales diferidas de exportacion audible:

- comprobar exportacion usando `mute` antes de render
- comprobar exportacion usando `solo` antes de render
- comprobar panorama izquierdo/derecho en el archivo final
- comprobar automatizacion basica de volumen en el audio exportado
- repetir la validacion anterior incluyendo golpes del mini `SMC Pad`

Guia exacta para retomar esas pruebas luego:

1. crear dos pistas con material audible distinto
2. en la pista 1 grabar varias notas melodicas cortas
3. en la pista 2 grabar otras notas o golpes del mini `SMC Pad`
4. exportar un `WAV` base sin tocar mezcla y guardarlo como referencia
5. activar `mute` en la pista 2
6. exportar un segundo `WAV`
7. abrir ambos archivos y confirmar que en el segundo la pista 2 desaparece
8. desactivar `mute` y activar `solo` en la pista 1
9. exportar un tercer `WAV`
10. abrirlo y confirmar que solo queda audible la pista 1
11. mover `pan` de una pista totalmente a la izquierda o derecha
12. exportar otro `WAV`
13. escuchar con audifonos o abrir en un DAW para confirmar panorama
14. activar automatizacion de volumen por pista
15. definir por ejemplo:
    - volumen inicial `0.20`
    - tiempo final `4.0`
    - volumen final `1.20`
16. exportar otro `WAV`
17. confirmar que el audio arranca mas bajo y sube de volumen hacia el final
18. repetir el mismo flujo incluyendo al menos un patron del mini `SMC Pad`
19. anotar cualquier diferencia entre reproduccion realtime y audio exportado

## Movimiento 59 - Plan detallado para Bloque E de arpegiador

Fase: Bloque E - Modo Arpegiador

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Dejar el siguiente bloque funcional completamente planeado antes de tocar
codigo, igual que se hizo con la exportacion audible, para que el arpegiador
entre como un movimiento grande y controlado.

Como se movio:

- Se documento el alcance completo del arpegiador MVP.
- Se fijo que debe cubrir:
  - nota unica
  - acorde
  - modos de patron
  - `rate`
  - `gate`
  - `octave range`
  - `latch`
- Se dejo explicito que el resultado debe poder:
  - sonar en realtime
  - grabarse como notas reales
  - reproducirse luego desde timeline
  - convivir con exportacion audible
- Se ordeno una secuencia concreta de implementacion:
  - modelo
  - generador de patron
  - scheduler realtime
  - integracion con pista activa
  - grabacion
  - UI minima
  - validacion final
- Se registraron criterios de prueba esperados del bloque.

Decision tecnica:

El arpegiador no se plantea como un efecto opaco de audio, sino como una capa
musical que genera notas reales. Eso mantiene coherencia con la separacion
MIDI/audio del proyecto y facilita timeline, edicion y exportacion posterior.

Validacion:

- revision documental cruzada entre `04` y `05`
- coherencia con la estrategia posterior a Bloque D

Resultado:

Bloque E queda listo para ejecutarse despues como un movimiento unico, con
alcance, orden y criterios de validacion ya definidos.

## Movimiento 60 - Arpegiador MVP integrado al laboratorio

Fase: Bloque E - Modo Arpegiador

Archivos movidos:

- `src/App.tsx`
- `src/application/use-cases/arpeggiatorPlayback.ts`
- `src/engine/midi/arpeggiator.ts`
- `src/features/lab/LabSoundControls.tsx`
- `src/features/piano/PianoPreview.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Llevar el arpegiador desde el plan a una capacidad real del laboratorio,
haciendo que genere notas musicales verdaderas y no solo un efecto temporal de
audio.

Como se movio:

- Se creo el dominio de arpegiador con:
  - modos `Up`
  - `Down`
  - `Up/Down`
  - `Random`
  - `Chord`
- Se agregaron settings base:
  - `enabled`
  - `rate`
  - `gate`
  - `octaveRange`
  - `latch`
- Se creo un scheduler realtime dedicado para emitir pasos del arpegio.
- El arpegiador ahora puede partir de:
  - una nota unica
  - un acorde
- Cada paso del arpegio se toca y se guarda como nota real en la pista activa.
- El piano de laboratorio ahora distingue entre:
  - reproduccion directa normal
  - disparo de patron arpegiado
- El laboratorio suma una UI minima de arpegiador dentro de controles de
  sonido.
- Los botones de prueba `Tocar nota` y `Tocar acorde` respetan el arpegiador
  cuando esta activo.

Decision tecnica:

El arpegiador se implemento como generador de notas reales porque eso mantiene
la separacion MIDI/audio del proyecto y hace que timeline, exportacion `WAV` y
edicion posterior reutilicen el mismo material musical sin rutas especiales.

Validacion:

- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya puede arpegiar notas o acordes dentro del laboratorio, grabar el
resultado en timeline y reutilizar esas notas en reproduccion y exportacion.

Guia rapida de prueba:

1. activar `Arpegiador`
2. elegir modo `Up`, `Down`, `Up/Down`, `Random` o `Chord`
3. elegir `rate`, `gate`, `octave range` y opcionalmente `latch`
4. tocar una nota desde el piano o usar `Tocar nota`
5. verificar que suene un patron en vez de una nota plana
6. cambiar a modo `Acorde`
7. tocar una tecla del piano o usar `Tocar acorde`
8. verificar que el patron se construya desde el acorde
9. revisar `Notas grabadas` y `Timeline`
10. confirmar que el arpegio se haya grabado como varias notas reales
11. pulsar `Reproducir grabacion`
12. confirmar que el resultado grabado suene igual que el patron generado

Limitaciones actuales:

- la validacion manual profunda sigue siendo mas incomoda de lo ideal por la
  monovista
- el arpegiador MVP se asume como una fuente principal a la vez dentro del
  laboratorio actual
- no existe aun una vista dedicada ni timeline de tracks para exploracion mas
  rica del patron

## Proximo paso recomendado

Avanzar a Bloque F - Timeline de tracks.

Siguiente incremento recomendado:

- sumar lanes por pista
- seleccionar pista desde timeline de tracks
- sincronizar timeline de tracks con timeline de notas

Objetivo:

Mantener por ahora laboratorio monovista:

```ts
singleScreenLab()
```

y evolucionar primero hacia:

```ts
singleScreenLab({ internalSections: true, stableCoreFeatures: true })
```

Luego, cuando las capacidades principales ya esten estables, pasar a:

```ts
appMode({ recordView, editView, projectView })
```

Eso reduce riesgo de retrabajo, evita romper flujo actual demasiado pronto y
deja el modo app como reorganizacion final sobre un core mas completo.

## Movimiento 61 - Timeline de tracks MVP y latch paralelo en arpegiador

Fase: Bloque F - Timeline de tracks

Archivos movidos:

- `src/App.tsx`
- `src/App.css`
- `src/App.integration.test.tsx`
- `src/application/use-cases/arpeggiatorPlayback.ts`
- `src/features/timeline/TrackTimelinePreview.tsx`
- `src/features/timeline/TrackTimelinePreview.css`
- `src/features/timeline/TimelinePreview.tsx`
- `src/features/timeline/timelineLayout.ts`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Abrir por fin una lectura multipista real dentro del laboratorio monovista y,
al mismo tiempo, corregir una friccion de uso detectada en el arpegiador con
`latch`: que una tecla latcheada no impida disparar otras en paralelo.

Como se movio:

- Se creo `TrackTimelinePreview` como overview multipista por encima de la
  timeline detallada actual.
- Cada pista ahora aparece como una lane propia con:
  - nombre
  - cantidad de notas
  - indicadores rapidos de `Mute` y `Solo`
  - bloques temporales de sus notas
- La longitud temporal del overview multipista y de la timeline detallada ahora
  reutiliza una misma utilidad de layout.
- La pista activa puede cambiarse haciendo click desde la timeline de tracks.
- Esa seleccion queda sincronizada con:
  - resumen de proyecto
  - lista de notas grabadas
  - editor de nota
  - timeline detallada de la pista activa
- El arpegiador dejo de depender de un solo handle global.
- Cuando `latch` esta activo, ahora cada combinacion de notas mantiene su propio
  handle por clave disparadora.
- Eso permite detener el mismo patron al repetir la misma tecla/combinacion, sin
  bloquear el disparo paralelo de otras teclas.
- Al desactivar `latch` o cambiar de pista se limpian los handles activos para
  evitar patrones huerfanos.
- Se agrego prueba de integracion para validar cambio de pista desde la nueva
  timeline general.

Decision tecnica:

Se eligio resolver Bloque F como una capa de overview multipista sin reemplazar
la `TimelinePreview` de detalle. Asi la app gana navegacion por pistas sin
forzar todavia una edicion multipista compleja ni adelantar el futuro modo app.

El ajuste del arpegiador se resolvio con un registro de handles por trigger en
lugar de un singleton global, porque el problema real no era de sonido sino de
coordinacion de sesiones activas cuando `latch` quedaba prendido.

Validacion:

- `npm run lint`
- `npm run build`
- `npm run test`

Resultado:

Bloque F queda completado en alcance MVP actual: MiMIDI ya muestra una timeline
general por pistas, permite cambiar de pista desde esa vista y mantiene
sincronizado el detalle de la pista activa.

El problema de arpegiador reportado tambien queda resuelto en esta iteracion:
con `latch` activo ya se pueden disparar otras teclas o combinaciones en
paralelo sin que la primera deje bloqueado el flujo.

Siguiente paso recomendado:

Avanzar a Bloque G - FASE 6 Plugins.

Antes de abrirlo con mas superficie, conviene hacer una pasada manual corta de
uso multipista en el laboratorio:

- crear varias pistas
- alternar seleccion desde la timeline de tracks
- confirmar que la pista activa cambia en lista, editor y timeline detallada
- repetir la prueba con arpegiador y `latch`

## Movimiento 62 - Timeline de tracks convertido en arreglo temporal real

Fase: Bloque F - Timeline de tracks

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/engine/audio/offlineAudioRenderer.ts`
- `src/engine/project/projectModel.ts`
- `src/features/timeline/TrackTimelinePreview.tsx`
- `src/features/timeline/TrackTimelinePreview.css`
- `src/features/transport/usePlaybackTransport.ts`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Corregir el enfoque del bloque: la timeline por pistas no debia quedarse en
overview visual, sino convertirse en una primera herramienta real de arreglo
para decidir si las pistas entran al mismo tiempo o en momentos distintos.

Como se movio:

- Cada pista ahora tiene un `timelineClip` propio con `startTime`.
- Se mantiene el alcance MVP de un clip por pista para no abrir todavia una
  capa mas compleja de multiples clips.
- El `TrackTimelinePreview` ya no solo resume notas:
  - muestra un clip temporal por pista
  - permite arrastrarlo horizontalmente
  - refleja visualmente el inicio del track en segundos
- El contenido interno de cada clip sigue viniendo de las notas de la pista,
  mostradas como marcadores internos dentro del bloque.
- La reproduccion realtime ya no agenda notas solo por `note.startTime`.
- Ahora calcula notas programadas usando:
  - tiempo relativo interno de la nota
  - offset absoluto del clip de pista
- La exportacion offline `WAV` tambien respeta ese offset, asi que el arreglo
  temporal del laboratorio y el archivo exportado quedan alineados.
- Se mantuvo la timeline detallada inferior como editor de contenido interno de
  la pista activa.
- Se agrego prueba de integracion para validar arrastre del clip y compatibilidad
  con `undo`.
- La carga de proyectos antiguos se mantiene compatible: si un proyecto viejo no
  trae `timelineClip`, se normaliza con inicio `0`.

Decision tecnica:

En vez de inventar de golpe un sistema completo de multiples clips por pista, se
eligio una capa intermedia: un clip de arreglo por pista. Eso ya resuelve la
necesidad principal de producto que aparecio en esta iteracion:

- decidir cuando entra cada track
- dejar tracks en paralelo o desplazados
- escuchar/exportar ese arreglo real

Sin embargo, no obliga todavia a redisenar toda la edicion interna ni el modelo
de proyecto alrededor de clips multiples.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

Bloque F queda corregido y consolidado en un MVP mas fiel al objetivo del
producto: el timeline de tracks ya sirve para editar el momento de entrada de
cada pista dentro del arreglo global, no solo para verla o seleccionarla.

Siguiente paso recomendado:

Avanzar a Bloque G - FASE 6 Plugins.

Pendiente natural posterior dentro del mismo eje:

- permitir multiples clips por pista
- duplicar clips
- recortar inicio/fin de clips
- decidir si la automatizacion de pista debe seguir siendo local al contenido o
  evolucionar luego a lanes mas explicitas

## Movimiento 63 - Reversion del latch paralelo en arpegiador

Fase: Bloque E - Modo Arpegiador

Archivos movidos:

- `src/App.tsx`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Quitar el cambio que permitia multiples patrones latcheados en paralelo y
volver al comportamiento anterior de un solo patron activo a la vez.

Como se movio:

- Se elimino el registro de multiples handles por `triggerKey`.
- El arpegiador vuelve a usar:
  - un solo `handle` activo
  - una sola clave activa de disparo
- Con `latch`, repetir la misma tecla o combinacion sigue permitiendo detener el
  patron actual, pero ya no se sostienen patrones paralelos simultaneos.

Decision tecnica:

Se respeto la correccion de producto pedida en chat: el soporte de patrones
latcheados paralelos se considero un cambio no deseado y se retiro sin tocar el
resto del flujo del arpegiador.

Validacion:

- `npm run lint`
- `npm run test`
- `npm run build`

Resultado:

El arpegiador vuelve a un modelo mas simple y restrictivo: una sola sesion
latcheada activa por vez.

## Movimiento 64 - Grabacion explicita por toma con punto cero propio

Fase: FASE 5 - Timeline / grabacion por pistas

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/features/lab/LabActions.tsx`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Corregir el problema de huecos artificiales al inicio de nuevas pistas dejando
explicito cuando el laboratorio esta grabando y haciendo que cada toma arranque
desde su propio tiempo cero.

Como se movio:

- Se agrego estado explicito de grabacion dentro del laboratorio.
- La UI ahora separa:
  - tocar
  - iniciar grabacion
  - detener grabacion
- `Tocar nota`, `Tocar acorde`, piano, arpegiador y mini `SMC Pad` siguen
  sonando fuera de grabacion, pero ya no escriben notas al proyecto por
  accidente.
- Las notas nuevas solo se agregan al proyecto cuando el estado es
  `recording`.
- Cada toma usa su propio `recordingStartedAtRef`, por lo que una grabacion nueva
  vuelve a medir tiempos desde `0` y no hereda silencios previos de la sesion.
- Al detener la grabacion se cierran tambien capturas activas de notas
  sostenidas para no dejar eventos abiertos si el usuario detiene en medio de
  una pulsacion.
- Se agregaron pruebas de integracion para validar:
  - que tocar fuera de grabacion no ensucie timeline
  - que una segunda toma en otra pista vuelva a empezar desde `0`

Decision tecnica:

Se eligio un MVP de grabacion explicita con dos estados (`idle` y
`recording`) en vez de introducir todavia una maquina de estados mas grande con
`armed`, cuenta regresiva o punch in/out. Eso resuelve la ambiguedad principal
de producto sin romper el flujo actual del laboratorio.

Validacion:

- `npm run lint`
- `npm run test`
- `npm run build`

Resultado:

MiMIDI deja de grabar por implicito. Las nuevas tomas quedan ancladas a su
propio inicio real y se elimina el vacio artificial que aparecia cuando se
grababa una pista despues de otra dentro de la misma sesion.

## Movimiento 65 - Duracion manual del timeline de tracks

Fase: Bloque F - Timeline de tracks

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabProjectPanel.tsx`
- `src/features/timeline/TrackTimelinePreview.tsx`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Permitir que el usuario defina cuanto dura visualmente el timeline de tracks en
vez de depender solo del alcance actual del contenido grabado.

Como se movio:

- El proyecto ahora guarda `trackTimelineDuration`.
- La timeline de tracks usa como rango visible:
  - la duracion manual elegida
  - o el contenido real, si este se extiende mas
- Se agrego control en el panel del laboratorio para editar:
  - `Duracion timeline (s)`
- Se agrego accion `Ajustar al contenido` para recalcular rapido la duracion
  visible segun el material actual del proyecto.
- Los proyectos antiguos siguen siendo compatibles:
  - si no traen la nueva propiedad, se usa un valor base razonable
- Se agregaron pruebas para validar:
  - duracion manual visible
  - ajuste automatico al contenido

Decision tecnica:

Se eligio un modelo `max(duracionManual, contenidoReal)` porque da libertad para
preparar espacio vacio futuro sin correr el riesgo de que el timeline colapse si
los clips superan el rango elegido.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El timeline de tracks ya no depende solo del contenido grabado para definir su
largo visible. Ahora puede prepararse una estructura temporal mas amplia y luego
llenarla con clips segun lo necesite el proyecto.

## Movimiento 66 - Base modular de plugins y catalogo extensible

Fase: Bloque G - FASE 6 Plugins

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/engine/audio/instrumentCatalog.ts`
- `src/engine/audio/mathematicalInstruments.ts`
- `src/engine/plugins/internalPlugins.ts`
- `src/engine/plugins/pluginModel.ts`
- `src/engine/plugins/pluginRegistry.ts`
- `src/engine/plugins/pluginRegistry.test.ts`
- `src/features/lab/useLabInstrumentCatalog.ts`
- `docs/00-README-DOCS.md`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/08-guia-crear-plugins.md`

Intencion:

Preparar una base modular real para plugins sin romper el laboratorio actual y,
al mismo tiempo, seguir reduciendo la responsabilidad directa de `App.tsx`
sacando la resolucion del catalogo de instrumentos fuera del componente
principal.

Como se movio:

- Se definio un contrato minimo de plugin en `pluginModel.ts`.
- Se creo un registro interno controlado de plugins.
- Se agrego un primer plugin matematico de ejemplo:
  - `Motion Synth Pack`
- Ese plugin aporta instrumentos nuevos sin usar samples.
- Se creo `instrumentCatalog.ts` para combinar:
  - instrumentos del core
  - instrumentos de plugins habilitados
- `App.tsx` dejo de resolver directamente el catalogo de instrumentos base.
- El laboratorio ahora consume un hook de catalogo (`useLabInstrumentCatalog`)
  para obtener:
  - instrumento seleccionado
  - categorias
  - instrumentos visibles
- Se agregaron pruebas para:
  - registro de plugins
  - instrumentos aportados por plugin
  - presencia visible del plugin en el selector del laboratorio
- Se agrego una nueva guia numerada en docs para explicar como crear plugins en
  el MVP actual.

Decision tecnica:

Se eligio empezar por plugins internos de instrumentos porque validan el
contrato de extensibilidad con el menor riesgo y sin forzar todavia carga
dinamica, sandbox ni instalacion externa. Tambien se aprovecho el movimiento
para sacar una parte clara de coordinacion de `App.tsx` hacia un catalogo y un
hook dedicados, en lugar de seguir acoplando el componente principal al listado
de instrumentos.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

Bloque G queda iniciado con una base modular funcional: MiMIDI ya puede
combinar instrumentos del core con instrumentos registrados por plugins internos,
y `App.tsx` queda menos cargado en una de sus zonas de coordinacion mas
sensibles.

## Movimiento 67 - Extraccion de la sesion de grabacion del laboratorio

Fase: Bloque G - soporte estructural para modularidad

Archivos movidos:

- `src/App.tsx`
- `src/features/lab/useLabRecordingSession.ts`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Seguir separando `App.tsx` en secciones logicas del laboratorio sin cambiar el
comportamiento visible, dejando la coordinacion de grabacion en un hook propio
para preparar mejor el crecimiento modular del core y futuras extensiones.

Como se movio:

- Se creo `useLabRecordingSession` como frontera dedicada para:
  - inicio y detencion de grabacion
  - tiempo de toma actual
  - registro de eventos `note-on` / `note-off`
  - cierre de notas activas al detener grabacion
  - reinicio limpio de la sesion de captura
- `App.tsx` dejo de cargar directamente con:
  - refs de grabacion
  - calculo de tiempo de toma
  - persistencia temporal de notas activas
- El componente principal ahora consume una interfaz mas clara del hook:
  - `startRecording`
  - `stopRecording`
  - `recordNotesToActiveTrack`
  - `recordNotesAtTime`
  - `registerMidiEvent`
  - `resetRecordingSession`

Decision tecnica:

Se eligio extraer primero la sesion de grabacion porque era una de las
coordinaciones mas acopladas dentro de `App.tsx` y, al mismo tiempo, una pieza
central para no romper el flujo actual del laboratorio. Convertirla en hook
permite seguir dividiendo el componente principal por responsabilidades reales,
no solo por conveniencia visual.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

`App.tsx` pierde una parte importante de su coordinacion interna sin cambiar la
semantica actual de grabacion. La base para seguir separando el laboratorio ya
queda mas clara y menos riesgosa para las siguientes iteraciones de `Bloque G`.

## Movimiento 68 - Duracion configurable del timeline de notas por pista

Fase: Bloque F - refinamiento del editor de notas

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabNoteEditor.tsx`
- `src/features/timeline/TimelinePreview.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Completar la coherencia entre el timeline global de tracks y el timeline de
notas de la pista activa, permitiendo definir un rango visible y editable propio
para cada pista en vez de depender solo del ultimo evento grabado.

Como se movio:

- Cada pista ahora guarda `noteTimelineDuration`.
- Se agrego un resolvedor `max(duracionManual, contenidoReal)` para el editor de
  notas.
- `TimelinePreview` deja de depender exclusivamente del contenido para decidir
  su largo visible.
- `LabNoteEditor` incorpora:
  - `Duracion timeline notas (s)`
  - `Ajustar notas al contenido`
- Los proyectos anteriores siguen funcionando:
  - si una pista no trae `noteTimelineDuration`, se normaliza con un valor base
    razonable.
- Se agregaron pruebas de integracion para validar:
  - duracion manual del timeline de notas
  - reajuste al contenido actual

Decision tecnica:

Se eligio guardar la duracion del timeline de notas por pista, no a nivel global
del proyecto, porque esta vista representa el espacio de trabajo del contenido
interno de cada track. Asi el arreglo general y la edicion detallada pueden
crecer por separado sin mezclar sus responsabilidades.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El timeline de notas ya puede reservar espacio vacio futuro y conservarlo por
pista. La edicion detallada deja de colapsar al ultimo evento y gana una
semantica temporal consistente con el timeline superior de tracks.

## Movimiento 69 - Expansion de la guia base para crear plugins

Fase: Bloque G - documentacion estructural

Archivos movidos:

- `docs/05-contexto-vivo-desarrollo.md`
- `docs/08-guia-crear-plugins.md`

Intencion:

Convertir la guia numerada de plugins en una base mas completa y util para los
proximos pasos del bloque, dejando no solo el flujo actual del MVP sino tambien
los limites, riesgos y puntos donde seguramente habra que parchear la guia
cuando el sistema crezca.

Como se movio:

- Se reescribio `docs/08` con una estructura mas amplia.
- La guia ahora explica:
  - objetivo real del MVP
  - contrato actual de plugin
  - flujo de registro y resolucion del catalogo
  - significado de cada campo
  - procedimiento recomendado para crear plugins
  - riesgos actuales del sistema
  - checklist de validacion
  - puntos futuros de parche y evolucion

Decision tecnica:

Se eligio dejar la guia mas descriptiva ahora, aunque todavia el sistema sea
pequeno, porque el costo de documentar tarde seria mucho mayor cuando empiecen a
aparecer plugins mas ambiciosos, superficies nuevas o activacion visible.

Validacion:

- revision manual de coherencia contra:
  - `pluginModel.ts`
  - `pluginRegistry.ts`
  - `internalPlugins.ts`
  - `instrumentCatalog.ts`

Resultado:

La documentacion de plugins deja de ser una nota corta de MVP y pasa a ser una
base operativa mas completa para crear, revisar y evolucionar plugins en
MiMIDI.

## Movimiento 70 - Plan para compactar el inicio del timeline de notas

Fase: Bloque F - refinamiento del editor de notas

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Registrar una mejora puntual del editor de notas que quite el espacio en blanco
inicial antes de la primera nota, sin tocar todavia el timeline de tracks ni
convertir esto en una operacion global del proyecto.

Como se moveria:

- agregar una accion explicita tipo:
  - `Compactar inicio`
- calcular el `startTime` minimo de las notas visibles de la pista activa
- restar ese offset minimo a todas las notas de esa pista
- conservar intactas:
  - distancias relativas entre notas
  - duraciones actuales
  - seleccion de pista
- si no hay notas o la primera ya empieza en `0`, no hacer cambios
- registrar el cambio dentro del historial normal para permitir:
  - `Deshacer`
  - `Rehacer`

Decision tecnica:

Esto se plantea solo para el timeline de notas porque ahi el espacio vacio
inicial afecta mas la edicion fina. No se aplicara por ahora al timeline de
tracks para evitar mezclar una mejora local de detalle con decisiones globales
del arreglo multipista.

Plan recomendado:

1. crear helper de dominio para compactar notas de una pista
2. exponer una accion desde `App.tsx` o el hook que corresponda
3. agregar boton en `LabNoteEditor`
4. cubrir con prueba de integracion:
   - caso con espacio en blanco inicial
   - caso sin notas
   - caso donde la primera nota ya esta en `0`

Resultado:

La idea queda consolidada y lista para implementarse despues sin perder el
alcance: compactar inicio solo en timeline de notas.

## Movimiento 71 - Compactar inicio del timeline de notas

Fase: Bloque F - refinamiento del editor de notas

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabNoteEditor.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Eliminar rapidamente el espacio en blanco previo a la primera nota de la pista
activa cuando el usuario quiera empezar la edicion detallada desde `0s`, sin
afectar todavia el timeline de tracks ni el arreglo global.

Como se movio:

- Se agrego helper de dominio para compactar el inicio de las notas de una
  pista.
- El sistema calcula la nota mas temprana de la pista activa y resta ese offset
  a todas las notas de la misma pista.
- Se conserva:
  - distancia relativa entre notas
  - duracion de cada nota
  - integracion con historial
- `LabNoteEditor` suma el boton:
  - `Compactar inicio`
- Se cubrio con prueba de integracion el caso donde una pista arranca despues
  de `0s`.

Decision tecnica:

La compactacion se limito al timeline de notas porque es una operacion local de
edicion fina. No se aplico al timeline de tracks para no mezclar un ajuste del
detalle interno con decisiones estructurales del arreglo multipista.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

La pista activa ya puede mover todo su contenido al segundo `0` con una sola
accion, eliminando silencio inicial sin romper relaciones internas entre notas.

Guia rapida de prueba:

1. ir a una pista cuyas notas no empiecen en `0s`
2. abrir el editor de notas
3. pulsar `Compactar inicio`
4. revisar la timeline de notas
5. confirmar que la primera nota ahora empieza en `0s`
6. confirmar que las demas conservaron su separacion relativa
7. usar `Deshacer` y `Rehacer` para validar historial

## Estado ampliado del bloque actual

Bloque actual: Bloque G - Plugins

Pendiente real consolidado:

- activacion/desactivacion visible de plugins
- persistencia del estado activo/inactivo
- abrir una segunda superficie extensible ademas del catalogo de instrumentos
- seguir sacando coordinacion de `App.tsx` a fronteras mas compatibles con
  extensibilidad

Siguiente foco recomendado dentro de Bloque G:

1. activacion/desactivacion visible
2. persistencia del estado de plugins
3. elegir una segunda superficie extensible MVP

## Movimiento 72 - Manager visible de plugins y persistencia por proyecto

Fase: Bloque G - Plugins

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/application/use-cases/playRecordedNotes.ts`
- `src/engine/audio/instrumentCatalog.ts`
- `src/engine/audio/offlineAudioRenderer.ts`
- `src/engine/plugins/pluginModel.ts`
- `src/engine/plugins/pluginRegistry.test.ts`
- `src/engine/plugins/pluginRegistry.ts`
- `src/engine/project/projectModel.ts`
- `src/features/lab/LabProjectPanel.tsx`
- `src/features/lab/useLabInstrumentCatalog.ts`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/08-guia-crear-plugins.md`

Intencion:

Cerrar el siguiente tramo real del sistema de plugins para que deje de ser solo
catalogo extensible interno y pase a tener:

- activacion/desactivacion visible
- persistencia por proyecto
- reproduccion y exportacion alineadas con el catalogo activo
- guia operativa mucho mas util para crear plugins nuevos

Como se movio:

- Se agrego `MiMIDIPluginStateMap` como estado persistible del proyecto.
- El proyecto ahora guarda `pluginStates` y los recupera al importar o cargar
  desde storage.
- `pluginRegistry.ts` suma helpers para:
  - estados por defecto
  - resolucion de estados persistidos
  - resumenes visibles para UI
  - catalogo de plugins habilitados segun proyecto
- `instrumentCatalog.ts` y `useLabInstrumentCatalog.ts` ahora resuelven el
  catalogo en funcion del estado activo de plugins.
- `LabProjectPanel` suma un manager visible de plugins internos con toggle por
  plugin.
- Si se apaga un plugin, las pistas que usaban sus instrumentos vuelven a un
  fallback disponible del core para no quedar rotas.
- La reproduccion grabada y el render offline dejaron de resolver instrumentos
  solo desde el core y ahora consultan el catalogo activo.
- Se actualizaron pruebas para cubrir:
  - override de estado activo/inactivo
  - desaparicion visible de instrumentos del plugin al desactivarlo
  - persistencia del estado en localStorage
- `docs/08-guia-crear-plugins.md` se reescribio con:
  - prompt recomendado al inicio para pedir plugins nuevos a Codex
  - estado real del sistema actualizado
  - flujo de trabajo actual para crear, registrar, activar y validar plugins
  - advertencia explicita de que la guia es viva y seguramente cambiara

Decision tecnica:

Se eligio persistir el estado activo/inactivo dentro del proyecto, no como
storage global separado, porque asi:

- viaja con import/export JSON
- evita estados fantasma entre proyectos
- permite que el catalogo activo forme parte del estado de producto real

Resultado:

Bloque G deja de estar atascado en "plugins registrados pero sin control
visible". Ahora existe una primera gestion usable de plugins internos y una
guia mucho mas fuerte para seguir creando extensiones sin improvisar.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Que sigue realmente dentro de Bloque G:

1. abrir una segunda superficie extensible MVP ademas del catalogo de
   instrumentos
2. seguir sacando coordinacion de `App.tsx` hacia fronteras mas compatibles con
   plugins
3. decidir si la siguiente superficie sera:
   - acciones del laboratorio
   - herramientas del timeline
   - paneles dedicados

## Movimiento 73 - Etiquetado visible de origen en el selector de instrumentos

Fase: Bloque G - Plugins

Archivos movidos:

- `src/App.tsx`
- `src/App.integration.test.tsx`
- `src/engine/plugins/pluginRegistry.ts`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/08-guia-crear-plugins.md`

Intencion:

Hacer mas legible el catalogo combinado del laboratorio para que el usuario
entienda inmediatamente si un instrumento viene del `Core` o de un plugin
activo, sin tener que inferirlo mirando el manager de plugins aparte.

Como se movio:

- Se agrego un helper en el registro de plugins para resolver de que plugin
  viene un instrumento activo.
- El selector de instrumentos ahora etiqueta cada opcion como:
  - `Core`
  - o nombre del plugin de origen
- Se actualizaron pruebas de integracion para verificar la nueva etiqueta
  visible sobre instrumentos de plugin.
- `docs/08` se ajusto para reflejar que el selector ya muestra el origen del
  instrumento como parte del flujo actual.

Decision tecnica:

Se eligio resolver el origen desde el registro de plugins activo, no con una
lista hardcodeada en `App.tsx`, para mantener la UI desacoplada de plugins
concretos y reutilizar la misma fuente de verdad del sistema.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El catalogo combinado sigue funcionando igual, pero ahora comunica mucho mejor
su procedencia: los instrumentos del core y los de plugins activos ya no se
mezclan visualmente como si todos nacieran del mismo sitio.

## Movimiento 74 - Reenfoque del siguiente paso hacia arquitectura del modo app

Fase: Bloque G - Plugins / preparacion del Bloque I

Archivos movidos:

- `docs/00-README-DOCS.md`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Dejar claro que, despues del MVP actual de plugins, el siguiente foco no debe
ser crecer mas superficies pluginizables dentro de la monovista, sino seguir
sacando coordinacion de `App.tsx` y preparar la arquitectura del futuro modo
app con multiples pantallas.

Como se movio:

- Se documento un nuevo archivo `09` dedicado al modo app futuro.
- El nuevo documento deja:
  - shell horizontal propuesto
  - inspiracion visual de escritorio clasico tipo `Mac OS` original
  - pantallas recomendadas
  - estructura de carpetas sugerida
  - orden de migracion desde la monovista
  - regla para agregar archivos nuevos sin romper Screaming Architecture
- En `04` se reordeno el pendiente real de Bloque G para reflejar que:
  - lo inmediato es seguir extrayendo `App.tsx`
  - el crecimiento fuerte de plugins visuales o de nuevas superficies se
    difiere hasta tener UI mas ordenada
- Se actualizo el indice documental para incluir `09`.

Decision tecnica:

Se considera que los plugins futuros probablemente no solo agregaran
instrumentos, sino tambien cambios visuales, paneles o herramientas. Abrir esa
complejidad antes del modo app aumentaria el caos del laboratorio actual. Por
eso el siguiente paso correcto es preparar primero shell, pantallas y
fronteras mas limpias.

Resultado:

Queda consolidado que el proximo trabajo estructural debe centrarse en:

1. seguir extrayendo coordinacion de `App.tsx`
2. preparar `AppShell` y navegacion horizontal
3. mapear la migracion hacia multiples pantallas
4. recien despues reabrir la expansion fuerte de plugins

Plan completo recomendado:

1. seguir extrayendo coordinacion restante de `App.tsx`
2. crear `src/app/AppShell.tsx`
3. definir modelo de navegacion interna por vistas
4. abrir `Edit` como primera pantalla real
5. mover `Project` a pantalla propia
6. mover `Perform` a pantalla propia
7. crear `PluginsScreen`
8. recien ahi reabrir segunda superficie extensible de plugins

## Movimiento 75 - Laboratorio movido a /lab y reserva de / para modo app

Fase: preparacion del Bloque I / desacople de `App.tsx`

Archivos movidos:

- `src/App.css`
- `src/App.integration.test.tsx`
- `src/App.tsx`
- `src/app/AppHome.tsx`
- `src/app/AppShell.tsx`
- `src/app/appRoutes.ts`
- `src/features/lab/LabApp.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Empezar a preparar de verdad el futuro modo app sin romper el laboratorio
actual, separando la monovista heredada de la ruta principal y evitando que
`App.tsx` siga siendo al mismo tiempo:

- shell general
- home futura
- laboratorio completo

Como se movio:

- El laboratorio actual se movio a la ruta:
  - `/lab`
- La raiz:
  - `/`
  queda reservada como entrada del futuro modo app
- Se creo una home minima de app para la raiz, con mensaje de direccion futura
  y acceso al laboratorio.
- Se creo `AppShell` como primer contenedor del futuro modo app horizontal.
- El laboratorio se extrajo a `src/features/lab/LabApp.tsx`.
- `App.tsx` deja de ser la monovista completa y pasa a ser un wrapper pequeno
  de navegacion entre rutas base.
- Las pruebas de integracion se actualizan para arrancar desde `/lab`.
- Se documento explicitamente que el futuro `modo vertical` se difiere hasta que
  el modo horizontal este funcionando de forma estable.

Decision tecnica:

Se eligio una separacion minima de rutas sin agregar todavia un router grande ni
abrir todas las pantallas nuevas. Esto alcanza para:

- sacar responsabilidad de `App.tsx`
- liberar `/` para la arquitectura futura
- mantener el laboratorio funcional y accesible
- dejar el modo horizontal como prioridad antes del vertical

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

MiMIDI ya no usa la raiz como laboratorio por defecto. La app principal empieza
su camino hacia un shell propio y el laboratorio queda aislado en una ruta mas
honesta para continuar migrando sin apelotonar el proyecto.
