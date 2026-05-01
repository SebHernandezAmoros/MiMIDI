# Guia base para crear plugins en MiMIDI

Este documento deja la base actual para crear plugins en `MiMIDI` dentro del
MVP de extensibilidad que ya existe hoy en el proyecto.

La idea no es solo explicar "como agregar un plugin ahora", sino tambien dejar
claro:

- que es un plugin en el estado actual del core,
- donde se conecta,
- que responsabilidades tiene,
- que cosas todavia no soporta,
- y en que puntos seguramente habra que parchear o extender esta guia cuando el
  sistema crezca.

## 1. Objetivo real del sistema de plugins actual

El sistema de plugins actual NO busca todavia:

- instalar paquetes externos,
- cargar codigo remoto,
- ejecutar scripts de terceros,
- ni montar un marketplace.

Su objetivo real hoy es mucho mas controlado:

1. definir un contrato de extensibilidad claro;
2. registrar plugins internos de forma segura;
3. permitir que el laboratorio consuma capacidades externas al core base sin
   acoplarse a `App.tsx`;
4. preparar una arquitectura modular para crecer despues.

En este momento, la primera capacidad extensible implementada es:

- instrumentos matematicos aportados por plugins.

## 2. Regla de arquitectura que no se debe romper

El sistema de plugins debe respetar esta regla:

- el core musical principal de `MiMIDI` sigue siendo matematico.

Eso implica:

- no meter samples en el core base;
- no convertir un plugin en una puerta trasera para saltarse el modelo del
  producto;
- no acoplar un plugin directamente a `App.tsx`;
- no registrar instrumentos "magicos" que no respeten la forma del catalogo del
  core.

Un plugin puede extender el sistema, pero no debe desordenar la arquitectura.

## 3. Estado actual del MVP

Hoy el flujo de plugins existe asi:

1. el core define instrumentos base;
2. un plugin define instrumentos extra;
3. el plugin se registra en una lista interna;
4. el registro resuelve plugins habilitados;
5. el catalogo final combina instrumentos del core con instrumentos de plugins;
6. el laboratorio consume ese catalogo combinado sin distinguir demasiado de
   donde viene cada instrumento.

Eso significa que ya existe una cadena modular funcional, aunque todavia sea
interna y controlada.

## 4. Archivos clave del sistema

Estos son los archivos base que hoy sostienen el MVP:

- `src/engine/plugins/pluginModel.ts`
- `src/engine/plugins/internalPlugins.ts`
- `src/engine/plugins/pluginRegistry.ts`
- `src/engine/audio/instrumentCatalog.ts`
- `src/features/lab/useLabInstrumentCatalog.ts`

Y para validar integracion:

- `src/engine/plugins/pluginRegistry.test.ts`
- `src/App.integration.test.tsx`

## 5. Que es un plugin hoy

En el estado actual, un plugin es un objeto tipado que implementa
`MiMIDIPluginDefinition`.

Hoy ese contrato vive en:

- `src/engine/plugins/pluginModel.ts`

Su forma actual es:

```ts
export type MiMIDIPluginId = string

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

## 6. Significado de cada campo del contrato

### `id`

Identificador unico del plugin.

Reglas recomendadas:

- usar kebab-case;
- que sea estable en el tiempo;
- no reutilizar IDs para otra idea distinta;
- no usar nombres temporales tipo `plugin-1`.

Ejemplos sanos:

- `motion-synth-pack`
- `glass-leads-pack`
- `generative-textures-pack`

### `name`

Nombre visible y humano del plugin.

Puede ser mas expresivo que el `id`.

Ejemplos:

- `Motion Synth Pack`
- `Glass Leads Pack`

### `version`

Version declarativa del plugin.

Hoy no hay semver funcional fuerte en runtime, pero igual conviene usar un
formato consistente:

- `0.1.0`
- `0.2.0`
- `1.0.0`

Esto ayuda a trazabilidad y documentacion aunque todavia no haya gestor de
compatibilidad automatica.

### `description`

Descripcion corta del aporte del plugin.

Debe explicar:

- que agrega;
- en que estilo o direccion musical;
- y, si aplica, si usa solo sintesis matematica.

### `enabledByDefault`

Define si el plugin entra activo por defecto en el catalogo actual.

Hoy el sistema usa este flag como forma simple de habilitacion porque todavia no
hay un gestor visual avanzado de plugins.

### `instruments`

Contribucion opcional del plugin.

Hoy es la unica capacidad extensible implementada en el MVP.

## 7. Que es una contribucion de instrumentos

Una contribucion de instrumentos es un bloque como este:

```ts
instruments: {
  instruments: [
    {
      id: "glass-pluck",
      name: "Glass Pluck",
      category: "base",
      waveform: "triangle",
      volume: 0.2,
      envelope: {
        attack: 0.004,
        decay: 0.16,
        sustain: 0.18,
        release: 0.1,
      },
    },
  ],
}
```

Cada instrumento debe ser compatible con el tipo `MathematicalInstrument` del
core.

Eso significa que un plugin no inventa un formato paralelo: aporta instrumentos
que el laboratorio ya sabe reproducir y renderizar porque respetan el contrato
musical comun.

## 8. Como se resuelve el catalogo final

El flujo actual es este:

### Paso 1. Plugins internos disponibles

`internalPlugins.ts` define la lista interna de plugins disponibles.

### Paso 2. Plugins habilitados

`pluginRegistry.ts` expone:

- `getRegisteredPlugins()`
- `getEnabledPlugins()`
- `getPluginInstruments()`

Hoy la habilitacion real se basa en `enabledByDefault`.

### Paso 3. Catalogo combinado

`instrumentCatalog.ts` hace esto:

- toma instrumentos del core;
- toma instrumentos de plugins habilitados;
- combina ambos en una sola lista;
- y la expone a la UI.

### Paso 4. Consumo en el laboratorio

El laboratorio no pregunta "esto viene del core o de un plugin?".

En vez de eso:

- consume un catalogo ya resuelto;
- muestra instrumentos por categoria;
- y permite seleccionarlos con el mismo flujo normal.

Esto es importante porque evita acoplar la UI a los detalles internos del
sistema de plugins.

## 9. Ejemplo completo de plugin

Ejemplo sano y alineado con el MVP actual:

```ts
import type { MiMIDIPluginDefinition } from "./pluginModel"

export const glassLeadsPack: MiMIDIPluginDefinition = {
  id: "glass-leads-pack",
  name: "Glass Leads Pack",
  version: "0.1.0",
  description: "Agrega leads y plucks matematicos brillantes para pruebas del laboratorio.",
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

## 10. Procedimiento recomendado para crear un plugin nuevo

### Paso 1. Definir la intencion musical

Antes de escribir codigo, responde esto:

- que familia sonora agrega;
- por que merece ser plugin y no parte del core base;
- si la propuesta sigue siendo matematica;
- que categoria de instrumentos usara.

Si la respuesta todavia es vaga, no conviene crear el plugin todavia.

### Paso 2. Crear la definicion del plugin

Define un objeto `MiMIDIPluginDefinition` con:

- `id`
- `name`
- `version`
- `description`
- `enabledByDefault`
- `instruments`

### Paso 3. Asegurar IDs unicos

Hay dos niveles de unicidad que debes cuidar:

1. el `id` del plugin;
2. el `id` de cada instrumento aportado.

Si duplicas `id` de instrumento, el sistema actual deduplica por `id` y el
resultado puede sobrescribir silenciosamente otro instrumento.

Eso hoy no falla con error visible.
Simplemente gana el ultimo `id` que entre al mapa.

Por eso esta regla es critica.

### Paso 4. Registrar el plugin en `internalPlugins.ts`

Hoy el punto de entrada real es:

- `src/engine/plugins/internalPlugins.ts`

Debes agregar tu plugin al arreglo:

```ts
export const internalPlugins: MiMIDIPluginDefinition[] = [
  motionSynthPack,
  glassLeadsPack,
]
```

En el estado actual, si no entras ahi, el plugin no existe para el sistema.

### Paso 5. Revisar el catalogo resuelto

El catalogo final se arma desde:

- `src/engine/audio/instrumentCatalog.ts`

No hace falta tocarlo por cada plugin nuevo si el plugin ya respeta el contrato.

Solo revisalo para confirmar que tu nuevo aporte encaja con el pipeline actual.

### Paso 6. Probarlo en laboratorio

Verifica que:

- aparece en el selector de instrumentos;
- cae en la categoria correcta;
- suena bien;
- no rompe reproduccion;
- no rompe exportacion;
- y no desaparece al recargar.

### Paso 7. Dejar trazabilidad

Cada cambio importante debe quedar documentado en:

- `docs/05-contexto-vivo-desarrollo.md`

Y si cambia el estado del roadmap o del bloque de plugins:

- `docs/04-plan-desarrollo.md`

## 11. Buenas practicas para diseñar instrumentos de plugin

### Mantener nombres musicales y legibles

Evita nombres tecnicos pobres como:

- `triangle-2`
- `plugin-synth-a`
- `test-pad-1`

Prefiere nombres con identidad:

- `Glass Pluck`
- `Pulse Drift`
- `Soft Bloom`

### No duplicar el core sin motivo

Si un instrumento es casi igual a uno del core, revisa si de verdad debe vivir
como plugin.

Un plugin debe extender, no clonar por costumbre.

### Reutilizar categorias existentes

Hoy las categorias utiles ya existen.

Si no hay una necesidad fuerte, reutiliza:

- `base`
- `advanced`

Eso evita abrir fragmentacion innecesaria en la UI.

### Pensar en mezcla real

No diseñes instrumentos solo para "sonar raro".

Tambien revisa:

- `volume`
- `attack`
- `release`
- sustain razonable
- si el instrumento corta demasiado
- si invade demasiado el rango dinamico

### Mantener el plugin pequeño al inicio

Es mejor un plugin con:

- 1 o 2 instrumentos claros,

que un plugin con:

- 12 instrumentos mal definidos,
- nombres provisorios,
- y niveles desbalanceados.

## 12. Riesgos actuales del sistema que debes conocer

Esta seccion es importante porque marca donde la guia seguramente tendra que
parcharse en el futuro.

### Riesgo 1. Dedupe silencioso por `id`

Hoy `pluginRegistry.ts` deduplica instrumentos por `id` con un `Map`.

Eso significa:

- si dos plugins aportan el mismo `id`,
- uno puede pisar al otro sin error visible.

Esto probablemente deba endurecerse despues con:

- validacion explicita,
- warnings,
- o errores de registro.

### Riesgo 2. Habilitacion aun muy simple

`enabledByDefault` hoy funciona como forma MVP de activacion.

Todavia falta:

- activacion/desactivacion visible;
- persistencia por proyecto o por usuario;
- manejo de dependencias entre plugins, si algun dia existen.

Esta guia tendra que actualizarse cuando eso se implemente.

### Riesgo 3. Solo existe una superficie extensible

Hoy solo podemos extender:

- instrumentos.

Todavia no existe contrato formal para:

- paneles de UI;
- herramientas de timeline;
- acciones del laboratorio;
- vistas separadas;
- sampler plugins;
- efectos o cadenas de procesamiento.

Cuando aparezcan, esta guia necesita dividirse por tipo de plugin.

### Riesgo 4. Sin sandbox ni aislamiento

Hoy el sistema no ejecuta codigo externo arbitrario.

Eso es bueno para seguridad, pero tambien significa que este "sistema de
plugins" todavia es mas bien un sistema de registro interno modular.

Si en el futuro se permite carga externa real, hara falta documentar:

- aislamiento;
- validacion;
- errores de carga;
- compatibilidad de versiones;
- permisos.

### Riesgo 5. Sin manifiesto de plugin aparte

Hoy el plugin vive directamente en codigo TypeScript.

No existe todavia un manifiesto independiente tipo:

- `plugin.json`
- `manifest.ts`
- metadatos serializables externos

Si el sistema crece, probablemente convenga separar:

- metadatos del plugin
- implementacion del plugin
- assets del plugin

## 13. Que no hacer todavia

Por ahora no conviene:

- cargar plugins desde internet;
- evaluar codigo arbitrario;
- meter samples al core bajo el nombre de plugin;
- leer carpetas dinamicamente desde la UI;
- hacer que `App.tsx` conozca plugins concretos;
- romper el catalogo comun con formatos especiales por plugin;
- saltarse la documentacion viva.

## 14. Validacion recomendada al agregar un plugin

Cuando agregues un plugin nuevo, este es el checklist minimo:

1. revisar que el `id` del plugin sea unico;
2. revisar que los `id` de instrumentos sean unicos;
3. correr `npm run test`;
4. correr `npm run lint`;
5. correr `npm run build`;
6. abrir el laboratorio;
7. comprobar que el instrumento aparece en la categoria esperada;
8. tocarlo desde:
   - `Tocar nota`
   - `Tocar acorde`
   - piano interactivo
9. grabar una nota con ese instrumento;
10. reproducir la grabacion;
11. si aplica, exportar `WAV`.

## 15. Mini checklist de code review para plugins

Antes de cerrar un plugin nuevo, conviene revisar:

- el nombre del plugin tiene sentido;
- la descripcion explica el aporte real;
- no hay IDs duplicados;
- el volumen no esta exagerado;
- el envelope no rompe la experiencia;
- la categoria es correcta;
- no se toco `App.tsx` para enchufar el plugin;
- la integracion entra por el registro y el catalogo;
- hay trazabilidad en `docs/05`.

## 16. Como evolucionar esta guia en el futuro

Esta guia seguramente va a necesitar parches cuando se abran estas capacidades:

### Activacion visible de plugins

Habra que agregar:

- donde vive el estado de activacion;
- si se guarda por proyecto o globalmente;
- como se resuelve al cargar proyectos antiguos.

### Plugins con UI

Habra que definir:

- contrato para paneles;
- puntos de montaje;
- reglas de estilo;
- aislamiento de estado;
- como evitar acoplar el laboratorio principal.

### Plugins de timeline

Habra que documentar:

- herramientas registrables;
- cambios permitidos sobre notas o clips;
- politicas de historial;
- interaccion con drag y snap.

### Plugins externos reales

Habra que sumar:

- formato de distribucion;
- manifiesto;
- versionado compatible;
- sandbox;
- errores de carga;
- seguridad.

### Plugins con assets

Habra que especificar:

- donde viven assets;
- como se referencian;
- si entran al build;
- como no mezclar assets con el core base.

## 17. Resumen operativo corto

Si hoy quieres crear un plugin nuevo en `MiMIDI`, el flujo sano es:

1. definir una propuesta musical clara;
2. crear un `MiMIDIPluginDefinition`;
3. aportar instrumentos validos del tipo `MathematicalInstrument`;
4. registrar el plugin en `internalPlugins.ts`;
5. dejar que `pluginRegistry.ts` y `instrumentCatalog.ts` hagan el resto;
6. validar en laboratorio;
7. documentar en `docs/05`.

## 18. Estado de esta guia

Esta guia describe bien la base actual del MVP de plugins, pero no debe leerse
como contrato final e inmutable.

Lo mas probable es que haya que parcharla cuando aparezcan:

- activacion visible,
- plugins con UI,
- herramientas de timeline,
- carga externa,
- o manifests separados.

Eso esta bien.

El objetivo de esta version es dejar una base completa, clara y util para que
los siguientes plugins no nazcan desordenados.
