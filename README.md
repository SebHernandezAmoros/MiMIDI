# MiMIDI

MiMIDI es una aplicacion musical en desarrollo para crear, explorar, grabar y
reproducir ideas basadas en MIDI y sintesis matematica.

El proyecto no busca ser solo un piano en pantalla ni una demo visual con audio.
La meta es construir un core musical pequeno, entendible y extensible, capaz de
crecer hacia nuevas vistas, herramientas, instrumentos y futuros mods/plugins.

## Que estamos construyendo

MiMIDI parte de una decision central: el core trabaja con instrumentos
matematicos. Es decir, el sonido inicial se genera con sintesis, osciladores,
envolventes y parametros, no con samples ni bancos de sonido pesados.

Esto permite mantener una base liviana y clara mientras se validan las piezas
principales del sistema:

- motor de audio con Web Audio API,
- notas musicales y conversion a frecuencia,
- eventos MIDI basicos,
- piano visual de prueba,
- grabacion de notas con duracion,
- timeline minima tipo piano roll,
- reproduccion de lo grabado,
- y una arquitectura preparada para crecer por dominios.

Los instrumentos sampleados no estan descartados. La idea es que lleguen mas
adelante como plugins, mods o extensiones opcionales, sin ensuciar el nucleo
inicial.

## Estado actual

La aplicacion funciona como un laboratorio temporal para probar el core musical.
Actualmente permite:

- seleccionar un instrumento matematico,
- seleccionar una nota musical de prueba,
- tocar una nota o un acorde,
- tocar notas desde un piano visual,
- sostener notas mientras una tecla esta presionada,
- registrar eventos MIDI `note-on` y `note-off`,
- convertir eventos en notas grabadas con inicio y duracion,
- ver las notas en una timeline horizontal,
- agrupar notas iguales en lanes,
- reproducir la grabacion,
- limpiar la sesion,
- ajustar volumen maestro,
- y detener voces activas.

La interfaz todavia no representa el producto final. Su proposito actual es
validar sonido, interaccion, eventos, timeline y separacion arquitectonica.

## Arquitectura

MiMIDI sigue una idea de Screaming Architecture: la estructura del proyecto debe
hablar de musica, MIDI, audio, instrumentos, timeline, transporte y plugins antes
que hablar solo de React.

Principios activos:

- React es la capa de presentacion, no el centro conceptual del sistema.
- MIDI representa intencion musical, eventos y tiempo.
- Audio representa generacion sonora, voces, osciladores y salida.
- La UI no debe contener logica de sintesis.
- El core debe permanecer pequeno, claro y extensible.
- Los plugins deben influir en el diseno desde temprano, aunque el sistema
  completo de plugins llegue despues.

Estructura principal actual:

```text
src/
  application/
    use-cases/
  engine/
    audio/
    midi/
  features/
    midi-events/
    piano/
    timeline/
```

## Tecnologias

- React
- TypeScript
- Vite
- Web Audio API
- ESLint

## Comandos

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Validar lint:

```bash
npm run lint
```

Construir version de produccion:

```bash
npm run build
```

Previsualizar build:

```bash
npm run preview
```

## Documentacion

La carpeta `docs/` funciona como memoria viva del proyecto.

- `docs/00-README-DOCS.md`: indice y regla de mantenimiento.
- `docs/01-arquitectura.md`: arquitectura general y principios.
- `docs/02-proyecto-base-react.md`: base tecnica inicial en React.
- `docs/03-contexto-y-metas.md`: vision, restricciones y metas.
- `docs/04-plan-desarrollo.md`: fases de desarrollo.
- `docs/05-contexto-vivo-desarrollo.md`: registro vivo de cambios y decisiones.

Si una decision importante cambia, debe quedar registrada en `docs/`.

## Ruta de desarrollo

Fases planteadas:

1. Core de audio.
2. Sistema de notas.
3. Piano.
4. MIDI basico.
5. Timeline.
6. Plugins.
7. Sintesis avanzada.
8. Proyecto musical y persistencia.

El siguiente paso recomendado es introducir un transporte minimo con estados como
`idle` y `playing`, evitando reproducciones duplicadas y preparando controles de
play/stop mas estables.

## Regla de oro

El core debe seguir siendo pequeno, entendible y extensible incluso cuando el
proyecto crezca.
