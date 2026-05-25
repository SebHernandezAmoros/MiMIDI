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

type TutorialLangTexts = {
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
        text: "Graba música con el piano, los pads y el micrófono, luego edita y expórtala como audio. Te guiamos en 20 pasos.",
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
      // 7 — grabar pads
      {
        text: "Los pads son para ritmos y percusión. Golpea cada pad para escuchar su sonido: kick, snare, hi‑hat... Familiarízate con ellos antes de grabar.",
      },
      // 8 — cuadrícula de pads
      {
        text: "Cuando estés listo, pulsa ● y golpea los pads que quieras usar. Cada golpe queda registrado en el momento exacto en que lo tocaste. Pulsa ■ para parar.",
      },
      // 9 — escuchar pads
      {
        text: "Pulsa ▶ para escuchar el ritmo grabado. Verás el playhead avanzar mientras suena. Puedes tener varias pistas de pads con ritmos diferentes.",
      },
      // 10 — nueva pista de pads
      {
        text: "Para añadir un segundo ritmo de percusión independiente, pulsa aquí para crear una nueva pista de pads. Con el selector de pista puedes alternar entre ellas y grabarlas por separado.",
      },
      // 11 — pestaña muestras
      {
        text: "Aquí están tus slots de audio. Cada slot guarda una muestra que puede ser un golpe, un sonido ambiente o cualquier cosa que grabes. Elige un slot vacío para empezar.",
      },
      // 12 — grabar muestra
      {
        text: "Pulsa este botón para grabar cualquier sonido desde el micrófono. Cuando termines, guarda la grabación y quedará en el slot seleccionado lista para usar.",
      },
      // 13 — pestaña editor
      {
        text: "En el Editor ves la forma de onda de tu muestra. Arrastra los marcadores de recorte para quedarte solo con la parte que quieres. Ajusta el Gain y el Tune para afinar el sonido.",
      },
      // 14 — pestaña secuenciador
      {
        text: "En el Secuenciador construyes el patrón rítmico. Cada fila es una muestra y cada casilla es un tiempo. Activa las casillas donde quieres que suene y pruébalo con ▶.",
      },
      // 15 — crear mix
      {
        text: "Con el patrón listo, pulsa este botón para añadirlo al proyecto como mix. Aparecerá en el timeline y sonará junto al resto de pistas.",
      },
      // 16 — editar notas
      {
        text: "En la vista Notas ves las notas de la pista activa como bloques de colores. Arrastra un bloque para moverlo en el tiempo o arrastra su borde derecho para cambiar la duración.",
      },
      // 17 — botón tracks
      {
        text: "Pulsa este botón para pasar a la vista Tracks, donde verás todas tus pistas y mixes juntas en el mismo timeline y podrás moverlas de forma independiente.",
      },
      // 18 — vista tracks
      {
        text: "En la vista Tracks ves todas las pistas y mixes en el mismo timeline. Arrastra los clips para desfasarlos. Selecciona una pista y usa Mute o Solo para aislar lo que quieres escuchar.",
      },
      // 18 — nombre del proyecto
      {
        text: "Antes de exportar, dale nombre a tu canción tocando aquí y escribiendo el título. El nombre se incluirá en el archivo WAV que se descargue.",
      },
      // 19 — exportar
      {
        text: "Pulsa este botón para exportar tu canción como WAV. El selector del sistema te permite elegir dónde guardar el archivo.",
      },
      // 20 — cierre
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
        text: "Record music with the piano, pads and microphone, then edit and export it as audio. We'll guide you in 20 steps.",
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
      // 7 — record pads
      {
        text: "Pads are for rhythms and percussion. Hit each pad to hear its sound: kick, snare, hi‑hat... Get familiar with them before recording.",
      },
      // 8 — pad grid
      {
        text: "When you're ready, press ● and hit the pads you want to use. Each hit is captured at the exact moment you play it. Press ■ to stop.",
      },
      // 9 — listen pads
      {
        text: "Press ▶ to hear the recorded rhythm. The playhead moves as it plays. You can have multiple pad tracks with different rhythms.",
      },
      // 10 — new pad track
      {
        text: "To add a second independent percussion rhythm, press here to create a new pad track. Use the track selector to switch between them and record each one separately.",
      },
      // 11 — samples tab
      {
        text: "Here are your audio slots. Each slot holds a sample — a hit, an ambient sound, or anything you record. Choose an empty slot to get started.",
      },
      // 12 — record mic
      {
        text: "Press this button to record any sound from the microphone. When you're done, save the recording and it will be stored in the selected slot ready to use.",
      },
      // 13 — editor tab
      {
        text: "In the Editor you see the waveform of your sample. Drag the trim handles to keep only the part you want. Adjust Gain and Tune to fine-tune the sound.",
      },
      // 14 — sequencer tab
      {
        text: "In the Sequencer you build the rhythm pattern. Each row is a sample and each cell is a beat. Activate the cells where you want it to play and preview with ▶.",
      },
      // 15 — create mix
      {
        text: "With the pattern ready, press this button to add it to the project as a mix. It will appear in the timeline and play alongside the other tracks.",
      },
      // 16 — edit notes
      {
        text: "In Notes view you see the notes of the active track as colored blocks. Drag a block to move it in time, or drag its right edge to change the duration.",
      },
      // 17 — tracks button
      {
        text: "Press this button to switch to Tracks view, where you'll see all your tracks and mixes together in the same timeline and can move them independently.",
      },
      // 18 — tracks view
      {
        text: "In Tracks view you see all tracks and mixes in the same timeline. Drag clips to offset them. Select a track and use Mute or Solo to isolate what you want to hear.",
      },
      // 18 — project name
      {
        text: "Before exporting, give your song a name by tapping here and typing the title. The name will be included in the downloaded WAV file.",
      },
      // 19 — export
      {
        text: "Press this button to export your song as a WAV file. The system file picker lets you choose where to save it.",
      },
      // 20 — close
      {
        title: "Ready to create!",
        text: "You can repeat this tutorial or view the full manual from Settings at any time.",
      },
    ],
  },
}
