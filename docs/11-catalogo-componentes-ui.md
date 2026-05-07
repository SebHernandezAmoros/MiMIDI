# Catalogo Inicial de Componentes UI

## Estado

Documento semilla para extraer desde `Perform` una libreria visual reutilizable
antes de replicar patrones en `SMC Pad`, `Plugins`, `Settings` y `Edit`.

## Objetivo

Evitar que cada vista vuelva a resolver por su cuenta:

- pills
- icon buttons
- dialogs
- barras de control
- listas con scroll interno
- shells responsive horizontales

## Componentes ya creados o iniciados

### Base de app

- `AppDialog`
  - Ubicacion: `src/app/components/AppDialog.tsx`
  - Uso actual: confirmacion de borrado de pista
  - Proximo paso: soporte para variantes `confirm`, `picker`, `danger`

### Perform

- `PerformInstrumentDialog`
  - Ubicacion: `src/features/perform/components/PerformInstrumentDialog.tsx`
  - Uso actual: seleccion de categoria e instrumento con scroll interno
  - Proximo paso: extraer estilos genericos de listas seleccionables

- `PerformResponsiveToolbar`
  - Ubicacion: `src/features/perform/components/PerformResponsiveToolbar.tsx`
  - Estado: ya conectada como toolbar oficial del `Perform` responsive
  - Uso actual:
    - transporte
    - track selector
    - selector de instrumento
    - acciones de pista
    - octava
  - Proximo paso: extraer de ahi primitives mas pequenas

- `PerformWebWorkspace`
  - Ubicacion: `src/features/perform/PerformWebWorkspace.tsx`
  - Estado: espacio preparado para recuperar o rehospedar la version web previa
  - Proximo paso: mover ahi la composicion desktop/web sin contaminar el responsive

## Primitives a extraer

1. `IconPillButton`
   - botones redondos o capsulares con icono
   - ejemplos actuales: grabar, play, borrar pista, fullscreen

2. `ActionPillButton`
   - botones de accion textual
   - ejemplos actuales: `+ TRACK`, selector de instrumento

3. `CounterPill`
   - control corto con decremento / valor / incremento
   - ejemplo actual: octava

4. `TrackSelectorPill`
   - flecha / valor / flecha
   - ejemplo actual: `TRACK 1`

5. `PickerDialog`
   - dialog con columna de categorias y lista con scroll
   - ejemplo actual: instrumentos

## Orden recomendado

1. cerrar `Perform` responsive como referencia visual
2. extraer primitives a `src/app/components/`
3. mover `Perform` a consumir esas primitives
4. replicar en `SMC Pad`
5. luego `Plugins` y `Settings`

## Criterio

La regla es simple:

- si un patron aparece dos veces, deja de vivir embebido y pasa a catalogo
- si un patron solo existe en `Perform`, primero se estabiliza ahi
