# Proyecto base en React para MiMIDI

## 1. Objetivo de este documento

Definir cómo debe nacer el primer proyecto React de MiMIDI para que sirva como base real del sistema, en lugar de convertirse en una demo desordenada difícil de escalar.

Este documento no propone una app terminada. Propone una **base técnica funcional y extensible**.

## 2. ¿Ya podemos empezar aunque falten recursos visuales?

Sí.

La falta de recursos visuales no es un impedimento real para empezar. En esta etapa, lo más importante es:

- validar la estructura,
- comprobar la integración entre UI y motor,
- verificar la reproducción de notas,
- probar la lógica de eventos,
- y establecer una base estable para crecer.

La interfaz inicial puede ser deliberadamente simple, incluso fea, siempre que permita probar el sistema.

## 3. Tecnología base propuesta

### 3.1 Frontend

- **React** como base de UI.
- **TypeScript** desde el inicio para reducir ambigüedad estructural.
- **Vite** como herramienta recomendada para inicializar el proyecto por su velocidad y simplicidad.

### 3.2 Audio

- **Web Audio API** para la síntesis matemática base.

### 3.3 Estado

En una primera etapa se puede comenzar con:

- estado local bien ubicado,
- contextos controlados,
- y una separación clara entre estado de UI y estado de dominio.

Si el proyecto crece, luego podrá evaluarse una librería más fuerte para estado global, pero no debe introducirse por costumbre antes de que exista una necesidad concreta.

## 4. Cómo crear el proyecto React

## 4.1 Requisitos previos

Debes tener instalado:

- **Node.js** (preferiblemente versión LTS),
- un gestor de paquetes como **npm**,
- y un editor como VS Code si lo deseas.

Para verificar:

```bash
node -v
npm -v
```

## 4.2 Crear el proyecto con Vite

Comando recomendado:

```bash
npm create vite@latest mimidi -- --template react-ts
```

Luego entra al proyecto:

```bash
cd mimidi
```

Instala dependencias:

```bash
npm install
```

Ejecuta el entorno de desarrollo:

```bash
npm run dev
```

## 4.3 Alternativa usando pnpm

Si en el futuro decides usar `pnpm`:

```bash
pnpm create vite mimidi --template react-ts
cd mimidi
pnpm install
pnpm dev
```

## 5. Estructura inicial sugerida

No conviene quedarse con la estructura mínima por defecto de Vite. Desde el inicio es mejor reordenar el proyecto.

```text
mimidi/
  docs/
  public/
  src/
    app/
      layout/
      providers/
      router/
      bootstrap/

    application/
      use-cases/
      commands/
      queries/
      services/

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

    infrastructure/
      audio/
      midi/
      storage/
      serialization/

    shared/
      ui/
      lib/
      types/
      constants/

    main.tsx
    App.tsx
```

## 6. Qué debe incluir la primera versión

La primera versión no debe intentar resolver todo. Debe concentrarse en una base muy clara.

### 6.1 Layout base

Una UI temporal con:

- barra superior,
- área principal,
- panel de transporte,
- espacio para teclado,
- espacio para timeline.

### 6.2 Teclado mínimo

Un teclado visual simple, incluso con botones HTML básicos, que permita disparar notas.

### 6.3 Síntesis mínima

Capacidad de reproducir notas con:

- onda seno,
- onda cuadrada,
- onda sierra,
- y control simple de duración y volumen.

### 6.4 Transporte mínimo

Controles simples:

- play,
- stop,
- tempo base,
- indicador de estado.

### 6.5 Modelo mínimo de proyecto

Aunque sea pequeño, debe existir una estructura de dominio, por ejemplo:

- proyecto,
- pistas,
- eventos,
- clips básicos o una forma simplificada equivalente.

### 6.6 Timeline mínima

No tiene que ser sofisticada. Basta con una representación visual simple de eventos o una rejilla vacía preparada para crecer.

## 7. Qué no debe entrar aún

Para proteger la velocidad de avance y la limpieza del core, la primera versión no debería incluir:

- instrumentos sampleados complejos,
- carga de librerías pesadas de audio,
- marketplace o gestor completo de plugins,
- colaboración en tiempo real,
- exportaciones complejas,
- edición avanzada tipo DAW,
- diseño visual final,
- animaciones pesadas,
- sistema de skins,
- compatibilidad completa con todos los dispositivos MIDI.

## 8. Primer milestone sugerido

### Milestone 1: “Instrumento vivo mínimo”

El proyecto ya es un avance real cuando logra lo siguiente:

- abrir la app,
- visualizar una estructura base,
- pulsar una tecla visual,
- reproducir una nota,
- mostrar que esa nota ocurrió,
- y conservar separación clara entre UI y motor.

Si eso se consigue bien, el proyecto deja de ser una idea y se convierte en sistema.

## 9. Archivo mínimo de arranque recomendado

La lógica puede empezar con un servicio muy pequeño de audio que encapsule Web Audio API, en lugar de usarla directamente desde los componentes.

La idea inicial no es perfección acústica, sino establecer dirección correcta.

## 10. Orden recomendado de implementación

### Etapa 1

- crear proyecto,
- limpiar archivos por defecto,
- reorganizar carpetas,
- crear layout mínimo,
- crear servicio de audio básico.

### Etapa 2

- crear teclado visual temporal,
- conectar teclas a reproducción,
- crear tipos base del dominio.

### Etapa 3

- crear eventos de nota,
- mostrar eventos en una timeline mínima,
- agregar transporte básico.

### Etapa 4

- preparar registros simples de vistas e instrumentos,
- aunque todavía no exista sistema completo de plugins.

## 11. Filosofía de arranque

La primera versión debe buscar una cosa: **comprobar el esqueleto del sistema**.

No debe buscar impresionar visualmente. Debe buscar confirmar que:

- React puede servir como interfaz base,
- el motor puede separarse del render,
- la arquitectura soporta crecimiento,
- y la decisión de enfocarse en instrumentos matemáticos funciona.

## 12. Conclusión

Sí, MiMIDI ya puede empezar como proyecto React aunque aún no existan recursos visuales finales. Lo correcto es comenzar con una base funcional, con UI temporal, y con una estructura que respete la arquitectura del producto. La meta del primer proyecto no es “verse terminado”, sino convertirse en un núcleo estable sobre el cual luego puedan crecer las vistas, las herramientas, los instrumentos y los mods.
