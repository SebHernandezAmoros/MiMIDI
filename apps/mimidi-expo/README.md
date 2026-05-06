# MiMIDI Expo

App Expo paralela para empujar el modo app de MiMIDI sin mover todavia el core
real del proyecto web.

## Rol actual

Esta app hoy funciona como:

- prototipo visual del modo app
- shell de navegacion para pantallas moviles y nativas
- espacio para aterrizar mockups antes de compartir logica profunda con web

Hoy no es aun la fuente principal del comportamiento musical. La logica viva del
proyecto sigue estando en la app web del repo.

## Pantallas actuales

- `Perform`
- `SMC Pad`
- `Plugins`
- `Edit / Timelines`
- `Settings`

## Regla activa

Esta etapa del prototipo Expo esta alineada a:

- horizontal primero

Si abres la app en vertical, veras un mensaje de rotacion en lugar del
workspace principal.

## Arranque local

1. Instalar dependencias

```bash
npm install
```

2. Iniciar Expo

```bash
npm run start
```

3. Para web

```bash
npm run web
```

## Alcance de esta etapa

Lo que si hacemos aqui:

- construir pantallas
- validar layout
- aterrizar placeholders y mockups
- ordenar navegacion y tema

Lo que aun no hacemos aqui:

- portar todo el laboratorio web
- rehacer el core musical completo
- conectar toda la logica de timeline, audio y plugins reales

## Siguiente criterio de crecimiento

El orden actual recomendado para seguir es:

1. consolidar `Perform`
2. consolidar `Plugins`
3. consolidar `Settings`
4. madurar `Edit / Timelines`
5. recien despues decidir que logica compartir con la app web
