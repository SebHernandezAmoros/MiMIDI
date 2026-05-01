# Guia practica para crear plugins en MiMIDI

## Prompt sugerido para pedir plugins a Codex

Usa algo asi al abrir un chat nuevo:

```md
Quiero crear un plugin interno nuevo para MiMIDI.

Objetivo musical:
- [describe que familia sonora o capacidad quieres agregar]

Alcance:
- [instrumentos nuevos, accion nueva del laboratorio, herramienta futura, etc.]

Restricciones:
- mantener Screaming Architecture
- no acoplar el plugin a App.tsx
- documentar cambios en docs/05-contexto-vivo-desarrollo.md
- si cambia roadmap o estado del bloque, actualizar docs/04-plan-desarrollo.md
- actualizar docs/08-guia-crear-plugins.md si el flujo real cambia

Quiero que:
1. revises el sistema de plugins actual
2. implementes el plugin respetando el contrato actual
3. lo registres en el catalogo correcto
4. agregues o ajustes pruebas
5. dejes documentado como usarlo y como evolucionarlo despues
```

Este prompt no debe verse como piedra. Es una base operativa para avanzar mas
rapido hoy. Lo normal es que cambie cuando el sistema de plugins mejore, cuando
aparezcan nuevas superficies extensibles o cuando el laboratorio se divida en
vistas mas claras.

## 1. Objetivo real del sistema de plugins actual

El sistema de plugins actual todavia no busca:

- cargar codigo remoto;
- instalar paquetes externos;
- ejecutar scripts arbitrarios;
- convertirse en marketplace.

Su objetivo real hoy es:

1. definir un contrato minimo de extensibilidad;
2. registrar plugins internos de forma segura;
3. permitir activarlos o desactivarlos sin tocar el core musical base;
4. persistir ese estado dentro del proyecto;
5. preparar superficies mas extensibles para despues.

La primera superficie extensible implementada hoy es:

- instrumentos matematicos aportados por plugins.

## 2. Regla arquitectonica que no se debe romper

El core principal de MiMIDI sigue siendo matematico.

Eso implica:

- no meter samples en el core base bajo nombre de plugin;
- no saltarse el catalogo comun con formatos especiales por plugin;
- no acoplar plugins concretos a `App.tsx`;
- no usar el sistema de plugins como atajo para romper Screaming Architecture.

Un plugin puede extender el producto, pero no debe desordenarlo.

## 3. Estado actual del MVP de plugins

Hoy el flujo real ya funciona asi:

1. el core define instrumentos matematicos base;
2. los plugins internos aportan contribuciones compatibles con ese contrato;
3. el registro resuelve el estado activo/inactivo de cada plugin;
4. el proyecto persiste ese estado en `pluginStates`;
5. el catalogo combinado mezcla core + plugins activos;
6. el laboratorio muestra un manager visible para activar o desactivar plugins;
7. el selector de instrumentos indica si el sonido viene del `Core` o del
   plugin activo correspondiente;
8. la reproduccion y la exportacion offline respetan el catalogo activo.

Eso significa que el sistema ya no es solo idea o maqueta. Ya existe una ruta
coherente entre dominio, UI, reproduccion, exportacion y persistencia.

## 4. Archivos clave del sistema

Dominio y registro:

- `src/engine/plugins/pluginModel.ts`
- `src/engine/plugins/internalPlugins.ts`
- `src/engine/plugins/pluginRegistry.ts`

Catalogo y consumo:

- `src/engine/audio/instrumentCatalog.ts`
- `src/features/lab/useLabInstrumentCatalog.ts`
- `src/features/lab/LabProjectPanel.tsx`

Persistencia y proyecto:

- `src/engine/project/projectModel.ts`
- `src/engine/project/projectStorage.ts`

Playback y exportacion:

- `src/application/use-cases/playRecordedNotes.ts`
- `src/engine/audio/offlineAudioRenderer.ts`

Pruebas:

- `src/engine/plugins/pluginRegistry.test.ts`
- `src/App.integration.test.tsx`

## 5. Contrato actual del plugin

Hoy un plugin implementa `MiMIDIPluginDefinition`.

```ts
export type MiMIDIPluginId = string
export type MiMIDIPluginStateMap = Record<MiMIDIPluginId, boolean>

export type InstrumentPluginContribution = {
  instruments: MathematicalInstrument[]
}

export type MiMIDIPluginDefinition = {
  description: string
  enabledByDefault: boolean
  id: MiMIDIPluginId
  instruments?: InstrumentPluginContribution
  name: string
  version: string
}
```

### Significado rapido de cada campo

- `id`: identificador estable y unico del plugin.
- `name`: nombre humano visible.
- `version`: version declarativa del plugin.
- `description`: explicacion corta del aporte real.
- `enabledByDefault`: estado inicial cuando el proyecto no trae override.
- `instruments`: contribucion de instrumentos matematicos.

## 6. Como se resuelve el estado activo de plugins

El estado activo vive hoy en dos capas:

1. `enabledByDefault`
   define el estado por defecto del registro.
2. `project.pluginStates`
   define el override persistido por proyecto.

La resolucion real la hace `pluginRegistry.ts` con helpers como:

- `createDefaultPluginStates()`
- `resolvePluginStates()`
- `getEnabledPlugins()`
- `getRegisteredPluginSummaries()`
- `getPluginInstruments()`

Eso permite:

- proyectos viejos sin `pluginStates`;
- proyectos nuevos con estado persistido;
- UI visible de activacion sin romper compatibilidad hacia atras.

## 7. Como se construye el catalogo final

`instrumentCatalog.ts` hace tres cosas:

1. toma los instrumentos del core;
2. toma instrumentos de plugins activos;
3. devuelve un catalogo combinado y categorias listas para la UI.

El laboratorio consume ese catalogo desde `useLabInstrumentCatalog`.

Importante:

- la UI no necesita saber si un instrumento viene del core o de un plugin;
- solo consume un catalogo ya resuelto;
- eso mantiene la frontera mas limpia.

## 8. Como se ve hoy un plugin sano

```ts
import type { MiMIDIPluginDefinition } from "./pluginModel"

export const glassLeadsPack: MiMIDIPluginDefinition = {
  id: "glass-leads-pack",
  name: "Glass Leads Pack",
  version: "0.1.0",
  description: "Agrega plucks y leads matematicos brillantes para el laboratorio.",
  enabledByDefault: true,
  instruments: {
    instruments: [
      {
        id: "glass-lead-soft",
        name: "Glass Lead Soft",
        category: "base",
        waveform: "triangle",
        volume: 0.18,
        envelope: {
          attack: 0.01,
          decay: 0.14,
          sustain: 0.36,
          release: 0.2,
        },
      },
      {
        id: "glass-lead-drift",
        name: "Glass Lead Drift",
        category: "advanced",
        waveform: "sawtooth",
        volume: 0.13,
        envelope: {
          attack: 0.008,
          decay: 0.12,
          sustain: 0.48,
          release: 0.24,
        },
        lfo: {
          depth: 5,
          rate: 2.6,
          waveform: "triangle",
        },
      },
    ],
  },
}
```

## 9. Procedimiento recomendado para crear un plugin nuevo

### Paso 1. Definir la intencion musical

Antes de tocar codigo, responde:

- que aporta el plugin;
- por que debe vivir como plugin y no como core;
- si sigue respetando el enfoque matematico;
- a que categoria o superficie pertenece.

### Paso 2. Crear la definicion tipada

Define un `MiMIDIPluginDefinition` con:

- `id`
- `name`
- `version`
- `description`
- `enabledByDefault`
- `instruments` si aplica

### Paso 3. Cuidar unicidad de IDs

Debes cuidar dos niveles:

1. `plugin.id`
2. `instrument.id`

Hoy existe dedupe por `id` de instrumento. Si repites IDs, un instrumento puede
pisar a otro silenciosamente.

### Paso 4. Registrar el plugin en `internalPlugins.ts`

Hoy el punto de entrada real sigue siendo:

- `src/engine/plugins/internalPlugins.ts`

Si el plugin no entra ahi, no existe para el sistema.

### Paso 5. Verificar el manager visible

Una vez registrado, revisa en el laboratorio:

- que aparezca en la seccion de plugins internos;
- que pueda activarse y desactivarse;
- que el estado sobreviva al recargar;
- que el catalogo cambie en consecuencia.

### Paso 6. Validar reproduccion y exportacion

Si el plugin aporta instrumentos:

- debe sonar en vivo;
- debe poder grabarse;
- debe poder reproducirse despues;
- debe poder salir en exportacion WAV cuando esta activo.

### Paso 7. Documentar

Todo cambio relevante debe quedar en:

- `docs/05-contexto-vivo-desarrollo.md`

Si cambia el bloque o el roadmap:

- `docs/04-plan-desarrollo.md`

Y si cambia el flujo real del sistema de plugins:

- `docs/08-guia-crear-plugins.md`

## 10. Buenas practicas para instrumentos de plugin

- usa nombres musicales legibles, no IDs disfrazados;
- evita clonar el core sin necesidad;
- reutiliza categorias existentes si no hay una razon fuerte para abrir nuevas;
- revisa volumen, ADSR y mezcla real, no solo si "suena raro";
- empieza pequeno: 1 o 2 instrumentos claros es mejor que 12 mal calibrados.

## 11. Que pasa cuando apagas un plugin

Hoy el sistema hace tres cosas importantes:

1. el plugin sale del catalogo visible;
2. las pistas que tenian seleccionado un instrumento de ese plugin vuelven a un
   fallback del core para no quedar rotas;
3. las notas grabadas que referencian un instrumento desactivado resuelven al
   catalogo activo disponible cuando se reproducen o exportan.

Eso vuelve al sistema mas estable hoy, aunque seguramente se refine despues.

## 12. Riesgos y limites actuales

### Dedupe silencioso por `instrument.id`

Todavia no hay error duro si dos plugins repiten IDs de instrumento.

### Solo existe una superficie extensible madura

Hoy lo real y estable es:

- instrumentos matematicos

Todavia faltan contratos formales para:

- acciones del laboratorio;
- herramientas del timeline;
- paneles o vistas dedicadas;
- efectos o cadenas;
- sampler plugins.

### No hay carga externa real

Hoy esto sigue siendo un sistema de registro interno tipado. Todavia no hay:

- sandbox de codigo externo;
- manifiestos separados;
- compatibilidad de versiones;
- permisos;
- carga remota.

### La guia cambiara

Este documento no debe leerse como contrato eterno. La idea es que hoy nos
sirva para trabajar rapido y con orden, no congelar el sistema demasiado pronto.

## 13. Checklist minimo al agregar un plugin

1. revisar que `plugin.id` sea unico
2. revisar que cada `instrument.id` sea unico
3. registrar el plugin en `internalPlugins.ts`
4. correr `npm run test`
5. correr `npm run lint`
6. correr `npm run build`
7. abrir el laboratorio
8. verificar que aparezca en el manager de plugins
9. activarlo y desactivarlo
10. verificar que el selector identifique si el instrumento viene del `Core` o
    del plugin
11. verificar que el estado persista al recargar
12. probar instrumentos desde:
    - `Tocar nota`
    - `Tocar acorde`
    - piano interactivo
13. grabar y reproducir
14. si aplica, exportar WAV
15. documentar en `docs/05`

## 14. Mini checklist de code review para plugins

- el nombre del plugin tiene sentido;
- la descripcion explica el aporte real;
- no hay IDs duplicados;
- el plugin no obliga a tocar `App.tsx` para conocer nombres concretos;
- la integracion entra por registro + catalogo;
- el comportamiento activo/inactivo es coherente;
- la reproduccion/exportacion no quedan desalineadas;
- la documentacion viva fue actualizada.

## 15. Resumen operativo corto

Si hoy quieres crear un plugin nuevo en MiMIDI, el flujo sano es:

1. definir una propuesta clara;
2. escribir un `MiMIDIPluginDefinition`;
3. registrar el plugin en `internalPlugins.ts`;
4. dejar que `pluginRegistry.ts` e `instrumentCatalog.ts` lo resuelvan;
5. validarlo desde el manager visible del laboratorio;
6. comprobar persistencia, playback y exportacion;
7. documentar el cambio.

## 16. Estado de esta guia

Esta guia ya describe un flujo real y usable, pero debe seguir tratandose como
documento vivo. Lo normal es que cambie cuando:

- aparezcan nuevas superficies extensibles;
- el laboratorio se separe en vistas;
- exista manifiesto de plugin aparte;
- aparezca carga externa real;
- el sistema de plugins tenga mejor aislamiento.

Eso esta bien. La meta no es inmovilizar el sistema, sino dejarlo lo bastante
claro para que podamos seguir creando plugins con menos caos y menos friccion.
