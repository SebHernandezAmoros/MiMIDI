# Arquitectura de MiMIDI

## 1. Propósito de la arquitectura

La arquitectura de MiMIDI debe permitir que el proyecto nazca pequeño, funcione pronto, y crezca sin colapsar cuando se agreguen nuevas funciones, nuevas vistas, nuevos instrumentos, nuevas formas de visualización y futuros mods/plugins.

El objetivo no es solo “ordenar carpetas”, sino diseñar una base que proteja al proyecto de:

- acoplamiento entre interfaz y lógica de audio,
- dependencia fuerte de una sola vista,
- dificultad para introducir extensiones,
- ruptura de compatibilidad al crecer,
- mezcla de lógica experimental con el core,
- y dependencia prematura de recursos visuales o sample libraries.

## 2. Decisión central: Screaming Architecture

MiMIDI adoptará **Screaming Architecture** como principio organizador principal.

Esto significa que la estructura del proyecto debe “gritar” qué es el sistema por su organización, antes que gritar qué framework usa.

En lugar de organizar el proyecto principalmente por tecnologías como:

- `components/`
- `hooks/`
- `services/`
- `utils/`

la organización debe estar dominada por capacidades y dominios del producto, por ejemplo:

- `keyboard/`
- `timeline/`
- `transport/`
- `audio-engine/`
- `midi-engine/`
- `project/`
- `plugins/`
- `visualizers/`

### 2.1 Por qué esta decisión es importante

Esto es especialmente útil porque MiMIDI no será una app tradicional estática, sino una plataforma creativa que en el tiempo puede aceptar:

- nuevas vistas,
- nuevos flujos de edición,
- nuevas formas de producir sonido,
- nuevas herramientas de visualización,
- y extensiones externas.

Con Screaming Architecture:

- el core conserva claridad,
- las responsabilidades quedan más visibles,
- los mods/plugins encuentran mejores puntos de extensión,
- y el crecimiento del sistema sigue la lógica del producto, no la del framework.

## 3. Principios arquitectónicos del proyecto

### 3.1 Core pequeño, extensible y estable

El core debe mantenerse deliberadamente pequeño. Todo lo que no sea esencial para que el sistema funcione y pueda crecer debe evaluarse para quedar fuera del núcleo principal.

El core debe encargarse de:

- modelo del proyecto musical,
- reproducción básica,
- síntesis matemática base,
- entrada y representación de eventos MIDI,
- transporte básico,
- puntos de extensión,
- persistencia esencial,
- y contrato mínimo para plugins.

### 3.2 UI desacoplada del motor

La interfaz no debe contener la lógica principal de audio, proyecto o MIDI.

La UI debe ser una capa consumidora de capacidades del sistema. Debe poder cambiar de apariencia sin obligar a reescribir la lógica central.

### 3.3 Audio y MIDI como dominios separados pero coordinados

Aunque estén relacionados, el dominio de audio y el dominio MIDI no deben confundirse.

- **MIDI** representa eventos, intención musical, entrada y estructura temporal.
- **Audio** representa generación sonora, síntesis, salida y procesamiento.

MIDI no es sonido. Audio no es partitura. El sistema debe conservar esa separación conceptual.

### 3.4 Plugins como extensión, no como parche

El soporte a mods/plugins no debe agregarse al final como remiendo. Debe influir desde el inicio en la forma de diseñar:

- límites entre módulos,
- contratos públicos,
- eventos del sistema,
- registro de vistas,
- y capacidades disponibles para extensiones.

### 3.5 Evolución por capas

MiMIDI debe crecer por capas, de menor complejidad a mayor complejidad:

1. reproducción y prueba de concepto,
2. interacción musical mínima,
3. edición básica,
4. persistencia y estructura de proyecto,
5. extensibilidad,
6. visualizaciones alternativas,
7. soporte para ecosistema de mods,
8. optimización y refinamiento visual.

## 4. Capas del sistema

## 4.1 Capa de presentación

Responsable de la interacción visual con el usuario.

Incluye:

- layout general,
- navegación,
- paneles,
- teclado visual,
- línea de tiempo,
- inspector,
- controles de transporte,
- estados visuales,
- vistas base y vistas registrables.

Esta capa no debe decidir cómo se sintetiza un sonido ni cómo se interpreta internamente un evento MIDI. Solo consume APIs del sistema.

## 4.2 Capa de aplicación

Coordina casos de uso del sistema.

Ejemplos:

- reproducir nota,
- detener reproducción,
- crear clip,
- agregar evento MIDI,
- seleccionar instrumento,
- abrir proyecto,
- exportar estructura,
- registrar plugin,
- cambiar de vista.

Esta capa une intención del usuario con acciones del sistema.

## 4.3 Capa de dominio musical

Aquí vive el modelo conceptual del proyecto.

Ejemplos de entidades:

- proyecto,
- pista,
- clip,
- evento MIDI,
- nota,
- compás,
- tempo,
- instrumento,
- preset,
- vista registrada,
- descriptor de plugin.

Esta capa debe ser lo más independiente posible de React.

## 4.4 Capa de motor MIDI

Responsable de:

- recibir eventos MIDI,
- normalizar entradas,
- mapear notas,
- representar duración, velocity, canal,
- coordinar grabación y reproducción temporal,
- y alimentar visualización y audio.

## 4.5 Capa de motor de audio

Responsable de:

- síntesis matemática,
- osciladores,
- envolventes,
- mezcla básica,
- control de volumen,
- generación de tono,
- scheduling de reproducción,
- y, más adelante, efectos básicos.

En la etapa inicial la implementación puede estar apoyada en **Web Audio API**.

## 4.6 Capa de infraestructura

Responsable de conectar el sistema con tecnologías concretas:

- Web Audio API,
- Web MIDI API si aplica,
- almacenamiento local,
- serialización,
- carga de configuraciones,
- logs,
- performance metrics,
- sistema de archivos futuro,
- importación/exportación.

## 4.7 Capa de extensibilidad / plugins

Responsable de permitir que código externo o módulos aislados agreguen nuevas capacidades sin romper el core.

Ejemplos:

- nuevas vistas,
- nuevos visualizadores,
- nuevos instrumentos matemáticos,
- nuevas herramientas de edición,
- nuevos paneles,
- futuros instrumentos sampleados fuera del core.

## 5. Estructura base sugerida

```text
src/
  app/
    bootstrap/
    router/
    providers/
    layout/

  domains/
    project/
    midi/
    audio/
    transport/
    instruments/
    plugins/
    views/

  features/
    keyboard/
    timeline/
    transport-controls/
    track-list/
    inspector/
    visualizer/

  application/
    use-cases/
    services/
    commands/
    queries/

  infrastructure/
    audio/
    midi/
    storage/
    serialization/
    logging/

  shared/
    ui/
    lib/
    types/
    constants/
```

## 6. Sobre los instrumentos del core

El proyecto establece una decisión clave:

### 6.1 El core usará instrumentos matemáticos

En esta etapa, el sistema se enfocará en **instrumentos generados matemáticamente** mediante síntesis, no en instrumentos sampleados como base del núcleo.

Esto implica que el core priorizará:

- osciladores,
- formas de onda,
- ADSR,
- modulación básica,
- combinaciones de síntesis,
- y presets basados en parámetros.

### 6.2 Qué queda fuera del core

No se descarta el uso de samples en el futuro, pero se considera una capacidad más adecuada para:

- plugins,
- mods,
- packs opcionales,
- capas avanzadas,
- o integraciones posteriores.

Esto protege al núcleo de:

- peso innecesario,
- complejidad temprana,
- dependencia de librerías grandes,
- problemas de distribución,
- y desvío del foco principal.

## 7. Contratos de extensión que deben existir desde el inicio

Aunque el sistema de plugins completo llegue después, desde temprano deben existir contratos conceptuales claros.

Ejemplos:

### 7.1 Registro de vistas

Un plugin debe poder registrar una vista adicional.

Ejemplo conceptual:

- nombre de la vista,
- icono o etiqueta,
- componente raíz,
- permisos o capacidades requeridas,
- lugar sugerido de inserción.

### 7.2 Registro de instrumentos

Un plugin debe poder registrar un instrumento o generador sonoro.

Ejemplo conceptual:

- identificador,
- nombre,
- categoría,
- parámetros editables,
- método de inicialización,
- método de reproducción,
- compatibilidad con presets.

### 7.3 Registro de herramientas

Un plugin debe poder registrar herramientas de edición o visualización.

Por ejemplo:

- visualizador alternativo,
- panel tipo circuit bending,
- reproductor de cassette animado,
- herramienta experimental de manipulación temporal.

## 8. Criterios de calidad arquitectónica

Cada decisión futura debe evaluarse con preguntas como:

- ¿esto pertenece al core o a una extensión?
- ¿esta funcionalidad puede vivir desacoplada?
- ¿estamos mezclando UI con dominio?
- ¿la estructura sigue hablando del producto o solo del framework?
- ¿esto dificultará los mods en el futuro?
- ¿esta decisión aumenta el peso del núcleo innecesariamente?
- ¿esto puede reemplazarse sin reescribir todo el sistema?

## 9. Riesgos que esta arquitectura busca evitar

- construir una demo visual sin sistema sólido,
- acoplar la lógica de sonido a componentes React,
- depender demasiado temprano de samples,
- crear una interfaz principal que luego no soporte nuevas vistas,
- convertir cada mejora en una ruptura de compatibilidad,
- y diseñar plugins demasiado tarde, cuando ya no sea fácil introducirlos.

## 10. Conclusión arquitectónica

MiMIDI debe construirse como un **core musical extensible**, no como una sola pantalla con sonido. React será la capa de interfaz principal al inicio, pero la identidad del proyecto no debe quedar definida por React, sino por sus dominios: música, MIDI, síntesis, proyecto y extensibilidad.

La elección de Screaming Architecture ayuda a que el sistema pueda crecer hacia mods/plugins sin perder coherencia. El verdadero objetivo no es solo lograr una primera versión funcional, sino evitar que esa primera versión se convierta en una trampa estructural para todo lo que vendrá después.
