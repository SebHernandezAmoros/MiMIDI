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

## Movimiento 76 - Esqueleto inicial de vistas del modo app

Fase: preparacion del Bloque I / continuidad del desacople de `App.tsx`

Archivos movidos:

- `src/App.css`
- `src/App.integration.test.tsx`
- `src/App.tsx`
- `src/app/AppMode.tsx`
- `src/app/appNavigation.ts`
- `src/app/appRoutes.ts`
- `src/app/navigation.ts`
- `src/features/edit/EditScreen.tsx`
- `src/features/edit/EditWorkspace.tsx`
- `src/features/perform/PerformScreen.tsx`
- `src/features/perform/PerformWorkspace.tsx`
- `src/features/plugins-view/PluginsScreen.tsx`
- `src/features/plugins-view/PluginsWorkspace.tsx`
- `src/features/project-view/ProjectScreen.tsx`
- `src/features/project-view/ProjectWorkspace.tsx`
- `src/features/sampler/SamplerScreen.tsx`
- `src/features/settings-view/SettingsScreen.tsx`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Dejar nacidas las vistas principales del futuro modo app horizontal aunque
todavia no tengan su contenido final, para que la migracion deje de ser solo
plan y pase a tener archivos, nombres y fronteras reales dentro del proyecto.

Como se movio:

- La raiz de la app ya no muestra solo una home temporal.
- Se creo `AppMode` como shell inicial del modo app horizontal.
- `AppMode` ya muestra navegacion base por vistas:
  - `Perform`
  - `Edit`
  - `Project`
  - `Plugins`
  - `Settings`
  - `Sampler`
- Se dejaron creados los archivos placeholder de cada pantalla y, cuando
  aplica, de su `Workspace`.
- `Edit` queda como vista activa por defecto, alineada con la recomendacion de
  empezar la migracion por la pantalla de edicion.
- Se agrego prueba para validar que la raiz ya monta el shell nuevo y no el
  laboratorio.

Decision tecnica:

Se eligio crear pantallas reales aunque esten vacias en vez de seguir
describiendolas solo en docs, porque eso reduce friccion futura y fija desde
ya una convencion de nombres y ubicaciones. Tambien ayuda a seguir sacando
coordinacion de `App.tsx`, ya que la app principal empieza a hablar en terminos
de modo app y laboratorio como piezas separadas.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El proyecto ya tiene un esqueleto funcional del modo app horizontal. Todavia no
hay migracion de features dentro de cada vista, pero las pantallas ya existen y
la arquitectura deja de depender de imaginar esos archivos "despues".

## Movimiento 78 - Tema clasico base e i18n inicial para el modo app

Fase: preparacion del Bloque I / shell horizontal

Archivos movidos:

- `src/App.css`
- `src/App.tsx`
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
- `src/features/plugins-view/PluginsScreen.tsx`
- `src/features/plugins-view/PluginsWorkspace.tsx`
- `src/features/project-view/ProjectScreen.tsx`
- `src/features/project-view/ProjectWorkspace.tsx`
- `src/features/sampler/SamplerScreen.tsx`
- `src/features/settings-view/SettingsScreen.tsx`
- `src/i18n/en.ts`
- `src/i18n/es.ts`
- `src/i18n/index.ts`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Preparar el modo app horizontal para crecer con menos retrabajo, dejando ya:

- tokens visuales inspirados en `Mac OS Classic`
- tipografia base coherente con esa direccion
- primera base real de multilenguaje configurable
- placeholders del modo app sin textos regados por todos lados

Como se movio:

- Se creo `appTheme.ts` con la paleta base de 5 grises y tipografia principal.
- `AppShell` ahora aplica variables CSS del tema clasico.
- `App.css` se ajusto para que el shell y las vistas placeholder usen:
  - bloques rigidos
  - relieve falso 3D
  - contraste por grises
- Se importaron fuentes base para el modo app:
  - `VT323`
  - `IBM Plex Mono` como respaldo moderno
- Se creo `appI18n.ts` como frontera de idioma del modo app.
- Se agregaron diccionarios iniciales:
  - `es`
  - `en`
- La raiz del modo app ya puede leer `lang` desde query string.
- `AppMode` ahora resuelve labels, descripciones y toolbar desde mensajes
  centralizados.
- Las vistas placeholder del modo app dejaron de hardcodear su copy principal y
  ahora reciben textos desde i18n.

Decision tecnica:

Se eligio resolver primero tema e idioma en el shell antes de llenar las vistas
reales, porque hacerlo despues implicaria tocar muchas pantallas otra vez.
Tambien se mantiene la regla de que el futuro modo vertical deberia nacer como
reordenamiento de layout, no como reescritura de textos o estilos por separado.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El modo app ya no solo tiene estructura de vistas: tambien tiene una direccion
visual compartida y una base multilenguaje inicial. Eso baja mucho el riesgo de
que las siguientes pantallas nazcan inconsistentes o con texto hardcodeado por
todas partes.

## Movimiento 77 - Plan visual, multilenguaje y flexible para el modo app

Fase: preparacion del Bloque I / direccion del shell

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Dejar asentada la direccion concreta del layout antes de llenarlo de contenido,
incluyendo:

- referencia visual tipo `Mac OS Classic`
- tokens de color
- tipografia recomendada
- preparacion multilenguaje
- regla de flexibilidad para futuro modo vertical

Como se movio:

- Se agrego a `09` la paleta base de 5 grises sin blanco.
- Se documento el uso sugerido de cada gris dentro del shell.
- Se agrego la recomendacion tipografica:
  - `VT323`
  - alternativa `IBM Plex Mono`
- Se reforzo la regla del relieve 3D falso:
  - claro arriba/izquierda
  - oscuro abajo/derecha
- Se dejo explicito que el layout nace horizontal, pero no debe quedar tan
  rigido que impida un modo vertical despues.
- Se agrego una seccion de preparacion multilenguaje con estructura sugerida de
  i18n y reglas para no hardcodear textos futuros.
- Se amplio el plan tecnico para incluir:
  - etapa de tokens visuales
  - etapa de i18n
  - etapa de shell flexible
  - etapa de replica por vistas
  - etapa posterior de modo vertical

Decision tecnica:

Se eligio documentar primero esta direccion para evitar que las futuras vistas
nazcan con decisiones visuales y de texto improvisadas. Tambien se busca que el
modo vertical futuro sea mayormente una reorganizacion del shell, no una
reescritura completa de la app.

Resultado:

El proyecto ya no solo tiene un shell y pantallas placeholder: ahora tambien
tiene una guia clara de como deberian implementarse visualmente, como
prepararlas para multiples idiomas y como mantener la puerta abierta al modo
vertical sin romper la direccion horizontal principal.

## Movimiento 79 - Primera replica real de edicion desde el laboratorio

Fase: Bloque I - Modo app / migracion por vistas

Archivos movidos:

- `src/features/lab/LabApp.tsx`
- `src/features/edit/EditWorkspace.tsx`
- `src/App.integration.test.tsx`

Intencion:

Dejar de tener `EditScreen` como placeholder puro y convertirlo en la primera
vista real del modo app, pero sin romper ni desarmar todavia el laboratorio
monovista.

Como se movio:

- `LabApp` ahora acepta un modo `edit-only`.
- Ese modo reutiliza la misma logica del laboratorio para renderizar solo:
  - timeline de tracks
  - lista de notas grabadas
  - editor de nota
  - timeline de notas
- `EditWorkspace` ya no muestra solo texto de placeholder:
  - ahora monta `LabApp` en modo `edit-only`
- La prueba de integracion de la ruta raiz dejo de validar solo copy vacio y
  ahora confirma presencia real de controles del editor.

Decision tecnica:

Se eligio replicar la vista de edicion reutilizando el laboratorio como fuente
de verdad de comportamiento, en lugar de reimplementar la logica dentro de
`EditScreen`. Asi:

- el laboratorio sigue integro
- la nueva vista ya nace funcional
- se evita duplicar reglas de timeline, seleccion, historial y edicion fina

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El modo app ya no es solo shell + placeholders. `Edit` se convierte en la
primera pantalla viva montada sobre comportamiento real, mientras `LabApp`
sigue intacto como sandbox completo para migraciones futuras.

## Movimiento 80 - Primera replica real de proyecto desde el laboratorio

Fase: Bloque I - Modo app / migracion por vistas

Archivos movidos:

- `src/features/lab/LabApp.tsx`
- `src/features/project-view/ProjectWorkspace.tsx`
- `src/App.integration.test.tsx`

Intencion:

Hacer que `ProjectScreen` deje de ser un placeholder y pase a exponer una vista
real de gestion de proyecto, manteniendo el laboratorio como fuente completa de
comportamiento.

Como se movio:

- `LabApp` ahora acepta tambien un modo `project-only`.
- Ese modo reutiliza la logica del laboratorio para renderizar:
  - panel de proyecto y pistas
  - categoria e instrumento por pista
  - manager de plugins internos
  - mezcla por pista
  - automatizacion basica
  - envolvente por pista
  - acciones de proyecto:
    - reproducir
    - exportar WAV
    - detener
    - limpiar notas
    - reiniciar proyecto
    - importar/exportar JSON
- `ProjectWorkspace` ya monta `LabApp` en modo `project-only`.
- Se agrego prueba de integracion para confirmar que la ruta raiz en `view=project`
  ya muestra controles reales del proyecto.

Decision tecnica:

Se repitio la misma estrategia usada en `Edit`: primero replicar la superficie
real apoyandose en el laboratorio, y despues extraer coordinacion mas fina si
la vista crece. Eso evita reescritura temprana y mantiene una sola fuente de
verdad de negocio durante la migracion.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

`Project` ya nace como segunda pantalla viva del modo app. El shell deja de ser
solo maqueta y empieza a repartir capacidades reales sin sacrificar el
laboratorio monovista como sandbox estable.

## Movimiento 81 - Primera replica real de interpretacion desde el laboratorio

Fase: Bloque I - Modo app / migracion por vistas

Archivos movidos:


- `src/features/lab/LabApp.tsx`
- `src/features/perform/PerformWorkspace.tsx`
- `src/App.integration.test.tsx`

Intencion:

Convertir `PerformScreen` en la tercera pantalla viva del modo app, agrupando
la parte mas performativa del laboratorio sin mezclarla con mezcla o edicion
fina.

Como se movio:

- `LabApp` ahora suma un modo `perform-only`.
- Ese modo reutiliza la logica del laboratorio para renderizar:
  - controles de sonido
  - arpegiador
  - selector de octava y modo del piano
  - piano visual
  - mini `SMC Pad`
  - acciones de toque/grabacion/reproduccion
  - log MIDI
- `PerformWorkspace` ya monta `LabApp` en modo `perform-only`.
- Se agrego prueba de integracion para confirmar que la ruta raiz en
  `view=perform` muestra controles reales de interpretacion.

Decision tecnica:

Se consolida el patron de migracion por modos parciales del laboratorio:

- `edit-only`
- `project-only`
- `perform-only`

Eso permite repartir capacidades reales del laboratorio dentro del shell sin
duplicar comportamiento ni destruir el sandbox original.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

El modo app ya cuenta con sus tres vistas troncales vivas:

- `Edit`
- `Project`
- `Perform`

La raiz del proyecto deja de ser solo una maqueta de navegacion y pasa a tener
un esqueleto funcional serio para la futura separacion completa por pantallas.

## Movimiento 82 - Plan consolidado para empujar el modo app y preparar Expo

Fase: transicion entre Bloque G y Bloque I

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Dejar documentado el siguiente tramo real del proyecto ahora que ya existen
mockups y que la prioridad pasa a ser empujar el modo app como experiencia
visible, sin perder el laboratorio como sandbox ni tomar una mala decision al
introducir Expo.

Como se movio:

- Se actualizo `04` para reconocer que `Bloque I` ya esta iniciado en fase de
  migracion controlada.
- Se amplio `09` con:
  - plan inmediato por iteraciones para el modo app
  - estrategia de trabajo guiada por mockups
  - analisis de opciones para Expo
  - recomendacion concreta de no incrustar Expo dentro del `src/` actual
  - sugerencia de crear Expo como app separada si se decide avanzar
- Se dejo explicito que el siguiente frente no es solo "mas plugins", sino:
  - consolidar shell
  - madurar vistas reales
  - seguir extrayendo coordinacion de `LabApp`

Decision tecnica:

Se eligio documentar primero la estrategia antes de crear una app Expo porque el
riesgo mayor ahora no es "no tener Expo", sino abrir otro runtime sin un mapa
claro de convivencia con la app web ya existente.

Validacion:

- revision manual de coherencia entre:
  - `docs/04-plan-desarrollo.md`
  - `docs/05-contexto-vivo-desarrollo.md`
  - `docs/09-arquitectura-modo-app.md`
  - estado actual del shell y vistas reales del modo app en `src/`
  - documentacion oficial de Expo:
    - `create-expo-app`
    - `Expo Router`

Resultado:

El proyecto ya tiene una hoja de ruta mas clara para arrancar el modo app con
mockups reales y tambien una postura inicial sensata sobre Expo: probarlo como
app paralela o segunda app del workspace, no como reemplazo directo de la app
web actual.

## Movimiento 83 - Priorizacion explicita: vistas ahora, Expo y desacople fuerte despues

Fase: transicion entre Bloque G y Bloque I

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`

Intencion:

Evitar que el plan se disperse ahora que ya hay mockups del modo app. Se deja
explicito que el foco inmediato pasa a ser construir las vistas, mientras que la
separacion mas profunda de `App.tsx` / `LabApp` y la incorporacion correcta de
Expo quedan guardadas como tareas importantes pero posteriores.

Como se movio:

- En `04` se marco como foco inmediato:
  - adaptar `Edit`, `Project` y `Perform` a mockups reales
  - convertir `Plugins`, `Settings` y `Sampler` en vistas reales
- En `04` tambien se movio a "tareas importantes para despues":
  - seguir extrayendo coordinacion de `App.tsx`
  - consolidar `LabApp`
  - desacoplar gradualmente las vistas del laboratorio
  - definir e implementar Expo como app separada, si se confirma
- En `09` se ajusto el siguiente paso recomendado para dejar claro que:
  - primero van las vistas del modo app web actual
  - despues el desacople fuerte
  - y solo mas tarde la decision/creacion de Expo

Decision tecnica:

Se eligio no abrir a la vez "mockups + desacople profundo + Expo" porque eso
subiria demasiado el frente de trabajo y haria mas facil perder foco. El orden
correcto por ahora es avanzar visiblemente en el modo app y dejar las tareas
estructurales mas pesadas anotadas, no olvidadas.

Validacion:

- revision manual de consistencia entre `04`, `05` y `09`

Resultado:

Queda asentado que la prioridad actual es desarrollar las vistas del modo app.
Expo y la separacion mas profunda de `App.tsx` siguen siendo importantes, pero
ya no compiten con el foco inmediato.

## Movimiento 84 - Primer aterrizaje visual real de Perform con catalogo de estilos del modo app

Fase: Bloque I - vistas guiadas por mockup

Archivos movidos:

- `src/App.tsx`
- `src/app/appRoutes.ts`
- `src/app/appNavigation.ts`
- `src/app/appTheme.ts`
- `src/app/styles/appModeCatalog.css`
- `src/features/lab/LabApp.tsx`
- `src/features/perform/PerformWorkspace.tsx`
- `src/features/perform/PerformWorkspace.css`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`

Intencion:

Empezar el modo app en serio por la vista `Perform`, tomando como referencia el
mockup compartido y mejorando al mismo tiempo la base de estilos compartidos del
shell para no seguir resolviendo cada pantalla desde `App.css` de forma
mezclada.

Como se movio:

- Se creo `src/app/styles/appModeCatalog.css` como primera base compartida del
  modo app para:
  - shell
  - superficies tipo ventana
  - topbars
  - bloques y acciones comunes
- Se expandio `appTheme.ts` con tokens mas utiles para este lenguaje visual:
  - canvas
  - superficies papel
  - borde suave
  - texto mutado
  - color acento
- `PerformWorkspace` dejo de ser una simple caja que incrustaba el laboratorio
  y ahora monta una carcasa visual mas cercana al mockup.
- `LabApp` en modo `perform-only` se reorganizo en bloques mas claros:
  - panel principal
  - selector rapido de track
  - acceso rapido de octava / nota / tocar
  - panel de piano
  - panel lateral con proyecto, `SMC Pad`, acciones y log MIDI
- Se cambio la vista por defecto del modo app a `Perform` para acompañar el
  foco actual de trabajo.

Decision tecnica:

Se eligio no reescribir la logica de interpretacion desde cero. En vez de eso,
se reutilizo la logica real ya viva en `LabApp`, pero se le dio una estructura
mas compatible con mockup y con el shell horizontal. Tambien se empezo a sacar
la direccion visual del modo app de `App.css` hacia un catalogo mas especifico,
porque seguir mezclando ambos mundos iba a encarecer mucho el resto de vistas.

Validacion:

- `npm run test`
- `npm run lint`
- `npm run build`

Resultado:

`Perform` se convierte en la primera vista del modo app con una direccion visual
real y no solo funcional. Ademas, el proyecto ya tiene una base inicial de
estilos compartidos del modo app para abaratar el costo de las siguientes
pantallas.

## Movimiento 85 - Analisis y documentacion de la app Expo ya creada en `apps/`

Fase: Bloque I / convivencia web + Expo

Archivos movidos:

- `docs/00-README-DOCS.md`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/09-arquitectura-modo-app.md`
- `docs/10-app-expo-actual.md`

Intencion:

Corregir un vacio documental importante: Expo ya fue creado dentro del proyecto,
pero la documentacion seguia hablando de Expo mayormente como decision futura o
posibilidad posterior.

Tambien hacia falta dejar por escrito el estado real de `apps/mimidi-expo`
porque:

- el proyecto ya tiene una segunda app en el workspace;
- esa app no esta integrada aun al core musical;
- y su navegacion/configuracion actual no refleja del todo la direccion activa
  del producto.

Como se movio:

- Se registro la existencia explicita de:
  - `apps/mimidi-expo`
- Se creo una nueva fuente de verdad dedicada:
  - `docs/10-app-expo-actual.md`
- Se documento que Expo hoy cumple el rol de:
  - prototipo paralelo del modo app
- Se dejo por escrito que la app Expo actual:
  - tiene una primera pantalla visual real (`PerformPrototypeScreen`)
  - mantiene varias pantallas placeholder
  - no esta conectada aun al core web real
  - conserva desalineaciones tecnicas que explican parte del "nada funciona"
- Se detecto y documento que:
  - `app.json` sigue con `orientation: "portrait"`
  - el tabs layout sigue apuntando a `index` y `explore`
  - las rutas reales existentes son:
    - `index`
    - `edit`
    - `plugins`
    - `smc-pad`
    - `settings`

Decision tecnica:

Expo deja de tratarse solo como hipotesis futura y pasa a considerarse una
pieza real del workspace, pero con un rol acotado y honesto:

- no reemplaza aun la app web;
- no es todavia la nueva fuente principal del producto;
- se conserva como prototipo paralelo del modo app;
- su prioridad inmediata es alinearse con la direccion horizontal actual y
  ordenar su estructura base antes de intentar integraciones profundas.

Validacion:

- revision manual de `apps/mimidi-expo`
- lectura de:
  - `package.json`
  - `app.json`
  - `app/_layout.tsx`
  - `app/(tabs)/_layout.tsx`
  - pantallas actuales del router
  - componentes de `src/features` dentro de Expo

Resultado:

La carpeta `apps/` deja de ser un frente silencioso del proyecto. Desde ahora
queda documentado que Expo ya existe, para que sirve hoy, que no hace todavia y
cual es el siguiente tramo sano para continuar.

## Movimiento 86 - Base real de pantallas Expo alineada a placeholders

Fase: Bloque I / frente Expo horizontal

Archivos movidos:

- `apps/mimidi-expo/app.json`
- `apps/mimidi-expo/README.md`
- `apps/mimidi-expo/app/_layout.tsx`
- `apps/mimidi-expo/app/(tabs)/_layout.tsx`
- `apps/mimidi-expo/app/(tabs)/edit.tsx`
- `apps/mimidi-expo/app/(tabs)/plugins.tsx`
- `apps/mimidi-expo/app/(tabs)/settings.tsx`
- `apps/mimidi-expo/app/(tabs)/smc-pad.tsx`
- `apps/mimidi-expo/src/navigation/appTabs.ts`
- `apps/mimidi-expo/src/components/PrototypeShell.tsx`
- `apps/mimidi-expo/src/components/PrototypeUI.tsx`
- `apps/mimidi-expo/src/features/perform/PerformPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/smc-pad/SmcPadPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/plugins/PluginsPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/edit/EditPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/settings/SettingsPrototypeScreen.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Pasar de una Expo app con tabs starter y placeholders sueltos a una base real
de modo app, alineada con los placeholders visuales compartidos y con una
estructura que pueda crecer sin volver a mezclar navegacion, pantalla y estilo
en cada archivo.

Como se movio:

- Se definio un plan de crecimiento para Expo con esta prioridad:
  - `Perform`
  - `SMC Pad`
  - `Plugins`
  - `Edit / Timelines`
  - `Settings`
- Se creo `PrototypeShell` como carcasa comun del prototipo Expo.
- Se creo `PrototypeUI` para centralizar primitivas visuales base:
  - botones
  - paneles
  - selects simulados
  - filas de ajustes
- Se creo `appTabs.ts` para dejar una sola fuente de verdad de rutas visibles.
- Se oculto la tab bar nativa de Expo Router y la navegacion visible pasa a ser
  una barra superior propia del prototipo.
- Se alineo Expo con la regla:
  - horizontal primero
- `app.json` paso a `orientation: "landscape"`.
- El shell ahora muestra una pantalla de rotacion si se abre en vertical.
- `Perform` se rearmo sobre el shell nuevo como referencia visual principal.
- `SMC Pad`, `Plugins`, `Edit` y `Settings` dejaron de usar placeholder puro y
  ahora tienen prototipos visuales iniciales alineados a los mocks.
- `Edit` se resolvio por ahora como una sola pantalla de timelines con:
  - toolbar
  - timeline de notas
  - preview de track timeline
- Se reemplazo el README starter por documentacion propia de la app Expo.

Decision tecnica:

Se eligio no conectar todavia Expo con el core musical real. Primero se fija:

- shell
- navegacion
- orientacion
- lenguaje visual
- mapa de pantallas

La razon es proteger el crecimiento futuro: si la UI aun esta inestable,
compartir dominio o logica demasiado pronto encarece todo.

Validacion:

- `npm run lint` dentro de `apps/mimidi-expo`

Resultado:

Expo deja de ser una coleccion de restos del template y pasa a ser una base
seria del modo app paralelo. Ya existe una estructura clara para seguir
refinando pantallas y luego decidir con mas criterio que parte del dominio del
proyecto web merece compartirse.

## Movimiento 87 - Correccion del shell Expo para horizontal responsive

Fase: Bloque I / endurecimiento del shell Expo

Archivos movidos:

- `apps/mimidi-expo/src/components/PrototypeShell.tsx`
- `apps/mimidi-expo/src/features/perform/PerformPrototypeScreen.tsx`

Intencion:

Corregir un problema visible del prototipo Expo: aunque la app ya estaba en
horizontal, el shell seguia comportandose como una tarjeta demasiado rigida.
En pantallas bajas o estrechas eso dejaba partes del contenido fuera de vista,
recortaba menus y generaba sensacion de espacios en blanco torpes.

Como se movio:

- `PrototypeShell` deja de depender de scroll como solucion.
- El shell vuelve a un layout fijo sin scroll y ahora se adapta por
  breakpoints.
- Se agregan dos niveles de compactacion:
  - `compact`
  - `tight`
- Se reducen paddings, gaps y escala visual cuando la pantalla horizontal es
  baja o estrecha.
- La fila superior del shell compacta mejor marca y navegacion.
- `PerformPrototypeScreen` adopta tambien un modo compacto:
  - filas menos rigidas
  - teclado mas bajo
  - botones de control mas pequenos
  - track selector con mejor tolerancia a ancho reducido
  - cluster de octava menos agresivo
  - bloque inferior mas comprimido

Decision tecnica:

Se mantiene Screaming Architecture:

- `app/` y shell para infraestructura de navegacion y layout
- `perform/` para la capacidad visible de piano/grabacion

La correccion se hizo sin mezclar el problema responsive con dominio musical o
con logica de otras pantallas.

Validacion:

- `npm run lint` dentro de `apps/mimidi-expo`

Resultado:

La app Expo sigue en horizontal, pero ahora intenta entrar completa en pantalla
sin recurrir a scroll. El shell queda mejor preparado para seguir refinando
`Perform` y para aplicar despues la misma estrategia a `Plugins`, `Settings`,
`SMC Pad` y `Edit`.

## Movimiento 88 - Primer comportamiento real local para `Perform` en Expo

Fase: Bloque I / primer estado funcional de Expo

Archivos movidos:

- `apps/mimidi-expo/src/features/perform/PerformPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/perform/usePerformPrototypeState.ts`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Dar el primer paso desde maqueta visual hacia comportamiento real dentro de
Expo, pero sin conectar todavia la app al core musical web.

El objetivo de esta iteracion fue volver funcional `Perform` con estado local
del feature, manteniendo Screaming Architecture y evitando meter reglas de
interaccion directamente desordenadas dentro del shell.

Como se movio:

- Se creo `usePerformPrototypeState.ts` dentro del feature `perform`.
- El estado local ahora vive en una frontera propia del producto y no pegado al
  shell general.
- `Perform` ya soporta:
  - estado `idle / recording`
  - agregar track
  - cambiar track activo con flechas
  - cambiar octava con `- / +`
  - activar nota desde teclas blancas y negras
  - reflejar ultima nota activa en el panel inferior
  - reflejar cantidad de tracks y estado de transporte
- Los controles muestran estados deshabilitados cuando corresponde:
  - primera pista
  - ultima pista
  - minimo y maximo de octava

Decision tecnica:

Se mantiene Screaming Architecture tambien en Expo:

- el shell vive en `app/` y `src/components/PrototypeShell.tsx`
- la capacidad funcional vive en `src/features/perform/`

No se compartio aun dominio real con web porque la prioridad sigue siendo
madurar la experiencia de pantalla antes de abrir una capa comun mas profunda.

Validacion:

- `npm run lint` dentro de `apps/mimidi-expo`

Resultado:

Expo ya no solo se ve como modo app: `Perform` ahora tiene primer
comportamiento local usable. Esto deja una base mas honesta para la siguiente
iteracion sobre `Plugins`, `Settings` o la profundizacion de `Perform`.

## Movimiento 89 - Ajuste fino de `Perform` y primer sonido real del teclado en web

Fase: Bloque I / endurecimiento de `Perform`

Archivos movidos:

- `apps/mimidi-expo/src/features/perform/PerformPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/perform/usePerformPrototypeAudio.ts`
- `apps/mimidi-expo/src/features/perform/usePerformPrototypeAudio.web.ts`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Resolver dos vacios que todavia hacian sentir a `Perform` como demo a medias:

- demasiado aire visual en pantallas horizontales bajas
- interaccion de teclado sin sonido real

Como se movio:

- Se ajusto otra vez la altura del piano para que responda mejor al alto real
  disponible.
- Se compactaron paneles y pills inferiores para consumir menos altura.
- Se corrigio la interaccion de teclas para evitar re-disparos innecesarios al
  soltar.
- Se creo una primera capa de audio propia del feature:
  - `usePerformPrototypeAudio.web.ts`
- Esa capa usa `AudioContext` en web para sintetizar tono simple al tocar notas.
- Se agrego un fallback neutral:
  - `usePerformPrototypeAudio.ts`
  para mantener el feature estable fuera de web por ahora.
- El boton `Stop` ahora tambien apaga notas activas del audio local.

Decision tecnica:

Se mantiene Screaming Architecture:

- el sonido de este prototipo vive en el feature `perform`
- no se subio al shell
- no se mezclo todavia con el core musical web

Esto permite validar experiencia real de pantalla sin comprometer aun la
arquitectura compartida entre runtimes.

Validacion:

- `npm run lint` dentro de `apps/mimidi-expo`

Resultado:

`Perform` queda mas compacto y ya produce sonido real al tocar teclas en web.
Eso no significa aun integracion total con el motor de MiMIDI, pero si marca la
primera transicion clara desde prototipo visual hacia experiencia musical viva
dentro de Expo.

## Movimiento 90 - Guia simple de las 4 capas para replicar web hacia Expo

Fase: convivencia web + Expo / claridad de migracion

Archivos movidos:

- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Dejar explicado de forma simple que "llevar MiMIDI web a Expo" no significa
copiar toda la app tal cual, sino replicarla por capas con distinto nivel de
portabilidad.

Como se movio:

- Se agrego en `docs/10-app-expo-actual.md` una guia operativa de 4 capas:
  - producto
  - dominio puro
  - casos de uso
  - UI e infraestructura
- Se documento que:
  - producto si se replica en Expo
  - dominio luego puede compartirse o adaptarse
  - casos de uso pueden migrarse parcialmente
  - UI/infraestructura no se copia tal cual y se rehace por plataforma

Decision tecnica:

Esto refuerza Screaming Architecture tambien en la convivencia web + Expo:

- no pensamos la migracion como copia de componentes;
- la pensamos como traslado de capacidades y fronteras del producto.

Resultado:

Queda una guia mucho mas facil para decidir que pasa de web a Expo y que no,
sin reabrir la misma discusion en cada iteracion.

## Movimiento 91 - `Plugins`, `Settings` y `Edit` dejan de ser puro placeholder en Expo

Fase: Bloque I / crecimiento funcional por features en Expo

Archivos movidos:

- `apps/mimidi-expo/src/features/plugins/usePluginsPrototypeState.ts`
- `apps/mimidi-expo/src/features/plugins/PluginsPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/settings/useSettingsPrototypeState.ts`
- `apps/mimidi-expo/src/features/settings/SettingsPrototypeScreen.tsx`
- `apps/mimidi-expo/src/features/edit/useEditPrototypeState.ts`
- `apps/mimidi-expo/src/features/edit/EditPrototypeScreen.tsx`
- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Continuar la ruta acordada para Expo sin saltar aun al dominio real del
proyecto web:

- mantener `Perform` como primera pantalla viva;
- volver `Plugins`, `Settings` y `Edit` mas honestos como superficies de app;
- y sostener Screaming Architecture tambien dentro de Expo, separando shell,
  pantalla y estado local por capacidad.

Como se movio:

- Se creo `usePluginsPrototypeState.ts` dentro del feature `plugins`.
- `PluginsPrototypeScreen` ya soporta:
  - seleccion local de plugin
  - activar/desactivar plugins mock
  - resumen del rack activo
  - detalle del plugin seleccionado
  - contadores mock de `IMPORT` y `PLUGIN FOLDER`
- Se creo `useSettingsPrototypeState.ts` dentro del feature `settings`.
- `SettingsPrototypeScreen` ya soporta:
  - idioma ciclico local
  - cambio mock de salida de audio
  - cambio mock de estado MIDI
  - switch de tema oscuro
  - resumen local de la sesion
- Se creo `useEditPrototypeState.ts` dentro del feature `edit`.
- `EditPrototypeScreen` ya soporta:
  - alternar vista mock `notes / tracks`
  - cambiar rango mock de barras
  - mover playhead
  - seleccionar nota en la timeline
  - alternar `mute / solo` por pista
  - reflejar estado actual en un panel de resumen

Decision tecnica:

Se mantiene Screaming Architecture:

- `PrototypeShell` sigue siendo infraestructura de app/layout
- cada feature ahora administra su propio estado local
- no se subio esa logica al shell ni a carpetas genericas de `utils`

Todavia no se comparte dominio real con web. Esta iteracion sigue orientada a
madurar experiencia de pantalla y comportamiento local antes de abrir una capa
comun mas profunda.

Validacion:

- `npm run lint` dentro de `apps/mimidi-expo`

Resultado:

Expo ya no tiene solo una pantalla viva (`Perform`). Ahora tambien `Plugins`,
`Settings` y `Edit` cuentan con primer comportamiento local real. El siguiente
paso sano ya no es "hacer que se vea", sino decidir donde conviene empujar:

- mejorar aun mas el layout horizontal de `Perform`
- llevar sonido tambien a Expo native
- o empezar a enriquecer datos y acciones de `Edit` y `Plugins`

## Movimiento 92 - Primer sonido real tambien para Expo native en `Perform`

Fase: Bloque I / audio local por plataforma en Expo

Archivos movidos:

- `apps/mimidi-expo/package.json`
- `apps/mimidi-expo/src/features/perform/performToneWav.ts`
- `apps/mimidi-expo/src/features/perform/usePerformPrototypeAudio.native.ts`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Cerrar una confusion valida del estado Expo: `Perform` ya sonaba en web, pero
seguia mudo dentro de la app del celular porque solo existia implementacion
`.web`.

Como se movio:

- Se instalo `expo-audio`.
- Se instalo `expo-file-system`.
- Se creo `performToneWav.ts` dentro del feature `perform` para:
  - convertir nota a frecuencia
  - generar bytes `WAV` sinteticos por nota
  - definir nombres de archivo temporales
- Se creo `usePerformPrototypeAudio.native.ts`.
- Esa implementacion native:
  - configura modo de audio con `expo-audio`
  - genera archivos `WAV` temporales por nota en cache
  - reproduce esos tonos al presionar teclas
  - corta y libera players al soltar o detener

Decision tecnica:

Se mantiene Screaming Architecture tambien aqui:

- web sigue usando `usePerformPrototypeAudio.web.ts`
- native ahora usa `usePerformPrototypeAudio.native.ts`
- la sintesis temporal vive en el feature `perform`
- no se subio al shell ni se mezclo con el core musical web

Todavia no es el motor real de MiMIDI compartido entre runtimes. Es una capa
local de experiencia para validar interpretacion dentro de Expo native.

Validacion:

- `npm run lint` dentro de `apps/mimidi-expo`

Resultado:

`Perform` deja de sonar solo en navegador y pasa a tener tambien primer sonido
real dentro de la app Expo native.

## Movimiento 93 - Agenda abierta de convivencia web + Expo + publicacion temprana

Fase: Bloque I / alineacion estrategica antes de seguir migrando

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Dejar por escrito varias incomodidades reales del proyecto antes de seguir
empujando Expo por inercia:

- la version web todavia necesita cierres para dar confianza;
- Expo sigue demasiado inmaduro comparado con web;
- y ya aparece una necesidad practica de mostrar algo publicamente antes de que
  el modo app este terminado.

Como se movio:

- Se documento que conviene cerrar primero fricciones pendientes de la version
  web antes de migrar con ansiedad el laboratorio hacia vistas bonitas.
- Se dejo explicitado que `Perform` en Expo native hoy tiene problemas reales a
  resolver:
  - no soporta varias teclas a la vez como deberia
  - la activacion del sonido aun se siente lenta
  - sigue desperdiciando espacio visual
- Se documento que Expo aun debe acercarse mucho mas a la funcionalidad real de
  la app web:
  - selector de instrumento
  - controles perform
  - mas estado real de proyecto y edicion
- Se agrego como frente real la posibilidad de publicar primero la version web
  como demo visible del proyecto mientras el modo app madura.
- Se dejo asentada la necesidad de evaluar una separacion mas limpia de
  workspace si el crecimiento sigue asi:
  - `apps/web`
  - `apps/app`
  - `packages/core`
- Se documento tambien la preocupacion correcta sobre plugins:
  la compatibilidad futura entre web y app debe apoyarse en core/dominio
  compartido, no en tratar de compartir UI.

Decision tecnica:

La direccion recomendada por ahora es esta:

- no abandonar web;
- no intentar portar todo a Expo de golpe;
- seguir usando web como fuente de verdad funcional;
- seguir usando Expo como frente de modo app;
- y preparar una capa compartida de core solo cuando el dominio a compartir
  este suficientemente estable.

Eso significa que Expo como "app paralela" puede seguir sirviendo un poco mas,
pero no deberia convertirse en un callejon largo. Si el frente sigue creciendo,
la salida sana probablemente sera:

- conservar ambos frentes
- pero reorganizados como apps hermanas sobre un core compartido

Validacion:

- revision manual de consistencia entre plan, contexto vivo y estado real del
  frente Expo / frente web

Resultado:

Queda una agenda honesta para revisar manana:

1. que cerrar primero en web
2. que arreglar urgente en `Perform` native
3. si publicar ya una demo web
4. si conviene reestructurar a `apps/web` + `apps/app` + `packages/core`
5. como pensar compatibilidad de plugins sin volver la arquitectura un dolor de
   cabeza mayor

## Movimiento 95 - 2026-05-20: Reproducción, timeline y drag en tracks

Fecha: 2026-05-20

Fase: Timeline / Reproducción / UX de pistas

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/application/use-cases/playRecordedNotes.ts` | Opción `fromZero` para arrancar desde tiempo 0 o desde la primera nota |
| `src/application/use-cases/playSamplerMixes.ts` | Stop real: registra `AudioBufferSourceNode` y llama `.stop()` al cancelar |
| `src/engine/audio/audioEngine.ts` | `playAudioBufferCalibratedAt` retorna `AudioBufferSourceNode` |
| `src/engine/project/projectModel.ts` | Campo `solo?: boolean` en `SamplerTrack`; función `updateSamplerTrackSolo` |
| `src/features/lab/LabApp.tsx` | Múltiples correcciones (ver detalle) |
| `src/features/timeline/TimelinePreview.tsx/css` | Regla de tiempo con ticks dinámicos en vista notas |
| `src/features/timeline/TrackTimelinePreview.tsx/css` | Regla de tiempo, playhead alineado, drag sin solapamiento |

### Correcciones de reproducción (LabApp)

**Bug: vista notas reproducía todos los mixes**
`editNotesToPlay` incluía `getSamplerTracks(...)` → `playAll` lanzaba todos los mixes.
Fix: en vista "notes", `editNotesToPlay = { ...project, timeline: [primaryTrack] }`.

**Bug: delay al reproducir en vista notas**
`playAll` siempre pasaba `fromZero: true` → las notas esperaban su posición absoluta antes de sonar.
Fix: `playAll(project, fromZero)` donde `fromZero = timelineView === "tracks"`.
En vista notas: `fromZero = false` → arranca desde la nota más temprana sin silencio previo.

**Bug: mix seguía sonando después de Stop**
`playAudioBufferCalibratedAt` no devolvía el nodo. `cancel()` no podía detenerlos.
Fix: función retorna `AudioBufferSourceNode`; `playSamplerMixes` rastrea los nodos y llama `.stop()` al cancelar.

**Bug: playhead desaparecía cuando terminaba MIDI pero mixes seguían sonando**
Al completar MIDI, `playbackTransport` ponía `isPlaying = false` y el playhead se borraba.
Fix: `onComplete` en `playAll` activa `isMixOnlyPlaying` si `elapsed < mixMaxEnd` → el playhead continúa vía RAF del modo mix-only.

**Bug: Solo en MIDI no silenciaba mixes**
`playAll` no filtraba los sampler tracks según el estado de solo.
Fix: si `hasMidiSolo → samplerTracks = []`; si `hasMixSolo → samplerTracks = soloedOnly` y `hasMidi = false`.

### Solo para mixes

`SamplerTrack` no tenía campo `solo`. Agregado como `solo?: boolean` (opcional para compatibilidad con proyectos guardados anteriores).
Función `updateSamplerTrackSolo` agregada al modelo.
Botón Solo movido del toolbar principal al submenu contextual (aparece para MIDI y para mixes).
Regla de prioridad:
- MIDI solo → solo ese MIDI, cero mixes
- Mix solo → solo ese mix, cero MIDI
- Sin solo → todo suena

### Eliminación de pista/mix desde submenu

Submenu de lane ahora tiene:
- `X` (lucide) → eliminar clip seleccionado
- `Trash2` → eliminar la pista MIDI completa o el mix completo (abre modal de confirmación)

Antes solo existía `Trash2` para clips. El basurero grande queda reservado para la acción más destructiva.

### Regla de tiempo en vista notas

`TimelinePreview` tenía solo "0s" y el tiempo total a los extremos.
Reemplazado por ruler con ticks dinámicos idénticos al de la vista tracks (función `getRulerTicks`, alineado con la columna de la etiqueta de nota via `grid-template-columns: 3.25rem 1fr`).

### Drag sin solapamiento en tracks

La función `clampNoOverlap` anterior hacía snap al vecino.
Reemplazada por `preventOverlap(newStart, initialStart, clipDuration, others)`:
- Moviendo a la derecha: se detiene antes del borde izquierdo del clip más próximo.
- Moviendo a la izquierda: se detiene en el borde derecho del clip más próximo.
- Los espacios vacíos siguen siendo posibles — no hay snap, solo bloqueo de colisión.

### Validación

- Reproducción desde notas: sin delay, solo esa pista.
- Reproducción desde tracks: desde tiempo 0, con mixes, playhead continuo.
- Stop detiene todo inmediatamente.
- Solo MIDI silencia mixes; Solo Mix silencia MIDI.
- Drag de clips en tracks y mixes: no se solapan, gaps libres.
- Eliminar mix: modal de confirmación desde el submenu.

---

## Movimiento 94 - Reenfoque oficial: web responsive primero y Expo en posible purga

Fase: Bloque I / realineacion estrategica posterior a la exploracion en Expo

Archivos movidos:

- `docs/04-plan-desarrollo.md`
- `docs/05-contexto-vivo-desarrollo.md`
- `docs/10-app-expo-actual.md`

Intencion:

Cerrar con claridad una decision de producto y de inversion tecnica que ya se
venia insinuando en movimientos anteriores:

- Expo sirvio para explorar;
- pero no conviene seguir empujandolo como si fuera el frente principal;
- el valor mas acumulado hoy sigue estando en la app web;
- y el siguiente tramo del proyecto debe concentrarse en hacer que el modo app
  web, especialmente su responsive, se parezca de forma mucho mas fiel a los
  mockups compartidos.

Tambien hacia falta dejar por escrito que un futuro modulo mobile no deberia
nacer rehaciendo todo desde cero, sino aprovechando lo que el frente web ya
resuelva bien y, mas adelante, lo que pueda extraerse como core compartido.

Como se movio:

- Se actualizo `docs/04-plan-desarrollo.md` para cambiar el foco inmediato del
  Bloque I:
  - web como frente principal
  - responsive guiado por mockups
  - Expo congelado por ahora
- Se corrigio `docs/10-app-expo-actual.md` para reflejar dos cosas a la vez:
  - Expo si llego a tener primer audio local prototipo
  - pero deja de ser frente activo y pasa a quedar en posible purga
- Se dejo explicito que la prioridad inmediata es:
  - consolidar `Perform`, `SMC Pad`, `Plugins`, `Settings` y `Edit /
    Timelines` dentro del modo app web
  - mejorar jerarquia visual, densidad y comportamiento responsive antes de
    abrir nuevas vistas o nuevas migraciones

Decision tecnica:

La direccion activa queda asi:

- la app web vuelve a ser el foco total de iteracion;
- el responsive ya no es ajuste secundario, sino frente principal de producto;
- Expo queda congelado y en posible purga, sin borrarlo todavia;
- el futuro mobile se pensara despues, apoyado en lo validado en web y no como
  reinicio paralelo desde cero.

Esto protege mejor la inversion ya hecha y evita que el proyecto se rompa en
dos frentes incompletos al mismo tiempo.

Resultado:

Queda fijado el punto exacto en el que nos quedamos:

- web como fuente de verdad funcional y visual inmediata
- responsive como prioridad visible numero uno
- mockups como referencia obligatoria de estructura y densidad
- Expo documentado, congelado y en observacion para posible purga posterior
- mobile futuro entendido como derivacion del trabajo web y no como reemplazo
  apresurado

## Movimiento 95 - Primera pasada real del shell web guiada por mockups

Fase: Bloque I / adaptacion visible del modo app web

Archivos movidos:

- `src/app/AppShell.tsx`
- `src/app/AppMode.tsx`
- `src/app/styles/appModeCatalog.css`
- `src/features/perform/PerformScreen.tsx`
- `src/features/perform/PerformWorkspace.tsx`
- `src/features/perform/PerformWorkspace.css`
- `src/features/edit/EditScreen.tsx`
- `src/features/edit/EditWorkspace.tsx`
- `src/features/plugins-view/PluginsScreen.tsx`
- `src/features/plugins-view/PluginsWorkspace.tsx`
- `src/features/project-view/ProjectScreen.tsx`
- `src/features/project-view/ProjectWorkspace.tsx`
- `src/features/settings-view/SettingsScreen.tsx`

Intencion:

Ejecutar la primera parte del reenfoque decidido en el Movimiento 94 sin tocar
todavia el dominio musical:

- acercar el shell web al lenguaje general de los mockups;
- dejar de mostrar las vistas del modo app como simples placeholders con texto;
- y crear una base responsive mas seria para seguir empujando `Perform`,
  `Settings`, `Plugins` y `Edit`.

Como se movio:

- `AppShell` se compacto para funcionar mas como cabecera utilitaria y menos
  como hero grande.
- `AppMode` ahora monta una ventana principal mas cercana al mockup:
  - marca a la izquierda
  - navegacion superior por iconos
  - resumen corto de la vista activa
- `Perform`, `Edit`, `Project`, `Plugins` y `Settings` dejan de repetir intro
  larga dentro de cada vista y pasan a entrar directo a un contenedor mas
  cercano al layout esperado.
- `Plugins` deja de ser texto vacio y ahora expone:
  - acciones `IMPORT` y `PLUGIN FOLDER`
  - lista visual de plugins
  - toggle local por plugin
- `Settings` deja de ser texto vacio y ahora expone:
  - seccion de idioma
  - seccion de tema con toggle local
  - seccion de audio
  - seccion de MIDI
- `Edit` gana toolbar superior para acercarse al lenguaje del mockup antes de
  seguir refinando el timeline real.
- `Perform` conserva el core real del laboratorio `perform-only`, pero entra en
  una carcasa mas coherente con el resto del shell web.

Decision tecnica:

Se eligio primero adaptar shell y vistas de superficie antes de reescribir
dominio o coordinacion profunda, porque era la forma mas segura de ganar
fidelidad visible contra mockup sin romper el comportamiento real ya existente.

Resultado:

El modo app web ya no se siente como una coleccion de pantallas nacidas a
medias. Ahora existe una base visual comun mas cercana a los mockups y mas
apta para seguir iterando vista por vista.

Validacion:

- `npm run test`
- `npm run build`

## Movimiento 96 - `Perform` web reenfocado a responsive horizontal tipo mockup

Fase: Bloque I / `Perform` como primera vista fuerte del modo app web

Archivos movidos:

- `src/features/lab/LabApp.tsx`
- `src/features/perform/PerformWorkspace.css`
- `src/App.integration.test.tsx`

Intencion:

Aplicar la leccion correcta que ya habia dejado Expo:

- el frente responsive actual debe pensarse primero en horizontal;
- `Perform` no debia seguir mostrando toda la superficie de laboratorio;
- y la vista del piano necesitaba parecerse mucho mas al mockup compartido,
  priorizando transporte, track, octava y teclado.

Como se movio:

- Se intercepto el modo `perform-only` con una nueva rama especifica para la
  vista web del modo app.
- Esa rama ahora prioriza una composicion mucho mas cercana al mockup:
  - controles compactos de grabacion arriba a la izquierda
  - selector de track al centro
  - boton `+ TRACK` a la derecha
  - bloque secundario para estado y octava
  - piano como protagonista principal de la pantalla
- Se oculto del foco visible la parte mas ruidosa del laboratorio durante esta
  vista:
  - SMC Pad
  - acciones largas de proyecto
  - actividad MIDI
  - paneles secundarios que no pertenecen al mockup del piano
- Se endurecio el CSS de `Perform` para horizontal:
  - menos aire visual
  - tarjetas mas compactas
  - teclado mas alto y dominante
  - mejor respuesta en alturas bajas con `orientation: landscape`

Decision tecnica:

No se rehizo el dominio ni la logica musical. Se reutilizo la base existente y
se la redistribuyo para que la vista `Perform` deje de verse como "laboratorio
embebido" y empiece a verse como una pantalla de app real.

Resultado:

`Perform` ya se acerca bastante mas al mockup de teclado:

- horizontal primero
- mucho menos ruido visual
- foco claro en transporte, track, octava y piano
- base mas apta para la siguiente pasada fina de proporciones y detalle

Validacion:

- `npm run test`
- `npm run build`

---

## Sesion 2026-05-09 � CSS Library, Catalogo UI y vistas restantes

### Que se hizo

#### Bloque 1: CSS Library ()

Se creo la libreria central de primitivos CSS del modo app.

Incluye:

- Sistema de tokens claro/oscuro via 
-  � cuadrado con etiqueta (plugins)
-  � switch iOS (settings, plugins)
-  � checkbox con checkmark grafico
-  /  � filas de lista con icono, label, valor, flecha
-  � bloque de texto de dos lineas
-  /  � grid 4x2 de pads con variantes de color
-  � boton capsula con texto
-  � boton circular con icono SVG
-  /  � control - valor +
-  � selector < TRACK 1 >
-  /  � barra horizontal de controles
-  � select estilizado con flecha
-  � tarjeta de superficie
-  � modificador de dialog para contenido ancho (2 columnas)

La inversion de color (dark mode) se activa con  en
cualquier contenedor padre. Los tokens cambian automaticamente.

La libreria se importa via  en .

#### Bloque 2: Catalogo visual

Se creo  con su CSS.

Accesible en: 

Muestra todos los primitivos en modo claro y oscuro con toggle interactivo.
Permite verificar visualmente tokens y variantes antes de usarlos en vistas.

Se agrego la ruta  en  y .

#### Bloque 3: Reparacion de vistas

- **PerformInstrumentDialog**: ahora usa  via prop 
  en . Ancho aumentado a  para el layout
  de dos columnas (tipo / instrumentos).

- **SamplerScreen** (SMC Pad): reemplazado el placeholder por una vista real.
  - 8 pads en grid 4x2 usando primitivos  + 
  - 4 pads activos (kick, snare, hat, clap) conectados a 
  - 4 pads placeholder (PERC 1-4) desactivados, listos para expansion
  - Toolbar con selects de modo y afinacion, mas boton reset

- **EditWorkspace** (Timeline): toolbar mejorada con primitivos de la libreria.
  - Select NOTAS / TRACKS con clase 
  - Select 1 BAR / 2 BARS / 4 BARS / 8 BARS con clase 
  - Boton de busqueda con 
  - Contenido sigue montando  (comportamiento real)

- **PluginsWorkspace**: conectado al  real.
  - Lee  en lugar de datos hardcodeados
  - El toggle modifica el estado local de plugins
  - Usa , , , 
  - La funcion  genera etiquetas desde el nombre del plugin

### Archivos modificados / creados

Nuevos:
- 
- 
- 

Modificados:
-  � agrega 
-  � agrega 
-  � agrega rama para ruta 
- { is a shell keyword � agrega prop opcional 
-  � usa 
-  � reemplazado por vista SMC Pad real
- { is a shell keyword � toolbar mejorada con primitivos
-  � conectado a pluginRegistry
-  � actualizado con todos los primitivos

### Decisiones tecnicas

- Los primitivos  y  estan definidos en la libreria
  pero aun no reemplazaron a los componentes equivalentes en
  . Esa extraccion es la siguiente tarea.

- El toggle de plugins en  modifica estado local de la vista.
  No persiste al proyecto todavia porque la coordinacion de 
  global vive en . Conectar al estado global es tarea futura.

- La vista  no se modifico porque ya tenia el boton de idioma y el
  acceso al laboratorio funcionando correctamente.

### Siguiente paso recomendado

1. Extraer los primitivos de  a  y
    para que Perform use la libreria como las demas vistas.
2. Revisar proporcion y fidelidad visual de cada vista contra los mockups.
3. Decidir como conectar el estado de plugins de la vista al proyecto real.

---

## Sesion 2026-05-09 — CSS Library, Catalogo UI y vistas restantes

### Que se hizo

#### Bloque 1: CSS Library

Se creo `src/app/styles/ui-library.css` con todos los primitivos CSS del modo app.
Sistema de tokens claro/oscuro via `[data-ui-theme]`. Importado desde `appModeCatalog.css`.

Primitivos incluidos: ui-badge, ui-toggle, ui-checkbox, ui-list-row, ui-list-section,
ui-plugin-copy, ui-smc-grid, ui-smc-btn, ui-pill-btn, ui-icon-btn, ui-counter,
ui-track-pill, ui-toolbar, ui-select, ui-surface-card, app-dialog-wide.

La inversion de color se activa con `data-ui-theme="dark"` en un contenedor padre.

#### Bloque 2: Catalogo visual

Se creo `src/features/catalog/CatalogPage.tsx` con su CSS.
Ruta de acceso: `http://localhost:5173/catalog`
Muestra todos los primitivos en modo claro y oscuro con toggle interactivo.
Se agrego la ruta `/catalog` en `App.tsx` y `appRoutes.ts`.

#### Bloque 3: Reparacion de vistas

- PerformInstrumentDialog: ahora usa `app-dialog-wide` via prop `className` en `AppDialog`.
  Ancho aumentado a min(100%, 36rem) para el layout de dos columnas.

- SamplerScreen (SMC Pad): reemplazado el placeholder por vista real con 8 pads en grid 4x2.
  4 pads activos (kick, snare, hat, clap) conectados a `playSmcPadHit`.
  4 pads placeholder (PERC 1-4) desactivados, listos para expansion.

- EditWorkspace (Timeline): toolbar mejorada. Select NOTAS/TRACKS y 1 BAR/2 BARS/4 BARS/8 BARS
  con clase `ui-select`. Boton busqueda con `ui-icon-btn`. Contenido sigue en `LabApp mode="edit-only"`.

- PluginsWorkspace: conectado a `getRegisteredPluginSummaries()` del pluginRegistry real.
  Usa ui-badge, ui-toggle, ui-plugin-copy, ui-list-arrow.

### Archivos creados

- `src/app/styles/ui-library.css`
- `src/features/catalog/CatalogPage.tsx`
- `src/features/catalog/CatalogPage.css`

### Archivos modificados

- `src/app/styles/appModeCatalog.css` (import ui-library)
- `src/app/appRoutes.ts` (ruta /catalog)
- `src/App.tsx` (rama /catalog)
- `src/app/components/AppDialog.tsx` (prop className opcional)
- `src/features/perform/components/PerformInstrumentDialog.tsx` (app-dialog-wide)
- `src/features/sampler/SamplerScreen.tsx` (SMC Pad real)
- `src/features/edit/EditWorkspace.tsx` (toolbar mejorada)
- `src/features/plugins-view/PluginsWorkspace.tsx` (pluginRegistry real)
- `docs/11-catalogo-componentes-ui.md` (actualizado)

### Siguiente paso recomendado

1. Extraer ui-counter y ui-track-pill a PerformResponsiveToolbar.
2. Revisar fidelidad visual de cada vista contra mockups.
3. Conectar estado de plugins de la vista al proyecto real.

---

## Sesion 2026-05-10 — Mejoras UI masivas, Lucide React, edit view completo

### Que se hizo

#### Bloque 1: ARP inline y dialog de eliminacion de pista

- El checkbox ARP se movio dentro del bloque de transporte en `PerformResponsiveToolbar`.
  Usa `perform-mode-transport-group` (inline-flex) para agrupar transporte + divisor + ARP en
  una sola linea sin romper el grid de 4 columnas.
- Dialog de eliminacion de pista ahora distingue dos casos:
  - 1 pista: abre `isRestartConfirmOpen` → dialog "Reiniciar proyecto?"
  - 2+ pistas: abre `isTrackRemovalConfirmOpen` → dialog "Eliminar [pista]?"
  - `removeTrackDisabled={false}` siempre habilitado; la logica esta en `confirmRemoveActiveTrack`.

#### Bloque 2: Regla de diseno — toolbar una linea + boton 3-puntos

- Se documento en `docs/13-reglas-diseno-ui.md`.
- El boton 3-puntos (`MoreVertical`) siempre va al extremo derecho del header, despues del
  boton de pantalla completa. Orden del header: `[nav] [Maximize2/Minimize2] [MoreVertical]`.
- Se implemento el patron `ViewSettingsProps`: `settingsOpen: boolean` + `onSettingsClose: () => void`
  viven en `AppMode.tsx`, se pasan via `resolveScreen`, cada Screen renderiza su propio `AppDialog`.
- Para la vista Edit, el `AppDialog` lo maneja `LabApp` internamente (no `EditScreen`).
  El flujo es: `AppMode` → `EditScreen` → `EditWorkspace` → `LabApp` → `AppDialog`.

#### Bloque 3: Color de teclas negras y toggle de etiquetas

- Problema de especificidad: `.app-theme-classic button { color: var(--app-color-text-strong) }`
  (0,1,1) pisaba `.piano-key-sharp { color: #f5f5f5 }` (0,1,0).
  Fix: `.perform-workspace .piano-key-sharp { color: #f5f5f5 }` (0,2,1).
- Estado activo: `.perform-workspace .piano-key-sharp.piano-key-active` → fondo degradado blanco,
  texto `#1f1f1f`.
- Toggle "Mostrar etiquetas de teclas" en Settings usa `data-show-key-labels="false"` en el
  `<section>` raiz de `AppMode` + selector CSS `[data-show-key-labels="false"] .piano-key-label`.
  Sin prop drilling. El texto de cada tecla se envolvi en `<span className="piano-key-label">`.

#### Bloque 4: Libreria de iconos — Lucide React

- Se adopto `lucide-react` como libreria oficial de iconos (MIT, tree-shakeable, stroke uniforme).
- Se reemplazaron todos los SVGs inline por componentes Lucide en todos los archivos tocados.
- Uso: `import { NombreIcono } from "lucide-react"` → `<NombreIcono size={16} />`.
- Se documento en `/catalog` con seccion "Iconos — Lucide React" listando todos los usados.
- Iconos activos: `Piano, Grid2x2, AudioWaveform, Plug, Settings, FileText, Maximize2, Minimize2,
  MoreVertical, Search, Play, Square, Trash2, ArrowLeft, Upload, Folder, Undo2, Redo2`.

#### Bloque 5: Vista Edit — toolbar y modal de opciones completo

- El icono de navegacion de Edit se movio entre Sampler y Plugins en `appNavigation.ts`.
  Orden: `perform, sampler, edit, plugins, settings`.
- Se elimino el boton de busqueda de la toolbar de Edit (no corresponde a esta vista).
- La toolbar del editor (`LabApp mode="edit-only"`) ahora tiene en una sola linea:
  1. Segmented control NOTAS / TRACKS (`edit-view-switch`, pills redondeados).
  2. Select de pista (solo en modo NOTAS).
  3. Select de rango (1 BAR / 2 BARS / 4 BARS / 8 BARS).
  4. Boton Play/Stop — modo NOTAS reproduce solo el track activo; modo TRACKS reproduce todo.
  5. Divisor vertical.
  6. Checkbox SNAP + select de paso (0.05s / 0.10s / 0.25s / 0.50s, visible solo si SNAP activo).
  7. Boton Undo2 (deshabilitado si !canUndo).
  8. Boton Redo2 (deshabilitado si !canRedo).
  9. Boton Trash2 eliminar nota seleccionada (solo en modo NOTAS, deshabilitado si no hay nota).
- `LabNoteEditor` fue simplificado: solo muestra nota, inicio, duracion, duplicar y revertir.
  Retorna `null` si no hay nota seleccionada.
- El modal 3-puntos de la vista Edit (via `settingsOpen` prop) muestra:
  - Input de duracion del timeline (notas o tracks segun modo activo).
  - Boton "Ajustar al contenido".
  - Boton "Compactar inicio" (solo en modo NOTAS).
- Se agrego en `/catalog` la "Plantilla toolbar de vista" con la regla documentada.

### Archivos creados

- `docs/13-reglas-diseno-ui.md`

### Archivos modificados

- `src/features/perform/components/PerformResponsiveToolbar.tsx`
- `src/features/perform/PerformWorkspace.css`
- `src/features/perform/PerformScreen.tsx`
- `src/features/piano/PianoPreview.tsx`
- `src/features/piano/PianoPreview.css`
- `src/features/lab/LabApp.tsx`
- `src/features/lab/LabNoteEditor.tsx`
- `src/features/edit/EditWorkspace.tsx`
- `src/features/edit/EditScreen.tsx`
- `src/features/sampler/SamplerScreen.tsx`
- `src/features/plugins-view/PluginsScreen.tsx`
- `src/features/plugins-view/PluginsWorkspace.tsx`
- `src/features/settings-view/SettingsScreen.tsx`
- `src/features/catalog/CatalogPage.tsx`
- `src/app/AppMode.tsx`
- `src/app/appNavigation.ts`
- `src/app/styles/appModeCatalog.css`
- `docs/13-reglas-diseno-ui.md`

### Pendiente

- Conectar `timelineRange` (1 BAR / 2 BARS...) a funcionalidad real de la timeline.
- Conectar estado de plugins de `PluginsWorkspace` al proyecto real (vive en `LabApp`).
- Vista Project (`?view=project`) sigue siendo placeholder.
- Modo oscuro parcial: solo tokens `ui-*`, no `--app-color-*`.

---

## Sesion 2026-05-10 — Conexion del modal 3-puntos en vista Edit

### Que se hizo

Se corrigio el flujo del modal de opciones de la vista Edit, que estaba roto:
`EditScreen` tenia su propio `AppDialog` vacio y no pasaba `settingsOpen`/`onSettingsClose`
a `EditWorkspace`, por lo que `LabApp` nunca recibia el estado del modal.

- `EditWorkspace.tsx`: se añadieron props `settingsOpen?: boolean` y `onSettingsClose?: () => void`,
  ahora se pasan directamente a `<LabApp mode="edit-only" />`.
- `EditScreen.tsx`: se elimino su propio `AppDialog`. Ahora es un wrapper puro que pasa
  `settingsOpen` y `onSettingsClose` hacia `EditWorkspace`.
- `LabApp.tsx`: dentro del bloque `if (mode === "edit-only")` se envuelve en fragment y se añade
  el `AppDialog` de settings con:
  - Input de duracion del timeline (adapta entre notas y tracks segun `timelineView`).
  - Boton "Ajustar al contenido" (`resetPrimaryTrackNoteTimelineDuration` o `resetProjectTrackTimelineDuration`).
  - Boton "Compactar inicio" (solo visible en modo NOTAS, llama `compactPrimaryTrackNoteTimelineStart`).

### Archivos modificados

- `src/features/edit/EditWorkspace.tsx`
- `src/features/edit/EditScreen.tsx`
- `src/features/lab/LabApp.tsx`

---

## Sesion 2026-05-10 — Editor de nota inline en toolbar de Edit

### Que se hizo

Se movieron los controles de edicion de nota seleccionada al toolbar (barra superior),
eliminando el bloque oscuro que aparecia debajo del toolbar al seleccionar una nota.

**Comportamiento del toolbar en modo NOTAS:**
- Sin nota seleccionada: `[NOTAS|TRACKS] [Track selector] [4 BARS] [▶] | [SNAP] [↩] [↪] [🗑]`
- Con nota seleccionada: `[NOTAS|TRACKS] [chip con nombre nota] [input inicio] [input duracion] [Copy] [RotateCcw] | [SNAP] [↩] [↪] [🗑]`

**Cambios:**
- `LabApp.tsx`: toolbar en modo NOTAS ahora es condicional segun `selectedRecordedNote`.
  Cuando hay nota seleccionada: oculta el track selector, 4 BARS y boton play; muestra chip
  con el nombre de la nota, dos inputs numericos (inicio/duracion) y botones icono Copy/RotateCcw.
  Iconos nuevos importados de lucide-react: `Copy`, `RotateCcw`.
- `LabApp.tsx`: se elimino el render de `<LabNoteEditor>` de debajo del toolbar.
  Se elimino `onRemoveSelectedNote` de `<TimelinePreview>` (el Trash2 del toolbar lo cubre).
  Se elimino el import de `LabNoteEditor` y la variable `selectedNoteHistoryStatus` (sin uso).
- `appModeCatalog.css`: se añadieron clases `.edit-note-chip` (pill gris con nombre de nota)
  y `.edit-note-input` (input numerico compacto 4.2rem de ancho).

### Archivos modificados

- `src/features/lab/LabApp.tsx`
- `src/app/styles/appModeCatalog.css`

---

## Sesion 2026-05-10 — Restaurar laboratorio + editor inline solo en edit-only

### Que se hizo

Los cambios del editor inline de nota afectaron el laboratorio (`/lab`) porque `editWorkspace`
se renderiza en el modo completo de LabApp (linea ~1883). Se corrigio haciendo el renderizado
mode-aware: el laboratorio conserva su comportamiento original, solo la vista Edit recibe los
controles inline.

- Se restauro el import de `LabNoteEditor` y la variable `selectedNoteHistoryStatus`.
- El track selector del toolbar ahora se oculta solo cuando `mode === "edit-only" && selectedRecordedNote`.
- Los controles inline de nota (chip + inputs + Copy + RotateCcw) solo aparecen cuando `mode === "edit-only"`.
- `LabNoteEditor` se renderiza debajo del toolbar solo cuando `mode !== "edit-only"`.
- `onRemoveSelectedNote` en `TimelinePreview` se pasa solo cuando `mode !== "edit-only"`.

**Regla establecida:** `editWorkspace` se comparte entre el lab y la vista Edit.
Cualquier cambio que deba ser exclusivo de Edit debe condicionarse con `mode === "edit-only"`.

### Archivos modificados

- `src/features/lab/LabApp.tsx`

---

## Pendientes proxima sesion (2026-05-11)

### 1. Vista Perform — modo nota/acorde en toolbar

Decidir si el toggle nota/acorde del piano va en la toolbar de Perform o en su modal de 3-puntos.
De momento el modo se cambia internamente en LabApp pero no hay indicador visual claro en la vista.

### 2. Menu de exportacion / proyecto

Crear o conectar una seccion donde el usuario pueda:
- Poner nombre al proyecto.
- Guardar el proyecto (JSON).
- Exportar a WAV.
Esta funcionalidad ya existe en LabApp (`renameProject`, `exportProjectAudio`), falta exponerla
en una vista accesible desde el modo app (posiblemente la vista Project que es placeholder).

### 3. Vista SMC Pad — asignar track de grabacion

Al grabar con el SMC Pad, decidir en que track se guardan los golpes o crear un track nuevo.
De momento los golpes van al track activo sin que el usuario lo controle desde esa vista.

### 4. Vista Plugins — hacer funcional el toggle de activar/desactivar

El toggle de plugin en `PluginsWorkspace` es local y no afecta al proyecto real.
Conectarlo al estado de `LabApp` via `updateProjectPluginEnabled`.
Ademas: boton de importar plugin y menu de detalle por plugin.

### 5. Vista Settings — conectar opciones reales

Varias opciones de Settings no tienen efecto real todavia. Revisar cuales estan desconectadas
y conectarlas (idioma, tema, etiquetas de piano ya funciona, resto pendiente).

### 6. Vista Edit — icono del boton play en toolbar

El boton play/stop del toolbar de Edit tiene un estilo incorrecto (icono o apariencia).
Revisar clase `perform-mode-transport-button` y su estado activo en el contexto del editor.

---

## Sesion 2026-05-10 — Toggle NOTA/ACORDE en toolbar de Perform

### Que se hizo

Se añadio un segmented control NOTA / ACO al toolbar de Perform, junto al bloque ARP,
separado por un divisor vertical. Permite cambiar el modo del piano entre nota individual
y acorde sin necesidad de ir al laboratorio.

- `PerformResponsiveToolbar.tsx`: nuevas props `pianoMode: PianoInteractionMode` y
  `onPianoModeChange`. El control usa la clase `edit-view-switch` (los mismos pills del Edit toolbar).
- `LabApp.tsx`: se pasan `pianoMode={pianoMode}` y `onPianoModeChange={setPianoMode}`.

### Archivos modificados

- `src/features/perform/components/PerformResponsiveToolbar.tsx`
- `src/features/lab/LabApp.tsx`

---

## Sesion 2026-05-10 — Fix toolbar Edit: play, compactar inicio, limpieza

### Que se hizo

- **Boton play**: se cambio de clase `perform-mode-transport-button` (estilo circular de Perform)
  a `ui-icon-btn`. Ahora es siempre visible en el toolbar de Edit independientemente de si
  hay nota seleccionada o no.
- **Compactar inicio**: se añadio al toolbar de Edit como boton icono `ChevronsLeft` (Lucide),
  visible en modo NOTAS. Antes estaba solo en el modal de 3-puntos y no era facil de encontrar.
- **Select de rango** (1 BAR / 2 BARS...): eliminado del toolbar (no tenia funcionalidad real).
  El estado `timelineRange` tambien se elimino. Queda pendiente conectar el rango cuando
  la timeline lo soporte.
- **Nota seleccionada en NOTAS**: los controles inline (chip + inputs + Copy + RotateCcw)
  ahora conviven con el boton play en lugar de reemplazarlo.

### Archivos modificados

- `src/features/lab/LabApp.tsx`

---

## Sesion 2026-05-10 — Vista Exportar/Proyecto

### Que se hizo

Se añadio la vista "project" a la navegacion con icono `Download` (Lucide).
El menu de exportar tiene 4 secciones:
- **Proyecto**: input editable con el nombre del proyecto.
- **Reproduccion**: boton Play/Stop que reproduce toda la linea de tiempo.
- **Exportar**: boton "Exportar WAV" y "Guardar JSON".
- **Importar**: boton "Importar JSON".

El estado y las acciones vienen de `LabApp mode="project-only"`.
`projectActionSection` (bloque anterior de botones sin estilo) fue eliminado.
`ProjectWorkspace` simplificado a un wrapper directo de `<LabApp mode="project-only" />`.
CSS nuevo: `.project-export-body`, `.project-export-section`, `.project-export-btn`,
`.project-export-btn-primary`, `.project-export-name-input`.

### Archivos modificados

- `src/app/appNavigation.ts` (añadido "project" a definiciones)
- `src/app/AppMode.tsx` (icono Download para project)
- `src/features/lab/LabApp.tsx` (rediseno de projectWorkspace)
- `src/features/project-view/ProjectWorkspace.tsx` (simplificado)
- `src/app/styles/appModeCatalog.css` (CSS del export screen)

---

## Sesion 2026-05-10 — Renombrar pista en toolbar de TRACKS

### Que se hizo

En modo TRACKS del editor, se añadio un input de texto en el toolbar que muestra el nombre
de la pista activa y permite editarlo. Solo hace commit al perder el foco o presionar Enter
(un solo undo entry, no uno por tecla). Al cambiar de pista activa, el input se resetea
al nombre correcto via `key={primaryTrack.id}`.

Clases CSS: `.edit-track-name-input` extiende `.edit-note-input` con mayor ancho (7rem) y
alineacion izquierda.

### Archivos modificados

- `src/features/lab/LabApp.tsx`
- `src/app/styles/appModeCatalog.css`

---

## Sesion 2026-05-10 — Plugins conectados al proyecto real

### Que se hizo

El toggle de plugins ahora afecta al proyecto real. Se añadio `"plugins-only"` a `LabAppMode`.
El render de plugins-only usa `registeredPlugins` (computado de `project.pluginStates`) y
llama a `updatePluginEnabled(id, enabled)` al cambiar el toggle. Se usa `ui-toggle` en lugar
de `ui-checkbox` para el interruptor.

`PluginsWorkspace` se simplificó a un wrapper de `<LabApp mode="plugins-only" />`,
igual que `EditWorkspace` y `ProjectWorkspace`. El estado local de pluginStates que tenia
`PluginsWorkspace` fue eliminado.

### Archivos modificados

- `src/features/lab/LabApp.tsx`
- `src/features/plugins-view/PluginsWorkspace.tsx`

---

## Sesion 2026-05-10 — Fuente del instrumento en dialogo de Perform

### Que se hizo

El dialogo de seleccion de instrumento ahora muestra debajo de cada nombre si el instrumento
viene del "Core" o del nombre del plugin que lo aporta.

- `LabApp.tsx`: `dialogVisibleInstruments` ahora incluye `sourceLabel` (nombre del plugin o "Core")
  calculado con `findRegisteredPluginByInstrumentId`.
- `PerformInstrumentDialog.tsx`: nuevo tipo `InstrumentDialogItem` que extiende `MathematicalInstrument`
  con `sourceLabel: string`. Cada boton del listado muestra dos spans:
  `.instrument-dialog-name` (negrita) y `.instrument-dialog-source` (texto muted pequeño).
- `PerformWorkspace.css`: estilos para `.instrument-dialog-name` y `.instrument-dialog-source`.

### Archivos modificados

- `src/features/lab/LabApp.tsx`
- `src/features/perform/components/PerformInstrumentDialog.tsx`
- `src/features/perform/PerformWorkspace.css`

---

## Sesion 2026-05-11 — Modal de opciones Piano en Perform

### Que se hizo

Se agrego contenido real al modal de 3 puntos del modo Perform (antes estaba vacio).
El patron seguido es el mismo que en Edit: `settingsOpen`/`onSettingsClose` se pasan
desde `PerformScreen` → `PerformWorkspace` → `LabApp mode="perform-only"`, y es LabApp
quien renderiza el `AppDialog` internamente porque el estado vive alli.

Controles agregados al modal:

- **Tipo de acorde**: segmented pill Mayor / Menor / Power (liga a `selectedChordType`)
- **ARP Modo**: pill Up / Down / Up-Down / Random / Chord (liga a `arpeggiatorSettings.mode`)
- **ARP Rate**: pill 1/4 / 1/8 / 1/16 / 1/8T (liga a `arpeggiatorSettings.rate`)
- **ARP Gate**: slider 5%–100% con valor en % (liga a `arpeggiatorSettings.gate`)
- **ARP Octavas**: pill 1 / 2 / 3 (liga a `arpeggiatorSettings.octaveRange`)
- **ARP Latch**: checkbox (liga a `arpeggiatorSettings.latch`)

`PerformScreen` ya no necesita su propio `AppDialog` vacio; ahora es un wrapper limpio
que solo renderiza `<PerformWorkspace>` con los props de settings.

### Archivos modificados

- `src/features/lab/LabApp.tsx` — nuevo AppDialog en bloque `perform-only`
- `src/features/perform/PerformScreen.tsx` — eliminado AppDialog propio, delegacion a PerformWorkspace
- `src/features/perform/PerformWorkspace.tsx` — nuevos props `settingsOpen`/`onSettingsClose` → LabApp
- `src/features/perform/PerformWorkspace.css` — estilos `.perform-settings-dialog-*`

---

## Sesion 2026-05-11 — Volumen maestro en Settings

### Que se hizo

Se agrego un slider de Volumen maestro en la seccion AUDIO de la vista Settings.

Arquitectura: el estado `masterVolume` (default 0.8) vive en `AppMode` porque Settings
es una pantalla hermana de las que renderizan LabApp — no comparten contexto React.
`AppMode` importa `setMasterVolume` del audio engine y lo llama en `handleMasterVolumeChange`.
El estado persiste mientras el usuario navega entre vistas porque vive en `AppMode`,
que nunca se desmonta en una sesion.

Nota: LabApp tiene su propio estado `volume` interno para el lab completo, pero NO llama
`setMasterVolume` al montarse — por eso el valor de Settings se conserva al navegar a Perform.

### Archivos modificados

- `src/app/AppMode.tsx` — estado `masterVolume`, `handleMasterVolumeChange`, import `setMasterVolume`, nuevos params en `resolveScreen`
- `src/features/settings-view/SettingsScreen.tsx` — props `masterVolume`/`onMasterVolumeChange`, slider bajo AUDIO
- `src/app/styles/appModeCatalog.css` — `.app-settings-row-volume`, `.app-settings-volume-slider-row`, `.app-settings-volume-slider`

---

## Sesion 2026-05-11 — Controles de pista en modal Edit

### Que se hizo

Se agrego una seccion "Pista activa" al modal de 3 puntos de Edit (Opciones - Editor),
sin eliminar el contenido existente (duracion, ajustar al contenido, compactar inicio).

Controles agregados (todos conectados al estado real de la pista primaria):

- **Volumen** — slider 0-100% → `updatePrimaryTrackVolume`
- **Pan** — slider L100-C-R100 → `updatePrimaryTrackPan`
- **Mute / Solo** — pills toggle → `togglePrimaryTrackMuted` / `togglePrimaryTrackSolo`
- **ADSR** — Attack, Decay, Sustain, Release con sliders; Sustain en %, A/D/R en ms

Los valores ADSR muestran fallback a los defaults del engine si `envelope` es undefined.
La seccion esta separada visualmente del contenido de timeline con un borde superior.

### Archivos modificados

- `src/features/lab/LabApp.tsx` — nueva seccion dentro del AppDialog de edit-only
- `src/app/styles/appModeCatalog.css` — `.edit-settings-track-section/row/label/value/toggles`

---

## Sesion 2026-05-11 — Mute/Solo al toolbar de Edit

### Que se hizo

Se movieron los botones Mute y Solo del modal de opciones Edit al toolbar superior,
solo en `mode === "edit-only"`. Se muestran como pills compactos "M" y "S" antes del
grupo undo/redo. Se eliminaron del modal para no duplicarlos.

### Archivos modificados

- `src/features/lab/LabApp.tsx` — botones M/S en toolbar (edit-only), eliminados del modal
- `src/app/styles/appModeCatalog.css` — `.edit-mute-solo-btn`


---

## Sesion 2026-05-14 - Motor de audio extendido: sweep, filtros y distorsion

### Que se hizo

Se extendio audioEngine.ts con tres capacidades nuevas que permiten sintetizar
percusion retro convincente usando solo el motor matematico:

FrequencySweep: barre la frecuencia de un oscilador con exponentialRampToValueAtTime
de Web Audio API. El pitch cae de from a to Hz en duration segundos. Esto da el golpe
caracteristico del kick y el tom.

AudioFilter: envuelve BiquadFilterNode de Web Audio. Acepta type, frequency y Q
opcionales. Se usa para dar caracter espectral a ruido blanco (highpass para hat,
bandpass para snare y shaker).

Distortion: WaveShaperNode con curva arctangent escalada por k = amount * 120.
oversample 2x para suavizar aliasing.

La cadena de senal nueva es:

  source -> gain (ADSR) -> [WaveShaper] -> [BiquadFilter] -> pan -> master

Antes era gain -> pan -> master sin nodos opcionales.

### Razon de la decision

El motor de audio del core estaba limitado a osciladores puros y ruido sin forma.
Para sintetizar percusion realista sin samples se necesitan sweep de pitch (kick retro),
filtros para dar color al ruido (snare, hat) y distorsion leve para agregar armonicos.
Todo sigue siendo 100% sintetico. No hay samples.

### Archivos modificados

- src/engine/audio/audioEngine.ts - nuevos tipos FrequencySweep, AudioFilter;
  distortion opcional en PlayFrequencyOptions; makeDistortionCurve();
  cadena de senal extendida en startSourceVoice; sweep en startFrequency

---

## Sesion 2026-05-14 - SMC Pad: sintesis avanzada con 8 sonidos y parametros editables

### Que se hizo

playSmcPadHit.ts fue reescrito completamente. El modulo ahora tiene:

SmcPadSynthSettings con 6 parametros editables por el usuario:
- decayScale: escala global del tiempo de decay (0.5-2x)
- distortion: cantidad de distorsion (0-1)
- hatLength: duracion del hihat (0.02-0.2s)
- kickTune: frecuencia final del kick (30-80 Hz)
- hatFlicker: LFO de frecuencia para el hat (on/off)
- velocity: ganancia por posicion Y del puntero al tocar el pad (0.35-1)

8 sonidos en lugar de 4. Los 4 nuevos usan el mismo motor sintetico:
- Tom: sine sweep grave + triangle de ataque + noise bandpass
- Cowbell: dos square (562 Hz + 845 Hz) que baten entre si + noise de golpe
- Rimshot: triangle sweep agudo (2200 a 1400 Hz) + noise highpass + sine sub
- Shaker: dos rafagas de noise bandpass (5500 Hz) separadas 55ms + capa highpass

Velocity por posicion Y: al presionar un pad, la posicion vertical del puntero
determina la velocidad. Golpe arriba = velocity 1.0, golpe abajo = velocity 0.35.
Formula: max(0.35, 1 - (y/height) * 0.65)

### Razon de la decision

Los 4 sonidos originales eran demasiado planos para componer ritmos variados.
El motor de ruido matematico admite todos estos sonidos sin samples.
Los slots PERC 1-4 estaban vacios; ahora tienen percusion util.
La velocity por posicion Y agrega expresividad dinamica sin hardware MIDI externo.

### Archivos modificados

- src/application/use-cases/playSmcPadHit.ts - reescritura completa con tipos, 8 sonidos, settings
- src/engine/midi/events.ts - smcPadSoundId ampliado con los 4 nuevos ids
- src/features/lab/LabApp.tsx - samplerPads actualizado con los 4 nuevos slots

---

## Sesion 2026-05-14 - Playback: playhead animado y settings consistentes

### Que se hizo

Playhead animado en timeline:

usePlaybackTransport ahora expone playbackInfo (PlaybackInfo o null):
  { startedAt: number, contentStart: number, contentEnd: number }

startedAt se captura con performance.now() al iniciar reproduccion.

PlaybackHandle en playRecordedNotes extiende con contentStartTime y contentEndTime
para conocer el rango real del contenido reproducido.

En LabApp un useEffect con requestAnimationFrame calcula:
  absolutePlayheadTime = contentStart + (performance.now() - startedAt) / 1000

y lo pasa como playheadTime a TimelinePreview y TrackTimelinePreview.

Ambos componentes renderizan un div.timeline-playhead (2px, blanco semitransparente)
con left calculado como porcentaje del timelineLength.
CSS: position absolute; inset-block 0; transform translateX(-50%).

Settings de sintesis consistentes en el proyecto:

playRecordedNotes recibe smcPadSettings opcional y lo pasa a cada playSmcPadHit
durante la reproduccion. Antes usaba settings default ignorando los ajustes del usuario.
Ahora playback y grabacion usan los mismos parametros de sintesis.

### Archivos modificados

- src/features/transport/usePlaybackTransport.ts - tipo PlaybackInfo, estado, timestamps
- src/application/use-cases/playRecordedNotes.ts - contentStartTime/contentEndTime, smcPadSettings
- src/features/timeline/TimelinePreview.tsx - prop playheadTime, div timeline-playhead
- src/features/timeline/TrackTimelinePreview.tsx - idem
- src/features/timeline/TimelinePreview.css - clase .timeline-playhead
- src/features/timeline/TrackTimelinePreview.css - idem

---

## Sesion 2026-05-14 - Modelo de proyecto: PadSynthSettings y naming Pad N

### Que se hizo

PadSynthSettings en MusicalProject:

Se agrego padSynthSettings: PadSynthSettings al tipo MusicalProject. Antes los
parametros de sintesis del SMC Pad vivian en useState local de LabApp, lo que
causaba que al recargar el proyecto se perdieran los ajustes.

Ahora cada cambio en el modal del Pad va por applyUpdate con applyPadSynthPatch
y se persiste en localStorage junto con el proyecto.

parseImportedProject parsea padSynthSettings campo por campo con fallback a
DEFAULT_PAD_SYNTH_SETTINGS, garantizando compatibilidad con proyectos viejos.

Naming Pad N:

createDefaultProject ahora crea el primer track con nombre Pad 1.
Se agrego appendPadTrack que cuenta los tracks con nombre Pad* y genera Pad N.

parseImportedProject tiene migracion automatica: si un track tiene nombre que coincide
con /^Track d+$/ (patron legacy) lo renombra a Pad N segun su indice, para que
proyectos guardados antes de este cambio se vean correctamente.

El boton + Track del toolbar de sampler-only ahora llama addPadTrack.

### Archivos modificados

- src/engine/project/projectModel.ts - tipo PadSynthSettings, campo en MusicalProject,
  DEFAULT_PAD_SYNTH_SETTINGS, appendPadTrack, updatePadSynthSettings,
  migracion en parseImportedProject, nombre Pad 1 en createDefaultProject
- src/features/lab/LabApp.tsx - modal usa project.padSynthSettings + applyPadSynthPatch,
  triggerSmcPad usa project.padSynthSettings, boton usa addPadTrack

---

## Sesion 2026-05-14 - UI Edit: botones duracion y eliminacion de pista en toolbar

### Que se hizo

Botones +/- de duracion en toolbar de Edit:

Se agregaron dos botones con iconos Minus y Plus de Lucide al toolbar de edit-only
que ajustan noteTimelineDuration en pasos de +/- 0.1s. El valor actual se muestra en
una etiqueta compacta entre los dos botones (clase .edit-duration-label). El modal sigue
teniendo el input numerico para precision exacta.

Objetivo: evitar que el usuario abra el teclado virtual en movil para ajustar la duracion.

Eliminacion de pista en toolbar (vista Tracks):

El boton Trash2 solo es visible en edit-only cuando timelineView es tracks.
Abre el mismo dialogo de confirmacion existente. Esto cierra el flujo de eliminar
pistas sin ir al modal.

### Archivos modificados

- src/features/lab/LabApp.tsx - botones Minus/Plus en toolbar edit-only, Trash2 condicional
- src/app/styles/appModeCatalog.css - clase .edit-duration-label


---

## Sesion 2026-05-14 - Correccion critica: isRecordedNote no aceptaba los 4 sonidos nuevos

### Que se hizo

Se corrigio un bug de perdida de datos silenciosa. isRecordedNote en projectModel.ts
solo validaba smcPadSoundId para los 4 sonidos originales (kick, snare, hat, clap).
Cuando el usuario grababa un Tom, Cowbell, Rimshot o Shaker, la nota se escribia al
localStorage con smcPadSoundId 'tom' (por ejemplo). Al recargar, isRecordedNote
retornaba false para esa nota, la validacion del track fallaba, parseImportedProject
lanzaba una excepcion, y loadStoredProject retornaba null. El proyecto entero se
reseteaba a createDefaultProject y se perdia todo lo grabado.

El mismo problema existia en normalizeTrackNotes, que solo normalizaba los 4 originales
y descartaba los nuevos IDs.

### Archivos modificados

- src/engine/project/projectModel.ts - isRecordedNote y normalizeTrackNotes ampliados
  con los 8 IDs: kick, snare, hat, clap, tom, cowbell, rimshot, shaker

---

## Sesion 2026-05-14 - Separacion de pistas por tipo: melodic y percussion

### Que se hizo

Se introdujo el concepto de tipo de pista para que el piano y el pad no graben
al mismo track y no superpongan audio sin intencion.

Nuevo tipo ProjectTrackType = 'melodic' | 'percussion' en ProjectTrack.

createDefaultProject crea dos pistas desde el inicio:
- Track 1: trackType melodic (para grabacion desde el piano)
- Pad 1: trackType percussion (para grabacion desde el SMC Pad)

createProjectTrack acepta trackType como segundo parametro (default melodic).

appendTrack: crea pistas melodic, nombradas Track N contando solo las melodicas.
appendPadTrack: crea pistas percussion, nombradas Pad N contando solo las de percusion.

En LabApp:
- getInitialActiveTrackId es ahora mode-aware: en sampler-only busca la primera
  pista percussion, en cualquier otro modo busca la primera melodic.
- primaryTrack se resuelve por tipo segun el modo: piano/edit usa melodicTracks,
  pad usa percussionTracks, con fallback a project.tracks[0].
- El selector de pistas en edit/piano solo muestra pistas melodic.
- El selector de pistas en sampler-only solo muestra pistas percussion.
- Los botones + Track en cada vista agregan el tipo correcto.

Compatibilidad retroactiva: normalizeTrackNotes asigna 'melodic' como fallback
a cualquier pista cargada sin campo trackType. Proyectos viejos cargan correctamente
con todas sus pistas clasificadas como melodic.

isProjectTrack acepta trackType como campo opcional para no romper la validacion
de proyectos guardados antes de este cambio.

### Razon de la decision

Piano y pad compartian el mismo primaryTrack. Grabar un kick en el pad y luego
grabar una melodia en el piano superponia ambas en el mismo track. Con la separacion
por tipo, cada vista graba en su propia capa de pistas y la mezcla final ocurre
solo en el playback de la vista de edicion, que muestra todos los tracks juntos.

La arquitectura queda abierta para que plugins registren su propio trackType
(ej. 'sample', 'midi-external') sin afectar el core.

### Archivos modificados

- src/engine/project/projectModel.ts - ProjectTrackType, trackType en ProjectTrack,
  createProjectTrack con parametro trackType, createDefaultProject con 2 pistas,
  appendTrack melodic, appendPadTrack percussion, isProjectTrack y normalizeTrackNotes
  actualizados
- src/features/lab/LabApp.tsx - getInitialActiveTrackId mode-aware, melodicTracks y
  percussionTracks como derived values, primaryTrack resuelto por tipo, selectores
  de pista filtrados por vista, import de ProjectTrackType

---

## Sesion 2026-05-16 - Corrección: pistas percussion no aparecían en la vista de edición

### Que se hizo

Se corrigió un bug introducido durante la separación de pistas por tipo. En la vista
de edición (modo edit-only), el selector de pistas en el timeline de notas mostraba
únicamente las pistas melodic (Track 1, Track 2), ocultando las pistas percussion
(Pad 1, Pad 2). El usuario tampoco podía seleccionar un pad track como pista activa
en esa vista.

Dos cambios en src/features/lab/LabApp.tsx:

1. primaryTrack en modo no-sampler ahora busca en project.tracks (todos los tipos)
   en vez de melodicTracks. Si el usuario selecciona Pad 1 en el selector, esa pista
   se convierte correctamente en primaryTrack.

2. El selector de pistas del timeline de notas en edit-only pasó de melodicTracks.map
   a project.tracks.map, mostrando todas las pistas del proyecto sin importar su tipo.

El selector del sampler-only no se modificó: sigue mostrando solo percussionTracks.

### Razon de la decision

La vista de edición es la vista de mezcla final. Debe permitir ver y editar notas de
cualquier tipo de pista (melodic, percussion, o plugins futuros). La restricción por
tipo sólo tiene sentido en las vistas de captura (piano graba melodic, pad graba
percussion). En la vista de edición, el filtrado debe ser abierto.

### Archivos modificados

- src/features/lab/LabApp.tsx - primaryTrack busca en project.tracks en edit-only;
  selector de notas usa project.tracks.map en vez de melodicTracks.map

---

## Sesion 2026-05-16 - Mejora de síntesis percusiva: transients, snap y separación de frecuencias

### Que se hizo

Se reescribió la síntesis de los 8 sonidos del SMC Pad para corregir tres problemas
que hacían que la batería sonara plana comparada con un teclado de juguete.

**Problema 1 — Transients faltantes**: Los primeros 2–8ms de un golpe percusivo real
son un burst de ruido corto y brillante que da el "punch" inicial. Sin eso todo suena
redondeado y blando. Se agregó una capa de transient (noise bandpass muy corto) al
kick, tom, cowbell y rimshot.

**Problema 2 — Snare sin snap**: El snare tenía solo cuerpo grave (bandpass 320Hz) +
un triangle débil. El "crack" del snare real viene de ruido highpass 4000Hz+. Se
agregó esa capa como primera voz y se rebalancearon los volúmenes.

**Problema 3 — Tom en la misma frecuencia que el kick**: Con kickTune=42, el tom
sweepaba de 134Hz a 59Hz — casi idéntico al kick. Se cambiaron a frecuencias fijas
(sweep 360→100Hz) completamente independientes de kickTune.

**Problema 4 — Hat sin shimmer metálico**: El oscilador square del hat tenía volumen
0.018 (casi inaudible). Se aumentó a 0.075 y se agregó un segundo square a 10800Hz
para crear el batido (beating) metálico característico.

**Cambios por sonido**:
- Kick: transient noise bandpass 1400Hz (7ms), body más fuerte (0.88v), sub triangle
- Snare: capa snap highpass 4200Hz (primera), body bandpass 260Hz, triangle tonal
- Hat: dos oscilladores square (8400Hz + 10800Hz) con volúmenes útiles
- Clap: snap layer en cada ráfaga + ráfagas en 0/16/34ms (más apretadas)
- Tom: frecuencias fijas 360→100Hz, transient noise 900Hz
- Cowbell: transient noise 800Hz agregado, volúmenes rebalanceados
- Rimshot: capa de noise highpass 4500Hz muy corta y fuerte como golpe principal
- Shaker: volúmenes generales aumentados

### Razon de la decision

El usuario notó que un teclado de juguete con batería sonaba más convincente. La
diferencia fundamental es la presencia de transients de ataque y la separación
espectral clara entre sonidos. La síntesis matemática puede lograrlo sin samples.

### Archivos modificados

- src/application/use-cases/playSmcPadHit.ts - síntesis reescrita para los 8 sonidos

---

## Sesion 2026-05-16 - Config por sonido, candado y paginación de 16 pads

### Que se hizo

**Config por sonido**: cada pad tiene ahora sus propios parámetros independientes
en vez de un objeto global. El proyecto guarda `padSoundSettings` como un registro
disperso `Partial<Record<SmcPadSoundId, Partial<PadSoundParams>>>`. Solo se persiste
lo que difiere de los defaults, que viven en `PAD_SOUND_DEFAULTS` en `playSmcPadHit.ts`.

Campos por sonido: `volume`, `decay`, `distortion`. Además `tune` (frecuencia Hz)
para kick, floor-tom, hi-tom, conga, sub; `length` (duración en segundos) para hat
y open-hat; `flicker` (LFO) para hat y open-hat.

**Botón de config**: cada pad card muestra un botón ⚙ en la esquina superior derecha
al hacer hover. Abre un modal con los parámetros relevantes para ese sonido específico.
Visible solo cuando la configuración NO está bloqueada.

**Candado**: botón 🔒/🔓 en la barra superior del sampler. Al bloquear, los botones
⚙ desaparecen y no se puede abrir la configuración por accidente durante una sesión
de grabación.

**Paginación**: el grid de 8 pads pasa a 16 sonidos organizados en dos páginas de 8.
Botones P1/P2 en la barra superior cambian la página activa. La página 1 mantiene
los 8 sonidos originales; la página 2 agrega: Open Hat, Crash, Ride, Floor Tom,
Hi Tom, Conga, Woodblock, Sub 808.

**8 nuevos sonidos (página 2)**:
- Open Hat: igual que hat cerrado pero con length default 0.3s y decay más largo
- Crash: impacto inicial + ruido highpass largo (1.4s) + 4 square waves de 6-15kHz
- Ride: campana de platillo (sine 2500Hz) + plato (noise highpass 7.5kHz)
- Floor Tom: sweep 65*4.5Hz → 65Hz, más grave que el tom normal
- Hi Tom: sweep 180*3.2Hz → 180Hz, más agudo que el tom normal
- Conga: sine sweep 320*1.8 → 320*0.85Hz + armónico secundario
- Woodblock: dos triángulos (800Hz + 1180Hz) + transient noise
- Sub 808: sine sweep tune*3 → tune (default 35Hz), cola larga (0.3+0.4*decay)

### Razon de la decision

Config global no tiene sentido cuando kick y hat tienen parámetros completamente
distintos. La arquitectura por-sonido permite afinar cada instrumento sin afectar
a los otros, es más cercana a cómo funcionan los drum machines reales (MPC, TR-808),
y es más escalable para plugins que registren sonidos propios.

### Archivos modificados

- src/engine/midi/events.ts - SmcPadSoundId y PadSoundParams como tipos exportados
- src/engine/project/projectModel.ts - padSoundSettings y padSettingsLocked en
  MusicalProject; updatePadSoundSetting reemplaza updatePadSynthSettings;
  parseImportedProject actualizado; isRecordedNote y normalizeTrackNotes con 16 IDs
- src/application/use-cases/playSmcPadHit.ts - PadSoundParams, PAD_SOUND_DEFAULTS,
  smcPadSounds con 16 entradas, 8 nuevas síntesis, función usa params por sonido
- src/application/use-cases/playRecordedNotes.ts - padSoundSettings reemplaza
  smcPadSettings en opciones; merge con PAD_SOUND_DEFAULTS por sonido en playback
- src/features/lab/LabApp.tsx - padPage y configSoundId states; grid usa smcPadSounds
  paginado; botones P1/P2 y candado en toolbar; botón ⚙ por pad; modal per-sonido
- src/app/styles/ui-library.css - .ui-smc-cell, .ui-smc-config-btn,
  .ui-pill-btn-active añadidos

---

## Movimiento — Reorden de instrumentos SMC Pad por UX (2026-05-16)

### Intencion

Cada página del pad grid debe poder tocarse como un kit completo sin necesidad
de cambiar de página. El orden anterior tenía Floor Tom en P1 y Crash en P2,
lo que rompía la experiencia: un beat básico necesita el crash pero estaba
escondido en la página de extensiones.

### Cambio aplicado

Archivo: `src/application/use-cases/playSmcPadHit.ts` — array `smcPadSounds`

**Página 1 — Kit estándar completo (tocable solo)**:

| Posición | Instrumento |
|----------|-------------|
| 1 | Kick |
| 2 | Snare |
| 3 | Hihat |
| 4 | Open Hat |
| 5 | Clap |
| 6 | Rimshot |
| 7 | Tom |
| 8 | Crash ← movido desde P2 |

**Página 2 — Kit extendido (también coherente solo)**:

| Posición | Instrumento |
|----------|-------------|
| 1 | Floor Tom ← movido desde P1 |
| 2 | Hi Tom |
| 3 | Ride |
| 4 | Sub 808 |
| 5 | Conga |
| 6 | Cencerro |
| 7 | Shaker |
| 8 | Woodblock |

### Decision tecnica

El swap es mínimo: solo 3 entradas reordenadas (floor-tom, hi-tom, crash).
No cambia ninguna síntesis ni ningún ID — los proyectos guardados no se ven
afectados porque los IDs de sonido permanecen iguales.

### Razon UX

Un usuario que no sabe que existe la página 2 puede tocar rock, pop y electrónica
básica con solo la P1. La P2 queda como kit extendido coherente: toms graves,
platillo alternativo, percusión latina y sonidos experimentales.

---

## Sesion 2026-05-16 - Segunda reescritura de síntesis: psicoacústica y TR-808

### Que se hizo

Tras la primera mejora de síntesis (transients y snap), se detectó que sonidos
cortos como hat, clap y shaker seguían sonando débiles. La causa es psicoacústica:
**los sonidos de duración muy corta necesitan un pico de amplitud mayor para
percibirse al mismo volumen que los sonidos largos** (integración temporal del oído).

Se aplicó una segunda reescritura enfocada en cuatro instrumentos problemáticos:

**Hat cerrado y Open Hat — frecuencias inarmónicas TR-808**:
Los hats reales del TR-808 usan 6 osciladores square a frecuencias no enteras entre
sí (razones no racionales crean el shimmer metálico). Se reemplazaron las frecuencias
genéricas por las 3 frecuencias principales del TR-808 original: **8372, 10548, 12544 Hz**.
El ruido base subió de 0.18v a 0.52v (volumen corregido por duración corta).
El Open Hat replica las mismas frecuencias con duraciones proporcionalmente más largas.

**Clap — patrón 4-burst estilo TR-808**:
El TR-808 genera el "crack" del clap con 4 pulsos de ruido a 0, 8, 22 y 44ms
(gaps progresivos que imitan los dedos cerrándose). Se reemplazaron los 3 bursts
anteriores por este patrón exacto. El filtro principal subió de 1500Hz a 1800Hz
(espectro real del clap). Se agregó una cola de reverb natural (bandpass 2400Hz,
200ms) para darle cuerpo sin reverb artificial.

**Rimshot — separación espectral correcta**:
El "crack" del rimshot vive en 2200Hz (aro de tambor real), no en frecuencias
genéricas. Se reescribió con: ruido bandpass 2200Hz a 0.82v como capa principal;
tonal 920Hz (sweep 1200→750Hz) para el cuerpo del aro; sub 240Hz muy breve para
la presencia del parche. El tono cambió de 1700Hz a 920Hz para sonar más natural.

**Shaker — corrección psicoacústica de volumen**:
El shaker sonaba casi inaudible por tener dos capas a volúmenes bajos (0.38v/0.22v)
y ataque demasiado suave. Se corrigió: ataque 0.0005s (casi instantáneo), volúmenes
0.55v/0.35v en el primer burst y 0.42v/0.25v en el segundo. Q del filtro bandpass
subió de 0.6 a 0.8 para dar más presencia sin añadir frecuencias indeseadas.

### Razon de la decision

El usuario comparó con un teclado de juguete que sonaba más convincente. La
diferencia real no era calidad de samples sino separación espectral y corrección
de volumen por duración. Las frecuencias del TR-808 son conocidas y documentadas;
usar los valores exactos elimina las aproximaciones genéricas que producen ese
sonido "blando" y sintético.

### Archivos modificados

- src/application/use-cases/playSmcPadHit.ts - síntesis reescrita para hat, open-hat,
  clap (4-burst + cola), rimshot (bandpass 2200Hz), shaker (volúmenes y ataque)

---

## Sesion 2026-05-16 - Rediseño de paginación y corrección del ícono de candado

### Que se hizo

**Paginación escalable**: los botones P1 / P2 en la toolbar se reemplazaron por un
control `◄ [n / total] ►` usando los íconos `ChevronLeft` y `ChevronRight` de Lucide
React. El número de páginas se calcula dinámicamente a partir de `smcPadSounds.length`.
Así, agregar más sonidos en el futuro solo requiere añadirlos al array — el paginador
se adapta solo sin tocar la UI.

El estado `padPage` pasó de tipo `0 | 1` a `number` para soportar cualquier número
de páginas.

**Candado Lucide**: el botón de bloqueo usaba emojis 🔒/🔓. Se reemplazó por los
íconos `Lock` / `Unlock` de Lucide React (mismo sistema que el resto del proyecto)
para mantener consistencia visual con los otros íconos de la toolbar.

### Razon de la decision

El diseño P1/P2 acopla la UI a exactamente 2 páginas. Cualquier instrumento nuevo
obligaría a crear P3, P4, etc. El control `◄ n/total ►` es el patrón estándar de
paginación en drum machines y samplers (MPC, Ableton), y es natural para el usuario
sin necesitar etiquetas explicativas. El emoji del candado rompía la coherencia visual
de la toolbar donde todos los íconos son del mismo sistema (Lucide).

### Archivos modificados

- src/features/lab/LabApp.tsx - estado padPage como number; toolbar con ChevronLeft /
  ChevronRight / Lock / Unlock de Lucide; cálculo dinámico de totalPages
- src/app/styles/ui-library.css - .ui-pad-pager y .ui-pad-pager-label añadidos

---

## Ajuste UI 2026-05-16 - Tamaño del botón de config y altura de pads

### Que se hizo

Dos correcciones visuales detectadas al comparar la vista Pad con la vista Piano:

**Botón de configuración más grande**: el botón ⚙ de cada pad tenía `1.4rem × 1.4rem`
con `font-size: 0.7rem`, resultando en un ícono apenas visible. Se aumentó a
`1.9rem × 1.9rem` con `font-size: 1rem` — suficiente para ser clicable cómodamente
sin invadir el espacio del pad.

**Altura de pads reducida**: los botones del pad tenían `min-height: 6.5rem` con
`padding: 0.8rem`. En comparación con las teclas del piano, los pads se veían
excesivamente altos y desproporcionados. Se redujo a `min-height: 4.8rem` con
`padding: 0.55rem` — más compactos y proporcionados al resto de la UI.

### Razon de la decision

Coherencia visual entre vistas: la app tiene una sola barra de herramientas y las
vistas deben sentirse como parte del mismo producto. Bloques de altura muy diferente
entre Piano y Pad rompen esa coherencia. El botón de config pequeño era difícil de
clicar en móvil y poco visible en desktop.

### Archivos modificados

- src/app/styles/ui-library.css - .ui-smc-config-btn: width/height 1.4→1.9rem,
  font-size 0.7→1rem; .ui-smc-btn: min-height 6.5→4.8rem, padding 0.8→0.55rem

---

## Sesion 2026-05-16 - Sampler de audio funcional: importación, waveform e IndexedDB

### Que se hizo

Se implementó la funcionalidad real del Sampler de audio (vista con ícono de
micrófono), que antes era una maqueta vacía sin ninguna lógica.

**Persistencia de samples**: los archivos de audio no se pueden guardar en
localStorage como JSON porque son datos binarios (ArrayBuffer). Se usó **IndexedDB**
como almacén de binarios. Los metadatos del slot (nombre, duración, sample rate,
canales) se guardan en localStorage bajo la clave `mimidi-audio-slots` como JSON.
Los buffers de audio se almacenan en IndexedDB `mimidi-samples`, keyed por un ID
único generado al importar.

**Importación de archivos**: el botón ⬆ activa un `<input type="file" accept="audio/*">`
oculto. El archivo se lee como ArrayBuffer, se decodifica con Web Audio API para
obtener los metadatos, y el buffer original se guarda en IndexedDB.

**Forma de onda**: al seleccionar un slot ocupado, se carga el buffer de IndexedDB,
se decodifica y se dibuja en un `<canvas>` usando `devicePixelRatio` para pantallas
retina. El algoritmo calcula min/max por bucket de muestras para cada píxel
horizontal y dibuja líneas verticales. Se redibuaja si el canvas cambia de tamaño
(ResizeObserver).

**Reproducción**: botón ▶/■ reproduce el buffer decodificado vía `playAudioBuffer`
que conecta al master gain del audioEngine compartido. Se auto-detiene al terminar.

**Nombre editable**: la toolbar muestra el nombre del slot seleccionado. Clic en el
nombre activa un input inline. Enter o blur confirma; Escape cancela.

**Eliminación**: botón 🗑 elimina el buffer de IndexedDB y limpia el slot en
localStorage.

### Arquitectura de persistencia

```
Metadatos (JSON) → localStorage["mimidi-audio-slots"]
Buffers (ArrayBuffer) → IndexedDB["mimidi-samples"]["buffers"]
```

La clave de IndexedDB es un ID único generado al importar (`sample-{timestamp}-{random}`).
Los metadatos en localStorage guardan ese ID para hacer el lookup. Si el IndexedDB
se limpia manualmente, los metadatos queden huérfanos (el slot aparece como vacío
en la siguiente carga).

### Limitaciones actuales

- Grabación desde micrófono no implementada (requiere getUserMedia + permisos)
- Los samples NO están integrados con el modelo de proyecto (`MusicalProject`) —
  viven en su propio localStorage key, independientes del proyecto activo

### Archivos creados/modificados

- src/engine/audio/sampleStorage.ts (nuevo) — IndexedDB wrapper: saveSampleBuffer,
  loadSampleBuffer, deleteSampleBuffer
- src/engine/audio/audioEngine.ts — funciones exportadas añadidas: decodeAudioData,
  playAudioBuffer
- src/features/audio-sampler/AudioSamplerScreen.tsx — reescritura completa con
  estado real, importación, waveform canvas, play/stop, nombre editable, eliminación
- src/features/audio-sampler/AudioSamplerScreen.css — añadidos: canvas, file input
  oculto, nombre editable en toolbar, estado filled del slot

---

## Sampler — Herramientas de calibración de audio (2026-05-16)

### Intención

Implementar los 5 controles esenciales para calibrar samples en el panel EDITOR
del sampler: Trim, Normalize, Gain, Fade In/Out y Tune.

### Decisión técnica

**SampleCalibration** — nuevo tipo `AudioCalibration` (exportado desde audioEngine.ts)
con campos: trimStart, trimEnd (fracciones 0–1), gain (0–2), fadeIn, fadeOut (segundos),
tune (semitones –24..+24). Se guarda en cada `SampleSlotMeta.calibration` en localStorage.
Al cargar slots existentes (sin campo calibration) se aplica `DEFAULT_CALIBRATION` como
fallback para retrocompatibilidad.

**Trim visual** — el canvas acepta `onMouseDown/Move/Up/Leave`. El handle más cercano al
cursor (start o end) se asigna en `mouseDown`. Al mover se recalcula la fracción y se llama
a `updateCalibration` en cada frame, lo que redibuja el waveform con la nueva región oscurecida
y las líneas de handle en acento. Se usa `dragTrimRef` (ref, no estado) para no causar
re-renders durante el drag.

**drawWaveformWithTrim** — reemplaza `drawWaveform`. Dibuja barras con opacidad alta
dentro del trim y baja fuera. Superpone overlay oscuro fuera de la región trim. Dibuja
líneas verticales y triángulos de dirección en los handles.

**playAudioBufferCalibrated** — nueva función en audioEngine.ts. Usa `source.start(when, offset,
duration)` para el trim, `playbackRate = 2^(tune/12)` para el tune, y una envolvente ADSR
simplificada (setValueAtTime + linearRampToValueAtTime) para fade in/out.

**Barra de calibración** — panel `.audio-sampler-cal-bar` debajo del waveform (solo visible
cuando hay audio). Contiene: info del trim (timestamps), botón NORM, slider GAIN (0–200%),
sliders FADE IN / FADE OUT (0–2s, máx 50% de duración), botones ± TUNE con valor en semitones.

### Archivos modificados

- src/engine/audio/audioEngine.ts — export `AudioCalibration`, `playAudioBufferCalibrated`
- src/features/audio-sampler/AudioSamplerScreen.tsx — `SampleCalibration` en `SampleSlotMeta`,
  `DEFAULT_CALIBRATION`, `updateCalibration()`, `handleNormalize()`, handlers canvas drag,
  `drawWaveformWithTrim`, panel editor con barra de calibración completa
- src/features/audio-sampler/AudioSamplerScreen.css — `.audio-sampler-cal-bar`, grupos,
  sliders, botones NORM y step, separadores, cursor ew-resize en canvas

### Validación

TypeScript compila sin errores (`tsc --noEmit`). Flujo: importar audio → waveform visible →
arrastrar handles de trim → sliders ajustan gain/fades → botones ± cambian afinación →
Play usa todos los parámetros vía `playAudioBufferCalibrated`.

---

## Sampler — Refactor de arquitectura (2026-05-16)

### Intención

El `AudioSamplerScreen.tsx` original mezclaba tipos de dominio, lógica de persistencia
y orquestación de audio en el mismo componente React, violando la Screaming Architecture
del proyecto. Se refactorizó para alinear el sampler con el mismo patrón que piano/pad.

### Decisión técnica

**`engine/audio/sampleModel.ts`** (nuevo) — capa engine:
- `SampleSlotMeta` (tipo del dominio de audio)
- `DEFAULT_CALIBRATION` (constante de dominio)
- `NUM_SLOTS` (constante de configuración)
- `loadSlotMetas()` / `saveSlotMetas()` — persistencia en localStorage

**`application/use-cases/playSampleBuffer.ts`** (nuevo) — capa use-case:
- `playSampleBuffer(buffer, calibration)` — envuelve `playAudioBufferCalibrated` del engine
- Sigue el mismo patrón que `playNote.ts` y `playSmcPadHit.ts`

**`AudioSamplerScreen.tsx`** — queda solo con:
- Estado React puro (UI): selectedIndex, isPlaying, isLoading, samplerView, isEditingName
- Canvas drawing (render de UI): `drawWaveformWithTrim`
- Event handlers que delegan a use-cases o engine
- JSX

### Flujo resultante

```
AudioSamplerScreen (UI)
  → playSampleBuffer.ts (use-case)
    → playAudioBufferCalibrated (engine/audio/audioEngine.ts)

AudioSamplerScreen (UI)
  → loadSlotMetas / saveSlotMetas (engine/audio/sampleModel.ts)
    → localStorage
```

### Archivos creados/modificados

- src/engine/audio/sampleModel.ts (nuevo)
- src/application/use-cases/playSampleBuffer.ts (nuevo)
- src/features/audio-sampler/AudioSamplerScreen.tsx — imports actualizados, código de dominio eliminado

---

## Sampler — UX completa, use-cases, exportación y pulido (2026-05-17, sábado)

### Qué se hizo

Sesión de trabajo completa sobre el sampler. Se completó la capa de use-cases,
se añadió calibración en tiempo real, exportación de audio, y se pulió toda la UX.

### Use-cases nuevos (capa application)

- **`importSampleFile.ts`** — lee un `File`, decodifica con Web Audio API, guarda
  binario en IndexedDB vía `sampleStorage.ts`, retorna metadata completa.
- **`loadSampleAudioBuffer.ts`** — carga un `AudioBuffer` desde IndexedDB por `dbId`.
- **`deleteSampleSlot.ts`** — elimina el binario de IndexedDB.
- **`exportSampleSlot.ts`** — renderiza offline el audio con toda la calibración aplicada
  (trim, gain, fades, tune) usando `OfflineAudioContext` y descarga como WAV 24-bit.

### Motor ampliado

`audioEngine.ts` — `playAudioBufferCalibrated` devuelve `SamplePlayback`:
- `stop()` — para reproducción
- `setGain(linear)` — actualiza gain en vivo con `setTargetAtTime`
- `setTune(semitones)` — actualiza playbackRate en vivo con `setTargetAtTime`
- `realDurationMs` — duración real considerando trim + playbackRate

Fix crítico de trim: se abandonó el tercer parámetro de `source.start(when, offset, duration)`
(comportamiento no confiable) y se usa `source.stop(endTime)` con
`endTime = now + bufferDuration / playbackRate` para corte exacto.

### Layout del editor

Panel de calibración separado del waveform: columna derecha (flex 1/3) con
controles verticales. Waveform ocupa 2/3 del ancho. Playhead animado con
`requestAnimationFrame` moviendo un `div` absoluto sobre el canvas.

### Controles de calibración

| Control | Implementación |
|---------|----------------|
| GAIN | Slider 0–200% + ícono Gauge (normalizar al pico) |
| FADE IN | Slider 0–min(2s, duración×0.5) |
| FADE OUT | Slider igual que fade in |
| TUNE | Slider −24 a +24 semitonos con hints −24/0/+24 |

GAIN row: slider ocupa todo el ancho disponible (`flex: 1 1 0%`), botón NORM
tiene ancho de contenido (`flex: 0 0 auto`), icono Gauge 18px, border-radius 0.35rem.

### Toolbar reestructurada

Orden de tabs cambiado a: **MUESTRAS → EDITOR → SECUENCIADOR**

Visibilidad de botones por vista:
- Importar (Upload): solo en **MUESTRAS**
- Descargar (Download): solo en **EDITOR**
- Play, Delete: siempre visibles

Navegador de slots: `◄ N nombre ►` — solo navega entre slots ocupados, modulo circular.
Renombrar solo disponible en MUESTRAS con doble clic inline.

TRIM display en toolbar solo en EDITOR con audio cargado.

### Modal de opciones

Por cada slot ocupado: Duración, Trim, Gain, Fade In/Out, Tune, botón Reset individual.
En sección RESUMEN: botón "Reset todo" que restablece calibración de todos los slots a `DEFAULT_CALIBRATION`.

### Archivos creados/modificados

- `src/application/use-cases/importSampleFile.ts` (nuevo)
- `src/application/use-cases/loadSampleAudioBuffer.ts` (nuevo)
- `src/application/use-cases/deleteSampleSlot.ts` (nuevo)
- `src/application/use-cases/exportSampleSlot.ts` (nuevo)
- `src/engine/audio/sampleStorage.ts` (nuevo — IndexedDB para binarios de audio)
- `src/engine/audio/audioEngine.ts` — `SamplePlayback`, fix trim, live gain/tune
- `src/features/audio-sampler/AudioSamplerScreen.tsx` — UX completa
- `src/features/audio-sampler/AudioSamplerScreen.css` — layout editor, cal panel, playhead, toolbar

### Validación

TypeScript sin errores (`tsc --noEmit`). Flujo validado manualmente:
importar audio → waveform → trim por drag → calibración → play con parámetros en vivo → exportar WAV.

---

## Sesion 2026-05-17 - Refactor timeline unificado: MidiTrack | SamplerTrack + tests verdes

### Que se hizo

Se reemplazó la estructura de proyecto anterior (`MusicalProject.tracks + samplerMixes`)
por una lista unificada `MusicalProject.timeline: TimelineTrack[]` usando una unión
discriminada. El objetivo fue eliminar las dos listas paralelas y unificar el modelo de
datos para que piano/MIDI y sampler/pad convivan en un solo arreglo temporal con tipos
seguros en TypeScript.

Al mismo tiempo se corrigieron 11 tests de integración en `App.integration.test.tsx`
que llevaban fallando desde antes del refactor (commit `a35e7a2`).

### Arquitectura nueva

Unión discriminada en `src/engine/project/projectModel.ts`:

```ts
export type MidiTrack = {
  kind: "midi"
  envelope: ADSREnvelope
  id: string
  instrumentId: MathematicalInstrumentId
  muted: boolean
  name: string
  noteTimelineDuration: number
  notes: MidiRecordedNote[]
  pan: number
  solo: boolean
  startTime: number
  trackType: ProjectTrackType
  volumeAutomation: TrackVolumeAutomation
  volume: number
}

export type SamplerTrack = {
  kind: "sampler"
  id: string
  name: string
  startTime: number
  pattern: SequencerPattern
}

export type TimelineTrack = MidiTrack | SamplerTrack

export type MusicalProject = {
  id: string
  name: string
  padSoundSettings: ...
  padSettingsLocked: boolean
  pluginStates: MiMIDIPluginStateMap
  timeline: TimelineTrack[]
  trackTimelineDuration: number
}
```

Type guards y helpers exportados:
- `isMidiTrack(t)` — type guard para MidiTrack
- `isSamplerTrack(t)` — type guard para SamplerTrack
- `getMidiTracks(timeline)` — filtra MidiTrack[]
- `getSamplerTracks(timeline)` — filtra SamplerTrack[]

Alias de retrocompatibilidad para código no migrado aún:
- `export type ProjectTrack = MidiTrack`
- `export type SamplerMixTrack = SamplerTrack`

Migración en `parseImportedProject`: acepta ambos formatos. Proyectos viejos con
`tracks[]` + `timelineClip.startTime` se normalizan a `timeline[]`. Proyectos nuevos
con `timeline[]` se cargan directamente.

### Correcciones de tests

Los 11 tests fallaban porque la UI había cambiado pero los tests seguían buscando
elementos del laboratorio antiguo. Causas y fixes:

| Test | Causa del fallo | Fix |
|------|----------------|-----|
| 1. Historial | "Historial: N" no se renderizaba | Añadir `historyCount` prop a LabProjectPanel y mostrarlo en project-summary |
| 2. Cambiar pista desde timeline | TrackTimelinePreview solo se monta en pestaña TRACKS | Añadir `fireEvent.click(getByRole("button", { name: "TRACKS" }))` antes del click |
| 3. No grabar sin grabacion | "Toca y suelta una tecla." ya no existe en DOM | Cambiar assert a `within(projectSummary).getByText("0")` (noteCount) |
| 4. Punto cero de toma | Arrastre de clip en vista TRACKS requiere abrir esa pestaña | Añadir navegación a TRACKS antes del drag |
| 5. Duracion manual track timeline | "16.0s" no visible fuera de TrackTimelinePreview | Añadir `{projectTrackTimelineDuration.toFixed(1)}s` span en LabProjectPanel |
| 6. Duracion manual note timeline | Label "Duracion timeline notas (s)" no existía | Añadir sección completa de note timeline en LabProjectPanel |
| 7. Reset note timeline | Botón "Ajustar notas al contenido" no existía | Añadir botón en la nueva sección de note timeline |
| 8. Compactar inicio | Botón gateado por `mode === "edit-only"` | Quitar esa condición para exponer el botón en modo full |
| 9. Vista Perform en /lab | Botón buscado como "Perform"; label real es "Piano" | Cambiar `getByRole("button", { name: "Perform" })` → "Piano" |
| 10. Vista Project en ruta raiz | ProjectWorkspace sin `aria-label` | Añadir `<section aria-label="Workspace Project">` en ProjectWorkspace |
| 11. Modo del piano duplicado | `aria-label="Modo del piano"` en dos componentes | Renombrar LabSoundControls a `"Modo de interaccion del piano"` |

### Archivos modificados

Refactor de modelo y consumidores:
- `src/engine/project/projectModel.ts` — tipos nuevos, type guards, migración
- `src/features/timeline/TrackTimelinePreview.tsx` — props `timeline: TimelineTrack[]` en vez de dos listas
- `src/features/lab/LabApp.tsx` — usa `project.timeline`, `getMidiTracks`, `getSamplerTracks`
- `src/application/use-cases/playRecordedNotes.ts` — `getMidiTracks(project.timeline)`
- `src/features/transport/usePlaybackTransport.ts` — `getMidiTracks(project.timeline)`
- `src/engine/audio/offlineAudioRenderer.ts` — `getMidiTracks(project.timeline)`
- `src/features/audio-sampler/AudioSamplerScreen.tsx` — `getSamplerTracks(project.timeline)`

UI para fixes de tests:
- `src/features/lab/LabProjectPanel.tsx` — historyCount, noteTimelineDuration, nueva sección note timeline
- `src/features/lab/LabSoundControls.tsx` — aria-label renombrado
- `src/features/project-view/ProjectWorkspace.tsx` — wrapper con aria-label

Tests actualizados:
- `src/App.integration.test.tsx` — 6 de los 11 tests corregidos en el lado del test

### Commit

`f5d9712 refactor: timeline unificado MidiTrack/SamplerTrack + tests verdes`
17 archivos, 2097 inserciones, 811 eliminaciones.

### Validación

- `npm run test` — 24/24 tests pasan (3 suites)
- `tsc --noEmit` — sin errores TypeScript

### Limitacion conocida

`src/engine/audio/audioEngine.ts` tiene funciones del sampler de audio
(`getAudioCurrentTime`, `playAudioBufferCalibrated`, helpers de calibración)
añadidas en la sesión anterior que quedaron sin commitear porque el foco de
esta sesión fue el refactor de timeline. Se commitearán junto a la documentación.

---

## Sesión 2026-05-17 — Fixes de UX, lint y bundle .mimidi

### Contexto

Sesión de revisión y mejoras tras el refactor de timeline unificado. Se corrigieron
errores de lint, se mejoraron comportamientos de UX y se implementó el formato de
proyecto `.mimidi` (ZIP con audio incluido).

### Cambios realizados

#### 1. Fixes de lint en `src/` (commits 4e199c5, e32f589)

Errores corregidos en `LabApp.tsx`, `AudioSamplerScreen.tsx`, `TrackTimelinePreview.tsx`
y `playSamplerMixes.ts`:

| Archivo | Problema | Solución |
|---|---|---|
| `LabApp.tsx` | `isTimelineDragging` valor no leído | `const [, setIsTimelineDragging]` |
| `LabApp.tsx` | `redoStack` no usado | Eliminado del destructuring |
| `LabApp.tsx` | `shortcutHint` useMemo no usado | Eliminado el bloque |
| `LabApp.tsx` | Bloque `if (false)` muerto (~136 líneas) | Eliminado |
| `LabApp.tsx` | `setTimelineView/setActiveTrackId/setAbsolutePlayheadTime` en effect | `eslint-disable-next-line` |
| `LabApp.tsx` | `onRemoveSamplerMix` prop ya no existe | Eliminado del JSX |
| `AudioSamplerScreen.tsx` | `seqTickRef.current` asignado en render | Movido a `useEffect()` sin deps |
| `AudioSamplerScreen.tsx` | `slotsRef.current` asignado en render | Movido a `useEffect([slots])` |
| `AudioSamplerScreen.tsx` | `setDecodedBuffer(null)` en effect | `eslint-disable-next-line` |
| `AudioSamplerScreen.tsx` | `createDefaultPattern`, `SEQ_SECONDS`, `renamingSlotIndex` no usados | Eliminados |
| `TrackTimelinePreview.tsx` | `isMidiTrack` import no usado | Eliminado |
| `playSamplerMixes.ts` | `sources: AudioBufferSourceNode[]` declarado pero vacío | Eliminado |

El lint de `src/` pasa sin errores. Los 3 problemas restantes están en
`apps/mimidi-expo/` (app Expo congelada, no se toca).

#### 2. Fix: botón "Reiniciar proyecto" no abría el diálogo

`onRestartProject` en `LabApp.tsx` llamaba directamente a `restartProject()` sin
pasar por `setIsRestartConfirmOpen(true)`. Corregido.

#### 3. Fix: eliminar el último pad no regeneraba Pad 1

`removeActiveTrack()` solo recreaba un track melódico vacío al borrar el último
MIDI track. Ahora detecta si el track eliminado es de percusión y usa `appendPadTrack()`
para regenerar un "Pad 1" — paridad con el comportamiento de tracks melódicos.

```ts
const isLastPercussionTrack = isPercussion && percussionTracks.length === 1
if (isLastPercussionTrack) return appendPadTrack(withoutTrack)
```

#### 4. Feat: ocultar pistas vacías en el timeline

`TrackTimelinePreview.tsx` ahora filtra antes de renderizar:

```ts
const midiTracks = getMidiTracks(timeline).filter((t) => t.notes.length > 0)
const samplerTracks = getSamplerTracks(timeline).filter((t) =>
  t.pattern.lanes.some((l) => l.steps.some((s) => s.active)),
)
```

Cuando todo está vacío aparece: *"Graba notas o activa pasos en el secuenciador
para ver las pistas aquí."*

#### 5. Feat: botón "Nuevo proyecto" en vista de proyecto

Botón en `projectWorkspace` que abre un modal con tres opciones:
- **Guardar y continuar** — exporta JSON luego reinicia
- **Continuar sin guardar** — reinicia directo
- **Cancelar** — cierra sin acción

Estado: `isNewProjectConfirmOpen`.

#### 6. Feat: formato .mimidi — bundle ZIP con muestras de audio

**Motivación:** el JSON de proyecto no incluía los audios del sampler (vivían en
IndexedDB separado). Al importar en otro dispositivo los slots aparecían vacíos.

**Solución:** formato `.mimidi` — un ZIP que contiene:

```
proyecto.mimidi
├── project.json    — MusicalProject (mismo formato que el JSON anterior)
├── slots.json      — SampleSlotMeta[] (metadatos de slots del sampler)
└── samples/
    ├── [dbId1]     — ArrayBuffer crudo del audio (formato original del usuario)
    └── [dbId2]     — ...
```

**Dependencia añadida:** `fflate` (MIT, ~10KB gzip, sin restricciones de uso comercial).
ZIP sin compresión (`level: 0`) porque el audio ya está comprimido.

**Nuevos archivos:**
- `src/application/use-cases/exportProjectBundle.ts`
- `src/application/use-cases/importProjectBundle.ts`

**Cambios en `LabApp.tsx`:**
- Ref `importBundleRef` para el file input de `.mimidi`
- Función `exportBundle()` — empaqueta y descarga
- Función `importBundle()` — desempaqueta, restaura slots en localStorage e IndexedDB, carga proyecto
- Botones primarios **"Guardar .mimidi"** / **"Abrir .mimidi"** en `projectWorkspace`
- Botones secundarios "Exportar JSON" / "Importar JSON" se conservan para compatibilidad

**Flujo de importación:**
1. Unzip con fflate
2. `parseImportedProject(project.json)` → estado React
3. `saveSlotMetas(slots.json)` → localStorage
4. `saveSampleBuffer(dbId, data)` por cada archivo en `samples/` → IndexedDB
5. `replaceState(project)` + reset de UI

### Archivos modificados

| Archivo | Tipo |
|---|---|
| `src/features/lab/LabApp.tsx` | Modificado (todos los fixes + nuevas funciones) |
| `src/features/timeline/TrackTimelinePreview.tsx` | Modificado (filtrado vacíos) |
| `src/application/use-cases/exportProjectBundle.ts` | Nuevo |
| `src/application/use-cases/importProjectBundle.ts` | Nuevo |

### Validación

- `tsc --noEmit` — sin errores
- `npm run lint src/` — sin errores (0 warnings en src/)
- Pruebas manuales pendientes: flujo completo export/import .mimidi entre sesiones


---

## Sesión 2026-05-19 — Multi-clip, toolbar contextual, playhead global y mute por pista

### Contexto

Sesión de continuación de funcionalidades del timeline por pistas. Se hicieron cambios grandes sin commits intermedios; todos los cambios viven en la rama actual no publicada.

---

### 1. Refactor: modelo multi-clip (MidiTrack / SamplerTrack)

**Antes:** `MidiTrack.notes: MidiRecordedNote[]` — todas las notas en un array plano.

**Ahora:** `MidiTrack.clips: MidiClip[]` donde:

```ts
type MidiClip = {
  id: string
  notes: MidiRecordedNote[]
  startTime: number     // posición en la timeline en segundos
}
```

Para samplers: `SamplerTrack.clips: SamplerClip[]` donde:

```ts
type SamplerClip = {
  id: string
  startTime: number
}
// La duración se deriva del patrón (stepsPerBar × BPM)
```

**Funciones nuevas/actualizadas en `projectModel.ts`:**

```ts
getMidiTrackNotes(track)         // flatten de todos los clips → MidiRecordedNote[]
getMidiClipDuration(clip)        // tiempo del último note.startTime + note.duration
getSamplerTrackDuration(mix)     // (stepsPerBar / bpm) * 60 * 4
duplicateMidiClip(project, trackId, clipId)
duplicateSamplerClip(project, mixId, clipId)
updateMidiClipStartTime(...)
updateSamplerClipStartTime(...)
```

**Migración backward-compatible:** `parseImportedProject` detecta el formato antiguo (array `notes` plano) y lo envuelve en un clip automáticamente.

**Bug crítico derivado:** `usePlaybackTransport.ts` tenía `track.notes.length === 0` como guard — la propiedad `notes` dejó de existir. El TypeError callaba silenciosamente todas las pistas MIDI mientras el sampler (que iniciaba antes) seguía sonando. Fix: `getMidiTrackNotes(track).length === 0`.

---

### 2. Feat: toolbar contextual al seleccionar fila en Tracks

**Estado `isTrackLaneFocused`** — se activa cuando el usuario hace click en una fila del timeline.

**Cuando está activo (fila seleccionada):**
- Se ocultan: Solo, Duration (±), Undo, Redo
- Aparecen: **Mute** (VolumeX), **Dup** (Copy), **Trash** (borrar clip seleccionado), **Check** (salir del modo edición)

**Check** limpia `selectedClipId`, `selectedMixId` e `isTrackLaneFocused` juntos.

**Mute en toolbar:** actúa sobre la fila activa:
- Si hay `selectedMixId` → silencia ese SamplerTrack
- Si no → silencia el `primaryTrack` MIDI

```tsx
// bloque en LabApp toolbar
{timelineView === "tracks" && isTrackLaneFocused && (() => {
  const activeMix = selectedMixId ? getSamplerTracks(...).find(...) : null
  const isMuted = activeMix ? activeMix.muted : primaryTrack.muted
  return (
    <>
      <button className={`ui-icon-btn edit-mute-solo-btn${isMuted ? " edit-mute-solo-btn-active" : ""}`}
        onClick={() => activeMix
          ? applyUpdate(p => updateSamplerTrackMuted(p, activeMix.id, !activeMix.muted))
          : togglePrimaryTrackMuted()}>
        <VolumeX size={18} />
      </button>
      <button disabled={dupDisabled} onClick={...}><Copy /></button>
      <button disabled={!canDeleteSelectedClip} onClick={() => setIsClipDeleteConfirmOpen(true)}><Trash2 /></button>
      <button onClick={exitTrackLaneFocus}><Check /></button>
    </>
  )
})()}
```

---

### 3. Feat: selección de clips por click

`onPointerDown` en cada clip inicia el drag. Si el puntero no se movió al soltar (`!hasMoved`), se llama `onSelectClip?.({ trackId, clipId, type })` en lugar de commitear el drag.

```ts
const stopDragging = () => {
  if (hasMoved) onUpdateMidiClipStartTime(track.id, clip.id, latestStart, "commit")
  else onSelectClip?.({ trackId: track.id, clipId: clip.id, type: "midi" })
  ...
}
```

Estado `selectedClipId: { trackId, clipId } | null` en LabApp.

**CSS — clip seleccionado:**
```css
.track-timeline-clip-selected {
  border-color: rgba(255, 255, 255, 0.7) !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}
```

---

### 4. Feat: playhead global sobre todos los tracks

**Problema:** el playhead anterior era una línea por cada lane (`.timeline-playhead`), no alineada entre pistas.

**Solución:** overlay `position: absolute` sobre `.track-timeline-lanes` con el mismo `grid-template-columns` que los lanes:

```css
.track-timeline-playhead-overlay {
  position: absolute; inset: 0;
  display: grid;
  grid-template-columns: minmax(11rem, 14rem) minmax(0, 1fr);
  grid-template-rows: 1fr;   /* crítico: sin esto height = 0 */
  gap: 0.85rem;
  pointer-events: none;
  z-index: 8;
}
```

La columna meta es un spacer vacío; la columna track contiene el playhead relativo:

```tsx
<div className="track-timeline-playhead-overlay">
  <div className="track-timeline-playhead-overlay-meta" />
  <div className="track-timeline-playhead-overlay-track">
    <div className="track-timeline-global-playhead"
      style={{ left: `${Math.min(Math.max(playheadTime / timelineLength, 0), 1) * 100}%` }} />
  </div>
</div>
```

Se eliminaron los playheads individuales por lane (`.timeline-playhead`).

**Clips activos:** clase `track-timeline-clip-playing` cuando `playheadTime` cae dentro del rango del clip:

```css
.track-timeline-clip-playing {
  border-color: rgba(255, 220, 100, 0.7) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 220, 100, 0.3);
}
```

---

### 5. Feat: mute por pista (backend)

**`SamplerTrack`** ahora tiene `muted: boolean` (default `false`).

```ts
export function updateSamplerTrackMuted(
  project: MusicalProject,
  trackId: string,
  muted: boolean,
): MusicalProject {
  return { ...project, timeline: project.timeline.map((t) =>
    t.kind === "sampler" && t.id === trackId ? { ...t, muted } : t) }
}
```

`playSamplerMixes` verifica antes de reproducir:
```ts
if (mix.muted) continue
```

Las pistas MIDI ya usaban `isTrackAudible` en `usePlaybackTransport`.

**Visual de lane silenciado:**
```css
.track-timeline-lane-muted .track-timeline-track { opacity: 0.35; }
.track-timeline-badge-muted { background: rgba(255,180,50,0.15); color: #ffb432; }
```

---

### Archivos modificados

| Archivo | Tipo |
|---|---|
| `src/features/lab/LabApp.tsx` | Modificado — toolbar contextual, estados, handlers |
| `src/features/timeline/TrackTimelinePreview.tsx` | Modificado — multi-clip, playhead global, selección |
| `src/features/timeline/TrackTimelinePreview.css` | Modificado — nuevas clases playhead/clip/mute |
| `src/engine/project/projectModel.ts` | Modificado — tipos MidiClip/SamplerClip, nuevas funciones |
| `src/application/use-cases/playSamplerMixes.ts` | Modificado — check muted |
| `src/application/use-cases/usePlaybackTransport.ts` | Fix — getMidiTrackNotes en vez de track.notes |

### Validación

- `tsc --noEmit` — sin errores al finalizar sesión
- Sin commits publicados aún — cambios en rama local

## Movimiento — Export WAV incluye mixes de sampler (2026-05-20)

Fecha: 2026-05-20

### Intención

El export a WAV ignoraba completamente los mixes del secuenciador (SamplerTrack). Solo
procesaba notas MIDI con síntesis matemática. El usuario lo detectó al exportar y no
escuchar los mixes.

### Causa raíz

`offlineAudioRenderer.ts` usa `OfflineAudioContext` — renderizado matemático síncrono.
Los mixes usan samples reales cargados de IndexedDB (async). Nunca se había implementado
la carga y scheduling de esos buffers en el contexto offline.

### Solución técnica

**`src/engine/audio/offlineAudioRenderer.ts`**

1. **`getProjectRenderDuration`**: actualizado para también considerar la duración total de
   los mixes (`clip.startTime + getSamplerTrackDuration(track)`), garantizando que el
   OfflineAudioContext tenga espacio suficiente para el audio de mixes.

2. **`scheduleOfflineSamplerSample`**: nueva función interna que replica la lógica de
   `playAudioBufferCalibratedAt` (calibración: trimStart, trimEnd, tune, gain, fadeIn,
   fadeOut) pero usando nodos del `OfflineAudioContext`.

3. **`scheduleSamplerMixesOffline`**: nueva función async que:
   - Lee `loadSlotMetas()` (localStorage) para obtener metadatos y calibración por slot
   - Para cada SamplerTrack no muteado, carga el buffer desde IndexedDB con `loadSampleBuffer`
   - Decodifica con `ctx.decodeAudioData()` (del OfflineAudioContext, no el principal)
   - Cachea buffers ya cargados para no releer el mismo sample varias veces
   - Calcula `when = clip.startTime + stepIndex * secondsPerStep` y llama
     `scheduleOfflineSamplerSample`

4. **`renderProjectOffline`**: agrega `await scheduleSamplerMixesOffline(...)` antes de
   `startRendering()`.

### Archivos modificados

| Archivo | Tipo |
|---|---|
| `src/engine/audio/offlineAudioRenderer.ts` | Modificado — soporte mixes + todos los pad sounds en export WAV |

### Validación

- `tsc --noEmit` — sin errores
- Lógica espejada con `playSamplerMixes.ts` para consistencia de timing y calibración
- Export JSON sigue guardando mixes completos (sin cambio)

### Nota adicional — pad sounds incompletos → completados con filtros y sweeps

Al implementar el soporte de mixes, se descubrió que `scheduleOfflineSmcPadEvent` solo
tenía casos para 4 sonidos (kick, snare, hat, clap) de los 16 disponibles en `playSmcPadHit`,
y además los existentes carecían de filtros y sweeps (sonaban "raros" en el WAV exportado).

**Segunda iteración — síntesis offline completa:**

1. **`scheduleOfflineNoiseBurst`**: se le agregó `filter?: { type, frequency, Q }`.
   Cuando se especifica, inserta un `BiquadFilterNode` entre el gain y el pan.
   Sin filtro, el noise es ruido blanco crudo que suena a estática.

2. **`scheduleOfflineFrequencyBurst`**: se le agregó `sweep?: { from, duration }`.
   Cuando se especifica, anima la frecuencia del oscilador con `linearRampToValueAtTime`,
   replicando el barrido de frecuencia que da "punch" al kick y forma a los toms.

3. **Todos los 16 pad sounds** actualizados con filtros y sweeps apropiados:
   - Hat / open-hat → highpass 7000 Hz (elimina graves del noise, solo shimmer)
   - Snare → highpass 4200 Hz + bandpass 260 Hz + sweep tonal (200→180 Hz)
   - Kick → sweep 200 Hz → 42 Hz + bandpass 1400 Hz de ataque
   - Tom / floor-tom / hi-tom → sweep tonal proporcional + bandpass de membrana
   - Rimshot → bandpass 2200 Hz + sweep 1200→920 Hz
   - Crash → highpass 4500 Hz (evita que ahogue el mix con graves)
   - Shaker → bandpass 5000 Hz + highpass 7500 Hz en dos capas
   - Ride → sweep 2700→2500 Hz + highpass 7500 Hz
   - Sub → sweep 105→35 Hz + bandpass de transiente
   - Conga, woodblock, cowbell → parámetros proporcionales al real-time

## Movimiento — Rediseño de la vista de proyecto (2026-05-22)

Fecha: 2026-05-22

### Intención

La vista "Proyecto" dentro del modo app (`/?view=project`) usaba clases visuales
del laboratorio interno y destonaba con el resto de vistas del app shell. El
usuario detectó el contraste visual e indicó que la vista debía ser coherente con
el sistema de diseño existente.

### Causa raíz

La vista de proyecto era un bloque de botones planos con estilos ad-hoc del
laboratorio. Las clases CSS usaban variables locales del `audio-lab` en lugar de
los tokens compartidos de `ui-library.css` (`--ui-color-*`, `--ui-btn-bg`, etc.).
Además, el input de nombre tenía un bug de especificidad: la regla `input[type="text"]`
de `App.css` (especificidad 0,1,1) sobreescribía `.project-compact-name-input`
(especificidad 0,1,0), forzando el fondo oscuro del lab sobre el input en contexto claro.

### Solución técnica

**`src/features/lab/LabApp.tsx` — JSX del `projectWorkspace`:**

- Input de nombre envuelto en fila `project-compact-name-row` con label semántico
  (`<label htmlFor="project-view-name">`) y clase `project-compact-label`.
- Se añadió párrafo de estadísticas (`project-compact-stats`): cantidad de pistas
  MIDI, cantidad de mixes de sampler y total de notas grabadas.
- Separador visual (`project-compact-divider`) antes de la grilla de botones.
- Botones organizados en grid (`project-compact-grid`) de dos columnas.
- Condición de deshabilitado del export WAV corregida para incluir pistas del
  sampler: `(allRecordedNotes.length === 0 && getSamplerTracks(project.timeline).length === 0) || isExportingAudio`.

**`src/app/styles/appModeCatalog.css` — clases de proyecto:**

- Fix de especificidad: `input.project-compact-name-input` (0,2,0) supera la regla
  global. Fondo, borde y color vinculados a tokens del sistema (`--ui-color-surface-raised`,
  `--ui-color-border`, `--ui-color-text`). Focus ring con `--ui-color-accent`.
- `.project-compact-label`: etiqueta uppercase, muted, 0.68rem — mismo patrón
  que los labels de settings.
- `.project-compact-stats`: texto secundario muted, 0.72rem — contexto del proyecto.
- `.project-compact-divider`: separador 1px con `--ui-color-border`.
- `.project-export-btn`: botón base con `--ui-btn-bg`, `--ui-btn-shadow`, radius
  y tipografía del sistema — coherente con la paleta del app shell.
- `.project-export-btn-play`: fondo oscuro (`--ui-color-text`) con texto blanco
  — acción primaria de reproducción.
- `.project-export-btn-primary`: acción WAV con superficie elevada y borde fuerte.
- `.project-export-btn-reset`: botón destructivo sin relleno, color muted.
- `.project-compact-btn-full`: span 2 columnas para el botón "Nuevo proyecto".

### Archivos modificados

| Archivo | Tipo |
|---|---|
| `src/features/lab/LabApp.tsx` | Modificado — JSX projectWorkspace, condición WAV, label/stats |
| `src/app/styles/appModeCatalog.css` | Modificado — especificidad input, nuevas clases proyecto |

### Validación

- `tsc --noEmit` — sin errores
- Vista coherente con tokens del sistema en modo claro y oscuro

## Movimiento — Refactor LabApp.tsx: extracción de hooks (2026-05-22)

Fecha: 2026-05-22

### Intención

`LabApp.tsx` había crecido a ~2919 líneas mezclando lógica de estado de proyecto,
reproducción, grabación y performance en un solo componente. El refactor extrae esa
lógica en tres hooks custom dedicados, dejando LabApp como coordinador JSX (~950 líneas).

### Estructura resultante

| Archivo | Responsabilidad |
|---|---|
| `useLabProject.ts` (~430 líneas) | Estado del proyecto, historial (undo/redo), mutaciones del modelo, import/export, atajos de teclado |
| `useLabPlayback.ts` (~110 líneas) | Transport (usePlaybackTransport), animación del playhead via RAF, reproducción de mixes del sampler |
| `useLabPerform.ts` (~250 líneas) | Volumen, octava, modo piano, arpegiador, eventos MIDI, pads SMC |
| `LabApp.tsx` (~950 líneas) | Coordinador JSX: llama a los tres hooks + useLabRecordingSession + useLabInstrumentCatalog |

### Problema de dependencias circulares y solución

`useLabProject` necesita callbacks de hooks que todavía no existen cuando se llama:
- `onStopPlayback` → viene de `labPlayback.stopAll`
- `onStopArpeggiator` → viene de `labPerform.stopArpeggiator`

Solución: refs actualizadas en cada render en LabApp antes de que se invoque cualquier callback:

```ts
const stopPlaybackRef = useRef<() => void>(() => {})
const stopArpeggiatorRef = useRef<(r?: boolean) => void>(() => {})
// ...hooks inicializados...
stopPlaybackRef.current = labPlayback.stopAll
stopArpeggiatorRef.current = labPerform.stopArpeggiator
```

Los closures dentro de `useLabProject` capturan la referencia al ref, no el valor — por eso siempre apuntan al valor actual cuando se ejecuta el callback.

Mismo patrón para `volumeRef`: el export WAV necesita el volumen real del slider
(que vive en `labPerform.volume`) pero `useLabProject` se inicializa antes. Se resuelve con
`getVolume: () => volumeRef.current` donde `volumeRef.current = labPerform.volume` se actualiza cada render.

### Tipos exportados que cambiaron de ubicación

- `ChordType` → antes en LabApp, ahora exportado desde `useLabPerform.ts`
- `LabAppMode` → antes en LabApp, ahora exportado desde `useLabProject.ts`

### Validación

- `tsc --noEmit` — sin errores
- `vite build` — 1813 módulos, 532 ms, sin warnings

## Movimiento — Eliminación de refs circulares: LabApp como host explícito (2026-05-22)

Fecha: 2026-05-22

### Intención

Tras el refactor anterior los hooks quedaban acoplados implícitamente a través de tres refs
(`stopPlaybackRef`, `stopArpeggiatorRef`, `volumeRef`) que vivían en LabApp como parche.
Este movimiento elimina esos refs y hace que LabApp sea el coordinador **explícito** de
secuencias que cruzan hooks — la base para que plugins futuros puedan integrarse de la
misma manera.

### Cambios

**`useLabProject`** — eliminadas de la firma: `onStopPlayback`, `onStopArpeggiator`,
`onResetRecordingSession`, `onClearMidiEvents`, `getVolume`.
- `switchActiveTrack` ya no llama `stopArpeggiator` internamente.
- `clearSession` y `restartProject` ya no llaman callbacks de otros hooks.
- `importBundle` e `importProjectFile` ídem.
- `exportProjectAudio(masterVolume: number)` recibe el volumen como parámetro explícito.

**`useLabRecordingSession`** — eliminadas de la firma: `onStopPlayback`, `onStopArpeggiator`.
- `startRecording` ya no frena la reproducción ni el arpegiador — esa coordinación sube a LabApp.

**`LabApp.tsx`** — sin refs de dependencias circulares. Coordinadores explícitos:

| Coordinador | Secuencia |
|---|---|
| `switchActiveTrack(id)` | stopArpeggiator → lab.switchActiveTrack |
| `startRecording()` | stopAll → stopArpeggiator → labRecording.startRecording |
| `tearDownSession()` | stopAll → stopArpeggiator → resetRecordingSession → clearMidiEvents |
| `handleClearSession()` | tearDownSession → lab.clearSession |
| `handleRestartProject()` | tearDownSession → lab.restartProject |
| `handleImportProjectFile(e)` | tearDownSession → lab.importProjectFile |
| `handleImportBundle(e)` | tearDownSession → lab.importBundle |
| `handleExportProjectAudio()` | lab.exportProjectAudio(labPerform.volume) |

### Por qué esto hace el proyecto más resiliente para plugins

Agregar un plugin nuevo ahora es predecible: se declara el hook del plugin, se llama en
LabApp (junto a los demás), y LabApp conecta sus inputs/outputs como coordinador.
Ningún hook del core necesita saber de la existencia del plugin.

### Validación

- `tsc --noEmit` — sin errores
- `vite build` — 1813 módulos, 257 ms, sin warnings

---

## Sesión 2026-05-22 — Corrección completa del modo oscuro en appModeCatalog.css

### Intención

El modo oscuro del modo app era incompleto: los tokens `--ui-color-*` de `ui-library.css`
sí respondían a `[data-ui-theme="dark"]`, pero los elementos contenedores principales
(`app-mode-window`, `app-mode-window-header`, `app-dialog`, `app-mock-toolbar`) tenían
fondos hardcodeados en blanco/gris claro que nunca cambiaban. El resultado era una ventana
principal con fondo blanco y controles de edición ilegibles sobre fondo oscuro.

### Causa raíz

`data-ui-theme="dark"` se aplica directamente sobre el elemento `section.app-mode-window`
(ver `AppMode.tsx` línea 171). Los backgrounds hardcodeados en ese elemento y sus
hijos no responden a ningún token — son valores literales como `rgb(248 248 248 / 0.94)`.

Además, los tokens `--app-color-*` (texto, superficie, borde) son inyectados por JS
(`getClassicAppThemeStyle()` en `AppShell.tsx`) con valores siempre claros. Al heredar
estos valores, todos los descendientes del nodo oscuro seguían viendo los colores del
tema claro.

### Solución técnica

Se agregó un bloque de overrides en `appModeCatalog.css` antes de los `@media`:

**1. Redefinición de tokens `--app-color-*` en el contexto oscuro:**
```css
[data-ui-theme="dark"] {
  --app-color-text-strong:       var(--ui-color-text);
  --app-color-text-muted:        var(--ui-color-text-muted);
  --app-color-border-soft:       var(--ui-color-border);
  --app-color-surface-paper:     var(--ui-color-surface-raised);
  --app-color-surface-paper-alt: var(--ui-color-surface-inset);
  --app-color-accent:            var(--ui-color-accent);
}
```
CSS custom properties pueden sobrescribir valores heredados en el elemento descendiente,
aunque el padre inyecte los valores via inline style.

**2. Override de la ventana principal (compound selector, sin espacio):**
```css
[data-ui-theme="dark"].app-mode-window { … }
```
El compound selector es necesario porque el atributo está en el mismo elemento que la clase.

**3. Overrides de elementos hijo (con espacio):**
- `app-mode-window-header` — borde + fondo
- `app-mock-toolbar` — borde + fondo semitransparente
- `app-surface-status` — borde + fondo + color
- `edit-view-switch > button[aria-pressed="true"]` — fondo blanco → superficie oscura
- `edit-note-input` — fondo blanco + borde oscuro
- `edit-settings-track-section` — borde superior
- `edit-mute-solo-btn-active` — inversión de contraste
- `app-dialog` — borde + fondo + sombra
- `app-dialog .ui-pill-btn-active` — inversión de contraste
- `app-dialog-confirm` — rojo oscuro → rojo claro legible (`#ff8080`)
- `app-shell-portrait-blocker` — fondo

### Archivos modificados

- `src/app/styles/appModeCatalog.css` — bloque `MODO OSCURO` antes del primer `@media`

### Validación

- Verificación visual pendiente en navegador

---

## Sesión 2026-05-22 — Implementación completa de multilenguaje español / inglés (i18n)

### Intención

Todas las cadenas de texto visibles al usuario en las 7 vistas del modo app
(`piano`, `edit`, `project`, `plugins`, `settings`, `sampler`, `pad`) debían
responder al idioma seleccionado (`es` / `en`). En sesiones anteriores el
catálogo de mensajes existía pero su cobertura era parcial: la mayoría de
componentes mostraba texto fijo en español incluso con `lang=en` activo.

El objetivo de esta sesión fue cerrar todos los huecos conocidos y dejar el
sistema de i18n funcionalmente completo para las vistas de usuario.

---

### Arquitectura del sistema de i18n

| Elemento | Rol |
|---|---|
| `src/i18n/es.ts` | Objeto `esMessages` — catálogo completo en español |
| `src/i18n/en.ts` | Objeto `enMessages` — catálogo completo en inglés |
| `src/app/appI18n.ts` | `resolveAppMessages(language)` — devuelve el objeto correcto |
| `AppLanguage` | Tipo `"es" \| "en"` |
| `tpl(template, vars)` | Helper de interpolación: `tpl("Delete {name}", { name })` |
| prop `language?: AppLanguage` | Se propaga desde `AppMode` hacia abajo por cada screen y workspace hasta `LabApp` |

El flujo de propagación completo es:

```
AppMode
  → resolveScreen()
    → <XxxScreen language={activeLanguage} />
      → <XxxWorkspace language={language} />
        → <LabApp language={language} />
          → t = resolveAppMessages(language ?? "es").lab
```

---

### Cambios en el catálogo de mensajes

**`src/i18n/en.ts`** y **`src/i18n/es.ts`** — ampliados en ~294 líneas cada uno.

Claves nuevas añadidas (inglés → español entre paréntesis):

| Sección | Clave | en | es |
|---|---|---|---|
| `appMode` | `enterFullscreen` | "Enter fullscreen" | "Pantalla completa" |
| `appMode` | `exitFullscreen` | "Exit fullscreen" | "Salir de pantalla completa" |
| `appMode` | `viewOptions` | "View options" | "Opciones de la vista" |
| `lab.common` | `volume` | "Volume" | "Volumen" |
| `lab.common` | `options` | "Options" | "Opciones" |
| `lab.common` | `resetDefaults` | "Reset to defaults" | "Restaurar valores" |
| `lab.toolbar` | `timelineWorkspace` | "Timeline workspace" | "Workspace de timeline" |
| `lab.toolbar` | `deleteSelectedNote` | "Delete selected note" | "Eliminar nota seleccionada" |
| `lab.toolbar` | `deleteNote` | "Delete note" | "Eliminar nota" |
| `lab.toolbar` | `compactNoteStart` | "Compact start" | "Compactar inicio" |
| `lab.toolbar` | `addPadTrack` | "+ Pad" | "+ Pad" |
| `lab.perform` | `instrumentDialogTitle` | "Instruments" | "Instrumentos" |
| `lab.perform` | `instrumentDialogDesc` | "Select the type and instrument." | "Selecciona el tipo y el instrumento." |
| `lab.perform` | `instrumentType` | "Type" | "Tipo" |
| `lab.perform` | `instrumentList` | "Instruments" | "Instrumentos" |
| `lab.perform` | `modeNote` | "NOTE" | "NOTA" |
| `lab.perform` | `modeChord` | "CHO" | "ACO" |
| `lab.perform` | `transportControls` | "Recording controls" | "Controles de grabación" |
| `lab.perform` | `stopRecording` | "Stop recording" | "Detener grabación" |
| `lab.perform` | `startRecording` | "Start recording" | "Iniciar grabación" |
| `lab.perform` | `stopPlayback` | "Stop playback" | "Detener reproducción" |
| `lab.perform` | `playRecording` | "Play recording" | "Reproducir grabación" |
| `lab.perform` | `arpLabel` | "Arpeggiator" | "Arpegiador" |
| `lab.perform` | `pianoMode` | "Piano mode" | "Modo del piano" |
| `lab.perform` | `previousTrack` | "Previous track" | "Pista anterior" |
| `lab.perform` | `nextTrack` | "Next track" | "Pista siguiente" |
| `lab.perform` | `removeActiveTrack` | "Delete active track" | "Eliminar pista activa" |
| `lab.perform` | `octaveControl` | "Active visible octave" | "Octava visible activa" |
| `lab.perform` | `octaveDown` | "Octave down" | "Bajar octava" |
| `lab.perform` | `octaveUp` | "Octave up" | "Subir octava" |
| `lab.perform` | `addTrack` | "+ Track" | "+ Pista" |
| `lab.perform` | `categoryBase` | "Base" | "Base" |
| `lab.perform` | `categoryAdvanced` | "Advanced" | "Avanzado" |
| `lab.perform` | `categoryBaseDesc` | "Includes core mathematical instruments…" | "Incluye instrumentos matemáticos base…" |
| `lab.perform` | `categoryAdvancedDesc` | "Includes modulation or more expressive…" | "Incluye modulación o comportamiento…" |
| `lab.pad` | `descriptions.*` | 16 IDs de pad | kick→"Golpe grave", snare→"Crack medio", etc. |
| `lab.project` | `disablePlugin` | "Disable {name}" | "Desactivar {name}" |
| `lab.project` | `pluginList` | "Plugin list" | "Lista de plugins" |
| `lab.project` | `pluginsSection` | "Plugins" | "Plugins" |
| `lab.sampler` | `screenLabel` | "Audio sampler" | "Sampler de audio" |
| `lab.sampler` | `stepLabel` | "Step" | "Paso" |
| `views.settings` | `optionsTitle` | "Options — Settings" | "Opciones — Ajustes" |
| `views.settings` | `optionsDesc` | "Additional configuration options." | "Opciones adicionales de configuración." |

**Traducciones de descripciones de pads** (`lab.pad.descriptions`):

```
kick → "Bass hit" / "Golpe grave"
snare → "Mid crack" / "Crack medio"
hat → "Bright spark" / "Chispa brillante"
open-hat → "Open hat" / "Hat abierto"
clap → "Three bursts" / "Tres ráfagas"
rimshot → "Rim strike" / "Golpe de aro"
tom → "Mid tonal hit" / "Golpe tonal medio"
crash → "Long cymbal" / "Platillo largo"
floor-tom → "Low tom" / "Tom grave"
hi-tom → "High tom" / "Tom agudo"
ride → "Cymbal bell" / "Campana de platillo"
sub → "Deep sub bass" / "Sub bajo profundo"
conga → "Tonal membrane" / "Membrana tonal"
cowbell → "Metal resonant" / "Metal resonante"
shaker → "Granular shake" / "Sacudida granular"
woodblock → "Wood click" / "Click de madera"
```

Las descripciones estaban hardcodeadas en el array `smcPadSounds` de
`playSmcPadHit.ts`. La solución no modifica ese archivo: `LabApp.tsx` usa
`t.pad.descriptions[pad.id] ?? pad.description` para preferir la traducción
del catálogo y caer al valor original si no existe.

---

### Componentes reescritos

#### `src/features/perform/components/PerformInstrumentDialog.tsx`

Aceptaba `language?: AppLanguage`. La lógica de categorías usaba funciones
del engine (`getInstrumentCategoryLabel`, `getInstrumentCategoryDescription`)
con strings en español. Se eliminó esa dependencia y se reemplazó por
funciones locales que leen `tp.categoryBase` / `tp.categoryAdvanced` /
`tp.categoryBaseDesc` / `tp.categoryAdvancedDesc`.

#### `src/features/perform/components/PerformResponsiveToolbar.tsx`

Acepta `language?: AppLanguage`. Todas las cadenas de transport, ARP toggle,
pills NOTE/CHO, octave control, track nav y add-track usan `tp.*` del catálogo.
Pasa `language` a `<PerformInstrumentDialog>`.

---

### Componentes actualizados con prop `language`

| Archivo | Cambio |
|---|---|
| `src/app/AppMode.tsx` | Pasa `language={activeLanguage}` a `<PluginsScreen>`; botones fullscreen y ⋮ usan `messages.appMode.*` |
| `src/features/plugins-view/PluginsScreen.tsx` | Acepta `language?: AppLanguage`; dialog title usa `\`${tc.options} — ${copy.label}\`` |
| `src/features/plugins-view/PluginsWorkspace.tsx` | Acepta y pasa `language` a `<LabApp>` |
| `src/features/settings-view/SettingsScreen.tsx` | `AppDialog` usa `m.optionsTitle` y `m.optionsDesc` |
| `src/features/audio-sampler/AudioSamplerScreen.tsx` | `aria-label={t.screenLabel}`, steps con `` `${t.stepLabel} ${stepIdx + 1}` `` |

---

### Cambios en `src/features/lab/LabApp.tsx`

- `<PerformResponsiveToolbar language={language} />` — prop añadida
- `aria-label={t.toolbar.timelineWorkspace}` — era string literal
- `aria-label={t.toolbar.deleteSelectedNote}` y `title={t.toolbar.deleteNote}`
- `{t.toolbar.compactNoteStart}` — era "Compactar inicio"
- `{t.common.volume}` — en dialog de edición y en dialog de config de pad
- `aria-label={t.project.pluginsSection}` y `aria-label={t.project.pluginList}`
- Plugin toggle: `tpl(plugin.enabled ? t.project.disablePlugin : t.project.enablePlugin, { name: plugin.name })`
- Descripciones de pad: `t.pad.descriptions[pad.id] ?? pad.description`
- `aria-label={t.pad.flicker}` — era "Flicker LFO"
- `{t.toolbar.addPadTrack}` — botón "+ Pad" (era `t.toolbar.addTrack`)

---

### Correcciones de bugs incluidas

**Bug: ⋮ no abría nada en la vista pad**

El botón de opciones de vista (`⋮`) en `AppMode` activaba
`isViewSettingsOpen = true`, que se propagaba como `settingsOpen` a cada
screen. En el modo sampler-only del `LabApp` no había ningún `AppDialog`
conectado a ese prop. Se añadió un dialog completo con mezcla por pista
(volumen y pan) para la vista pad.

---

### Mejoras UX incluidas

- **Reset en opciones de pad**: botón "Restaurar valores" en el dialog de opciones
  generales del pad que restaura volumen y pan a sus defaults.
- **Reset en config de pad individual**: botón "Restaurar valores" en el dialog
  de configuración de cada pad que aplica `PAD_SOUND_DEFAULTS[configSoundId]`.
- **Etiqueta del botón de añadir pista**: cambiado de "+ Track" a "+ Pad" en la
  barra de herramientas de la vista pad (usa `t.toolbar.addPadTrack`).

---

### Alcance del sistema de i18n tras esta sesión

**Completamente traducidas:** las 7 vistas del modo app (`piano`, `edit`,
`project`, `plugins`, `settings`, `sampler`, `pad`) y todos sus modals,
dialogs, aria-labels y textos visibles al usuario.

**Excluido intencionalmente:** la ruta `/lab` (pantalla de laboratorio de
desarrollo, inaccesible desde la navegación principal). Sus componentes
(`LabNoteEditor`, `LabSoundControls`, `LabProjectPanel`, `LabActions`)
mantienen strings en español porque son herramientas de dev, no producto.

---

### Archivos modificados

```
src/i18n/en.ts                                        (+~130 líneas)
src/i18n/es.ts                                        (+~130 líneas)
src/app/AppMode.tsx
src/features/perform/components/PerformInstrumentDialog.tsx  (reescritura)
src/features/perform/components/PerformResponsiveToolbar.tsx (reescritura)
src/features/lab/LabApp.tsx                           (múltiples puntos)
src/features/plugins-view/PluginsScreen.tsx
src/features/plugins-view/PluginsWorkspace.tsx
src/features/settings-view/SettingsScreen.tsx
src/features/audio-sampler/AudioSamplerScreen.tsx
src/features/edit/EditScreen.tsx                      (sesión anterior)
src/features/edit/EditWorkspace.tsx                   (sesión anterior)
src/features/perform/PerformScreen.tsx                (sesión anterior)
src/features/perform/PerformWorkspace.tsx             (sesión anterior)
src/features/project-view/ProjectScreen.tsx           (sesión anterior)
src/features/project-view/ProjectWorkspace.tsx        (sesión anterior)
src/features/sampler/SamplerScreen.tsx                (sesión anterior)
```

### Validación

- `tsc --noEmit` — sin errores tras cada lote de cambios
- Verificación visual en navegador con `lang=en` y `lang=es` pendiente de
  confirmación final por el usuario
