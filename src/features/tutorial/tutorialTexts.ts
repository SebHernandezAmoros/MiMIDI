import type { AppLanguage } from "../../app/appI18n"

type TutorialStepTexts = {
  title?: string
  text: string
}

type TutorialUiTexts = {
  skip: string
  next: string
  prev: string
  stepOf: (current: number, total: number) => string
  closeLabel: string
}

export type TutorialLangTexts = {
  ui: TutorialUiTexts
  langSelectTitle: string
  langSelectSubtitle: string
  steps: TutorialStepTexts[]
}

export const tutorialBasicTexts: Record<AppLanguage, TutorialLangTexts> = {
  es: {
    ui: {
      skip: "Saltar tutorial",
      next: "Siguiente →",
      prev: "← Anterior",
      stepOf: (c, t) => `Paso ${c} de ${t}`,
      closeLabel: "Empezar →",
    },
    langSelectTitle: "¿En qué idioma prefieres MiMIDI?",
    langSelectSubtitle: "Puedes cambiarlo después en Ajustes.",
    steps: [
      // 1 — bienvenida
      {
        title: "Bienvenido a MiMIDI",
        text: "Graba música con el piano, los pads y el micrófono, luego edita y expórtala como audio. Te guiamos en los pasos principales.",
      },
      // 2 — elegir instrumento
      {
        text: "Antes de grabar, elige el sonido que quieres usar. Pulsa este botón para abrir el catálogo de instrumentos y selecciona el que más te guste.",
      },
      // 3 — grabar piano
      {
        text: "Pulsa ● para iniciar la grabación. Toca las teclas del piano — cada nota queda registrada en tiempo real con el instrumento que elegiste. Pulsa ■ para parar.",
      },
      // 4 — teclado del piano
      {
        text: "Prueba a tocar las teclas del piano — escucha cómo suena el instrumento que elegiste. Cuando estés listo para grabar, avanza al siguiente paso.",
      },
      // 5 — escuchar piano
      {
        text: "Pulsa ▶ para escuchar lo que acabas de grabar. Puedes repetir el proceso con distintos instrumentos para crear varias capas melódicas.",
      },
      // 6 — nueva pista de piano
      {
        text: "Para grabar otra melodía con un instrumento diferente, pulsa este botón y se añadirá una pista nueva. Puedes tener tantas pistas melódicas como necesites.",
      },
      // 7 — toggle Keys / Steps
      {
        title: "Modo Steps",
        text: "El piano tiene dos modos: Keys para tocar en tiempo real y Steps para programar una secuencia de notas celda a celda, como una caja de ritmos melódica. Prueba Steps cuando quieras patrones repetitivos y precisos.",
      },
      // 8 — cuadrícula del step sequencer (nuevo)
      {
        title: "Cuadrícula de Pasos",
        text: "Esta es la grilla del Step Sequencer. Las filas son las notas de la octava activa y las columnas los pasos de tiempo. Toca una celda para activarla. Pulsa ▶ para escuchar el patrón en bucle.",
      },
      // 9 — botón Layers / enviar al timeline (nuevo)
      {
        title: "Enviar al Timeline",
        text: "Cuando el patrón esté listo, pulsa el icono 🔴 (Layers). Esto hornea el patrón y lo añade como notas reales a la pista melódica activa, para que suene junto al resto de la canción en el timeline.",
      },
      // 10 — grabar pads en vivo
      {
        text: "Los pads son para ritmos y percusión. Golpea cada pad para escuchar su sonido: kick, snare, hi‑hat... Familiarízate con ellos antes de grabar.",
      },
      // 11 — cuadrícula de pads
      {
        text: "Cuando estés listo, pulsa ● y golpea los pads que quieras usar. Cada golpe queda registrado en el momento exacto en que lo tocaste. Pulsa ■ para parar.",
      },
      // 12 — escuchar pads
      {
        text: "Pulsa ▶ para escuchar el ritmo grabado. Verás el playhead avanzar mientras suena. Puedes tener varias pistas de pads con ritmos diferentes.",
      },
      // 13 — toggle Pads / Beats
      {
        title: "Modo Beats",
        text: "Los pads también tienen dos modos: Pads para tocar en vivo y Beats para programar un patrón de batería. En modo Beats ves los 16 sonidos del kit en una cuadrícula y activas celda a celda cuándo suena cada uno.",
      },
      // 14 — cuadrícula del beats sequencer (nuevo)
      {
        title: "Cuadrícula de Beats",
        text: "Esta es la cuadrícula del Beats Sequencer. Cada fila es un sonido de batería — Kick, Snare, Hihat… Activa las celdas donde quieres que suene cada uno. El patrón se guarda automáticamente en el track de percusión, sin necesidad de enviarlo.",
      },
      // 15 — nueva pista de pads
      {
        text: "Para añadir un segundo ritmo de percusión independiente, pulsa aquí para crear una nueva pista de pads. Con el selector de pista puedes alternar entre ellas y grabarlas por separado.",
      },
      // 16 — pestaña muestras
      {
        text: "Aquí están tus slots de audio. Cada slot guarda una muestra que puede ser un golpe, un sonido ambiente o cualquier cosa que grabes. Elige un slot vacío para empezar.",
      },
      // 17 — grabar muestra
      {
        text: "Pulsa este botón para grabar cualquier sonido desde el micrófono. Cuando termines, guarda la grabación y quedará en el slot seleccionado lista para usar.",
      },
      // 18 — pestaña editor
      {
        text: "En el Editor ves la forma de onda de tu muestra. Arrastra los marcadores de recorte para quedarte solo con la parte que quieres. Ajusta el Gain y el Tune para afinar el sonido.",
      },
      // 19 — pestaña secuenciador
      {
        text: "En el Secuenciador construyes el patrón rítmico. Cada fila es una muestra y cada casilla es un tiempo. Activa las casillas donde quieres que suene y pruébalo con ▶.",
      },
      // 20 — crear mix
      {
        text: "Con el patrón listo, pulsa este botón para añadirlo al proyecto como mix. Aparecerá en el timeline y sonará junto al resto de pistas.",
      },
      // 21 — editar notas
      {
        text: "En la vista Notas ves las notas de la pista activa como bloques de colores. Arrastra un bloque para moverlo en el tiempo o arrastra su borde derecho para cambiar la duración.",
      },
      // 22 — botón tracks
      {
        text: "Pulsa este botón para pasar a la vista Tracks, donde verás todas tus pistas y mixes juntas en el mismo timeline y podrás moverlas de forma independiente.",
      },
      // 23 — vista tracks
      {
        text: "En la vista Tracks ves todas las pistas y mixes en el mismo timeline. Arrastra los clips para desfasarlos. Selecciona una pista y usa Mute o Solo para aislar lo que quieres escuchar.",
      },
      // 24 — nombre del proyecto
      {
        text: "Antes de exportar, dale nombre a tu canción tocando aquí y escribiendo el título. El nombre se incluirá en el archivo WAV que se descargue.",
      },
      // 25 — exportar
      {
        text: "Pulsa este botón para exportar tu canción como WAV. El selector del sistema te permite elegir dónde guardar el archivo.",
      },
      // 26 — cierre
      {
        title: "¡Listo para crear!",
        text: "Puedes repetir este tutorial o ver el manual completo desde Ajustes en cualquier momento.",
      },
    ],
  },
  en: {
    ui: {
      skip: "Skip tutorial",
      next: "Next →",
      prev: "← Back",
      stepOf: (c, t) => `Step ${c} of ${t}`,
      closeLabel: "Let's go →",
    },
    langSelectTitle: "What language do you prefer for MiMIDI?",
    langSelectSubtitle: "You can change this later in Settings.",
    steps: [
      // 1 — welcome
      {
        title: "Welcome to MiMIDI",
        text: "Record music with the piano, pads and microphone, then edit and export it as audio. We'll guide you through the main features.",
      },
      // 2 — choose instrument
      {
        text: "Before recording, choose the sound you want to use. Press this button to open the instrument catalog and pick your favorite.",
      },
      // 3 — record piano
      {
        text: "Press ● to start recording. Play the piano keys — each note is captured in real time with the instrument you chose. Press ■ to stop.",
      },
      // 4 — piano keys
      {
        text: "Try playing the piano keys — hear how the instrument you chose sounds. When you're ready to record, move on to the next step.",
      },
      // 5 — listen piano
      {
        text: "Press ▶ to hear what you just recorded. You can repeat the process with different instruments to build multiple melodic layers.",
      },
      // 6 — new piano track
      {
        text: "To record another melody with a different instrument, press this button to add a new track. You can have as many melodic tracks as you need.",
      },
      // 7 — Keys / Steps toggle
      {
        title: "Steps Mode",
        text: "The piano has two modes: Keys for playing in real time, and Steps for programming a note sequence cell by cell — like a melodic drum machine. Try Steps when you want precise, repeating patterns.",
      },
      // 8 — step sequencer grid (new)
      {
        title: "Steps Grid",
        text: "This is the Step Sequencer grid. Rows are the notes of the active octave and columns are time steps. Tap a cell to toggle it on or off. Press ▶ to hear the pattern loop.",
      },
      // 9 — Layers button / send to timeline (new)
      {
        title: "Send to Timeline",
        text: "When your pattern is ready, press the 🔴 Layers icon. This bakes the pattern and adds it as real notes to the active melodic track, so it plays alongside the rest of your song in the timeline.",
      },
      // 10 — record pads
      {
        text: "Pads are for rhythms and percussion. Hit each pad to hear its sound: kick, snare, hi‑hat... Get familiar with them before recording.",
      },
      // 11 — pad grid
      {
        text: "When you're ready, press ● and hit the pads you want to use. Each hit is captured at the exact moment you play it. Press ■ to stop.",
      },
      // 12 — listen pads
      {
        text: "Press ▶ to hear the recorded rhythm. The playhead moves as it plays. You can have multiple pad tracks with different rhythms.",
      },
      // 13 — Pads / Beats toggle
      {
        title: "Beats Mode",
        text: "Pads also have two modes: Pads for live playing and Beats for programming a drum pattern. In Beats mode you see all 16 kit sounds in a grid and tap each cell to set when it plays.",
      },
      // 14 — beats sequencer grid (new)
      {
        title: "Beats Grid",
        text: "This is the Beats Sequencer grid. Each row is a drum sound — Kick, Snare, Hihat… Activate cells to set when each sound plays. The pattern saves automatically to the percussion track — no manual send needed.",
      },
      // 15 — new pad track
      {
        text: "To add a second independent percussion rhythm, press here to create a new pad track. Use the track selector to switch between them and record each one separately.",
      },
      // 16 — samples tab
      {
        text: "Here are your audio slots. Each slot holds a sample — a hit, an ambient sound, or anything you record. Choose an empty slot to get started.",
      },
      // 17 — record mic
      {
        text: "Press this button to record any sound from the microphone. When you're done, save the recording and it will be stored in the selected slot ready to use.",
      },
      // 18 — editor tab
      {
        text: "In the Editor you see the waveform of your sample. Drag the trim handles to keep only the part you want. Adjust Gain and Tune to fine-tune the sound.",
      },
      // 19 — sequencer tab
      {
        text: "In the Sequencer you build the rhythm pattern. Each row is a sample and each cell is a beat. Activate the cells where you want it to play and preview with ▶.",
      },
      // 20 — create mix
      {
        text: "With the pattern ready, press this button to add it to the project as a mix. It will appear in the timeline and play alongside the other tracks.",
      },
      // 21 — edit notes
      {
        text: "In Notes view you see the notes of the active track as colored blocks. Drag a block to move it in time, or drag its right edge to change the duration.",
      },
      // 22 — tracks button
      {
        text: "Press this button to switch to Tracks view, where you'll see all your tracks and mixes together in the same timeline and can move them independently.",
      },
      // 23 — tracks view
      {
        text: "In Tracks view you see all tracks and mixes in the same timeline. Drag clips to offset them. Select a track and use Mute or Solo to isolate what you want to hear.",
      },
      // 24 — project name
      {
        text: "Before exporting, give your song a name by tapping here and typing the title. The name will be included in the downloaded WAV file.",
      },
      // 25 — export
      {
        text: "Press this button to export your song as a WAV file. The system file picker lets you choose where to save it.",
      },
      // 26 — close
      {
        title: "Ready to create!",
        text: "You can repeat this tutorial or view the full manual from Settings at any time.",
      },
    ],
  },
}

export const tutorialCompleteTexts: Record<AppLanguage, TutorialLangTexts> = {
  es: {
    ui: {
      skip: "Saltar tutorial",
      next: "Siguiente →",
      prev: "← Anterior",
      stepOf: (c, t) => `Paso ${c} de ${t}`,
      closeLabel: "¡Listo! →",
    },
    langSelectTitle: "",
    langSelectSubtitle: "",
    steps: [
      //  1 — bienvenida
      {
        title: "Tutorial Avanzado",
        text: "Este tutorial es para quienes ya completaron el Tutorial Básico. Aprenderás los modos Steps y Beats, el menú ⋮ de cada vista, la calibración de muestras y el secuenciador del sampler.",
      },
      //  2 — selector de pista
      {
        text: "Las flechas ‹ › navegan entre las pistas que has creado. El nombre en el centro muestra cuál es la activa. Selecciona una pista distinta antes de pulsar ● para grabar en ella.",
      },
      //  3 — eliminar pista
      {
        text: "El botón de papelera elimina la pista activa junto con todas sus notas grabadas. Solo se habilita cuando hay más de una pista y ninguna grabación está en curso.",
      },
      //  4 — toggle Keys / Steps en toolbar
      {
        text: "El toggle Keys / Steps cambia el modo de entrada del piano. Keys es el teclado en tiempo real. Steps abre el secuenciador de pasos — una cuadrícula donde programas notas celda a celda.",
      },
      //  5 — cuadrícula del step sequencer
      {
        text: "Esta es la cuadrícula del Step Sequencer. Las filas son las 7 notas naturales de la octava activa (C D E F G A B). Las columnas son los pasos de tiempo. Toca una celda para activarla o apagarla. Pulsa ▶ para escuchar el patrón en bucle.",
      },
      //  6 — botón Layers / → Track
      {
        text: "El botón ⊞ añade una nueva pista de pasos para tener varios patrones independientes. El icono 🔴 (Layers) horneado el patrón activo como pista melódica en el timeline — útil para incluirlo en la canción completa.",
      },
      //  7 — octava
      {
        text: "Sube o baja la octava para acceder a rangos más agudos o graves. El número central muestra en qué octava estás tocando en este momento.",
      },
      //  8 — ⋮ piano: señalar botón
      {
        text: "Estos tres puntos abren las Opciones del Piano. Púlsalos — los siguientes pasos muestran lo que hay dentro.",
      },
      //  9 — ⋮ piano: tipo de acorde
      {
        text: "Tipo de acorde: Mayor suena brillante y alegre, Menor más oscuro y emotivo, Power usa solo dos notas para un sonido más contundente. Afecta a todo lo que toques en modo Acorde.",
      },
      // 10 — ⋮ piano: modo ARP
      {
        text: "Modo ARP: Up va de grave a agudo, Down al revés, Up‑Down sube y baja alternando, Random mezcla las notas al azar, Chord las toca todas a la vez. Solo actúa cuando ARP está activado.",
      },
      // 11 — ⋮ piano: parámetros ARP
      {
        text: "Rate: velocidad del arpegio (1/4 lento a 1/8T con trémolo). Gate: duración de cada nota. Octavas: cuántas octavas abarca el patrón. Latch: mantiene el arpegio sin soltar la tecla.",
      },
      // 12 — paginador de pads (< 1/2 >)
      {
        text: "Los pads se dividen en páginas de 8. Las flechas ‹ › y el contador muestran en qué página estás. Navega entre páginas para acceder a los 16 sonidos disponibles.",
      },
      // 13 — toggle Pads / Beats en toolbar
      {
        text: "El toggle Pads / Beats cambia el modo de entrada de la percusión. Pads es el kit en vivo. Beats abre el secuenciador de batería — una cuadrícula con los 16 sonidos del kit donde programas qué suena en cada paso.",
      },
      // 14 — cuadrícula del beats sequencer
      {
        text: "Esta es la cuadrícula del Beats Sequencer. Cada fila es un sonido de batería (Kick, Snare, Hihat…). Activa celdas para construir tu patrón. En ⚙ (engranaje) puedes ajustar BPM, subdivisión y número de pasos. El patrón se guarda automáticamente en el track de percusión.",
      },
      // 15 — ⚙ síntesis de pad
      {
        text: "Cada pad tiene un botón ⚙ (visible en modo Pads). Abre el panel de síntesis: Volumen, Decay (duración del golpe) y Distorsión. Algunos añaden Pitch en Hz. Experimenta — el mismo preset puede sonar muy diferente.",
      },
      // 16 — ⋮ pad: señalar botón
      {
        text: "En la vista Pad, el menú ⋮ también tiene opciones. El siguiente paso muestra qué hay dentro.",
      },
      // 17 — ⋮ pad: interior del diálogo
      {
        text: "La Mezcla por pista ajusta el volumen y el panorama (izquierda/derecha) de la pista de percusión activa. En modo Beats también encontrarás BPM, subdivisión del paso y el botón de limpiar el patrón.",
      },
      // 18 — pestaña editor
      {
        text: "En la pestaña Editor ves la forma de onda de la muestra seleccionada. Arrastra los marcadores de recorte para quedarte solo con la parte que necesitas.",
      },
      // 19 — panel calibración
      {
        text: "El panel lateral tiene Gain (volumen), Fade In/Out (ataque y caída) y Tune (transposición en semitonos). Cada parámetro se aplica en tiempo real mientras la muestra suena.",
      },
      // 20 — ⋮ sampler: señalar botón
      {
        text: "El menú ⋮ del Sampler tiene opciones avanzadas. El siguiente paso muestra qué hay dentro.",
      },
      // 21 — ⋮ sampler: interior del diálogo
      {
        text: "BPM fino con slider y campo numérico. Pasos de 4 a 40 para patrones más cortos o largos. Botón de resetear la calibración de todas las muestras a la vez.",
      },
      // 22 — pestaña secuenciador
      {
        text: "En el Secuenciador construyes el patrón rítmico. Cada fila es una muestra y cada casilla es un tiempo. Activa las casillas donde quieres que suene y escúchalo con ▶.",
      },
      // 23 — BPM
      {
        text: "Cambia el BPM para acelerar o ralentizar el patrón. Usa los botones − y + de aquí para ajustes finos.",
      },
      // 24 — pasos
      {
        text: "Elige entre 16 o 32 pasos para determinar la longitud del patrón. 16 pasos es un compás estándar; 32 pasos te da el doble de espacio para crear variaciones.",
      },
      // 25 — reproducir
      {
        text: "Pulsa ▶ para escuchar el patrón en bucle. El indicador de paso activo avanza en tiempo real mostrando exactamente qué casilla está sonando.",
      },
      // 26 — borrar
      {
        text: "Pulsa el botón Borrar (goma) para vaciar todas las casillas del patrón y empezar de cero. Los slots de muestra se mantienen intactos.",
      },
      // 27 — vista tracks
      {
        text: "En la vista Tracks ves todas las pistas y mixes en el mismo timeline. Arrastra los clips para alinearlos o desfasarlos a tu gusto.",
      },
      // 28 — mute/solo/duplicar
      {
        text: "Selecciona una pista o mix y usa Mute para silenciarlo o Solo para escucharlo solo. Duplica el clip con el botón Copiar para repetirlo sin tener que volver a grabar.",
      },
      // 29 — ⋮ edición: señalar botón
      {
        text: "La vista de Edición también tiene un menú ⋮. El siguiente paso muestra qué hay dentro.",
      },
      // 30 — ⋮ edición: interior del diálogo
      {
        text: "Duración total del timeline en segundos. Snap: alinea automáticamente los clips al moverlos para que queden perfectamente sincronizados con la cuadrícula.",
      },
      // 31 — cierre
      {
        title: "¡Lo dominas todo!",
        text: "Ya conoces todas las funciones avanzadas de MiMIDI, incluidos los secuenciadores de pasos. Vuelve aquí cuando quieras repasar cualquier función.",
      },
    ],
  },
  en: {
    ui: {
      skip: "Skip tutorial",
      next: "Next →",
      prev: "← Back",
      stepOf: (c, t) => `Step ${c} of ${t}`,
      closeLabel: "Done! →",
    },
    langSelectTitle: "",
    langSelectSubtitle: "",
    steps: [
      //  1 — welcome
      {
        title: "Advanced Tutorial",
        text: "This tutorial is for those who have already completed the Basic Tutorial. Here you'll learn Steps and Beats modes, the ⋮ menu for each view, sample calibration and the sampler sequencer.",
      },
      //  2 — track selector
      {
        text: "The ‹ › arrows navigate between the tracks you've created. The name in the centre shows the active one. Select a different track before pressing ● to record on it.",
      },
      //  3 — remove track
      {
        text: "The trash button deletes the active track along with all its recorded notes. It is only enabled when there is more than one track and no recording is in progress.",
      },
      //  4 — Keys / Steps toggle in toolbar
      {
        text: "The Keys / Steps toggle switches the piano's input mode. Keys is the real-time keyboard. Steps opens the step sequencer — a grid where you program notes cell by cell.",
      },
      //  5 — step sequencer grid
      {
        text: "This is the Step Sequencer grid. Rows are the 7 natural notes of the active octave (C D E F G A B). Columns are time steps. Tap a cell to toggle it. Press ▶ to hear the pattern loop.",
      },
      //  6 — Layers / → Track button
      {
        text: "The ⊞ button adds a new steps track so you can have multiple independent patterns. The 🔴 Layers icon bakes the active pattern as a melodic track in the timeline — useful for including it in the full song.",
      },
      //  7 — octave
      {
        text: "Move up or down an octave to access higher or lower ranges. The centre number shows which octave you're playing in right now.",
      },
      //  8 — ⋮ piano: show button
      {
        text: "These three dots open the Piano Options. Press them — the next steps show what's inside.",
      },
      //  9 — ⋮ piano: chord type
      {
        text: "Chord type: Major sounds bright and cheerful, Minor darker and more emotional, Power uses just two notes for a solid sound. This setting affects every note played in Chord mode.",
      },
      // 10 — ⋮ piano: ARP mode
      {
        text: "ARP mode: Up goes low to high, Down reverses it, Up‑Down alternates both ways, Random shuffles notes, Chord plays them all at once. Only applies when ARP is enabled.",
      },
      // 11 — ⋮ piano: ARP params
      {
        text: "Rate: arpeggio speed (1/4 slow to 1/8T triplet). Gate: length of each note. Octaves: how many octaves the pattern spans. Latch: keeps the arpeggio running without holding the key.",
      },
      // 12 — pad page pager (< 1/2 >)
      {
        text: "Pads are split into pages of 8. The ‹ › arrows and the counter show which page you're on. Navigate between pages to access all 16 available sounds.",
      },
      // 13 — Pads / Beats toggle in toolbar
      {
        text: "The Pads / Beats toggle switches the pad's input mode. Pads is the live kit. Beats opens the drum sequencer — a grid showing all 16 kit sounds where you program which plays on each step.",
      },
      // 14 — beats sequencer grid
      {
        text: "This is the Beats Sequencer grid. Each row is a drum sound (Kick, Snare, Hihat…). Activate cells to build your pattern. In ⚙ you can adjust BPM, subdivision and step count. The pattern saves automatically to the percussion track.",
      },
      // 15 — pad synthesis (⚙)
      {
        text: "Each pad has a ⚙ button (visible in Pads mode). It opens the synthesis panel: Volume, Decay (hit length) and Distortion. Some pads add Pitch in Hz. Experiment — the same preset can sound very different.",
      },
      // 16 — ⋮ pad: show button
      {
        text: "In Pad view, the ⋮ menu has options too. The next step shows what's inside.",
      },
      // 17 — ⋮ pad: dialog content
      {
        text: "Per-track Mix: adjust the volume and pan (left/right) of the active percussion track. In Beats mode you'll also find BPM, step subdivision and a pattern clear button.",
      },
      // 18 — editor tab
      {
        text: "In the Editor tab you see the waveform of the selected sample. Drag the trim handles to keep only the part you need.",
      },
      // 19 — calibration panel
      {
        text: "The side panel has Gain (volume), Fade In/Out (attack and release) and Tune (semitone transposition). Each parameter applies in real time while the sample plays.",
      },
      // 20 — ⋮ sampler: show button
      {
        text: "The Sampler ⋮ menu has advanced options. The next step shows what's inside.",
      },
      // 21 — ⋮ sampler: dialog content
      {
        text: "Fine BPM slider with numeric field for maximum precision. Steps from 4 to 40 for shorter or longer patterns. One-click button to reset calibration on all samples at once.",
      },
      // 22 — sequencer tab
      {
        text: "In the Sequencer you build the rhythm pattern. Each row is a sample and each cell is a beat. Activate the cells where you want it to play and preview with ▶.",
      },
      // 23 — BPM
      {
        text: "Change the BPM to speed up or slow down the pattern. Use the − and + buttons here for fine adjustments.",
      },
      // 24 — steps
      {
        text: "Choose between 16 or 32 steps to set the pattern length. 16 steps is a standard bar; 32 steps gives you double the space to create variations.",
      },
      // 25 — play
      {
        text: "Press ▶ to hear the pattern loop. The active step indicator advances in real time showing exactly which cell is playing.",
      },
      // 26 — clear
      {
        text: "Press the Clear button (eraser) to empty all cells in the pattern and start fresh. Your sample slots remain untouched.",
      },
      // 27 — tracks view
      {
        text: "In Tracks view you see all tracks and mixes in the same timeline. Drag clips to align or offset them to your liking.",
      },
      // 28 — mute/solo/duplicate
      {
        text: "Select a track or mix and use Mute to silence it or Solo to hear it alone. Duplicate the clip with the Copy button to repeat it without re-recording.",
      },
      // 29 — ⋮ edit: show button
      {
        text: "The Edit view also has a ⋮ menu. The next step shows what's inside.",
      },
      // 30 — ⋮ edit: dialog content
      {
        text: "Total timeline duration in seconds. Snap: automatically aligns clips when you move them to keep them perfectly in sync with the grid.",
      },
      // 31 — outro
      {
        title: "You've mastered it all!",
        text: "You now know all of MiMIDI's advanced features, including the step sequencers. Come back here any time to review any feature.",
      },
    ],
  },
}
