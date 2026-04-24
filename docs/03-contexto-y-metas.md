# Contexto, visión y metas de MiMIDI

## 1. Identidad del proyecto

MiMIDI es un proyecto orientado a la creación musical y exploración MIDI con una base extensible. No debe pensarse solo como un piano en pantalla ni solo como un editor visual, sino como una plataforma que en el futuro podrá albergar distintos modos de interacción musical, representación y experimentación.

## 2. Visión general

La visión del proyecto es construir un núcleo sólido que permita:

- producir sonido,
- representar y manipular eventos MIDI,
- trabajar con instrumentos sintéticos,
- expandirse mediante mods/plugins,
- y alojar distintas vistas o experiencias de uso.

MiMIDI no aspira solamente a “tener funciones”, sino a tener una base lo bastante clara como para soportar evoluciones sin tener que rehacer todo el sistema cada vez.

## 3. Restricción deliberada del core

Una de las decisiones más importantes del proyecto es esta:

## 3.1 El core trabajará con instrumentos matemáticos

El núcleo del sistema se enfocará en **instrumentos generados matemáticamente**, es decir, instrumentos basados en síntesis y parámetros, no en grabaciones preexistentes como base principal.

Esto incluye herramientas como:

- osciladores,
- formas de onda,
- envolventes,
- modulación,
- mezcla básica,
- presets sintéticos.

## 3.2 Razón de esta restricción

Esta restricción no existe por limitación creativa, sino por estrategia de producto y arquitectura.

Se elige este enfoque porque:

- reduce complejidad temprana,
- hace más liviano el core,
- permite entender mejor el sistema desde su base,
- favorece la experimentación controlada,
- y evita depender desde el inicio de librerías y bancos de sonido pesados.

## 3.3 Qué pasa con los instrumentos sampleados

No se rechazan. Simplemente no formarán parte del núcleo inicial.

Su incorporación futura es más coherente como:

- plugins,
- mods,
- extensiones,
- o capas avanzadas optativas.

Esto mantiene limpio el corazón del proyecto y deja abierta la puerta para audiencias más de nicho o expansiones posteriores.

## 4. Metas del proyecto

## 4.1 Meta mayor

Construir un core musical modular, claro y extensible.

## 4.2 Metas concretas por prioridad

### Prioridad alta

- definir el núcleo arquitectónico,
- arrancar el proyecto React,
- reproducir notas con síntesis matemática,
- representar eventos MIDI básicos,
- y establecer una estructura preparada para crecer.

### Prioridad media

- crear timeline funcional mínima,
- soportar más de una vista,
- crear sistema de registro de instrumentos,
- preparar puntos de extensión para plugins.

### Prioridad futura

- soporte robusto a mods/plugins,
- instrumentos avanzados,
- visualizaciones alternativas,
- exportación refinada,
- integraciones adicionales,
- instrumentos sampleados como extensiones.

## 5. Qué problema debe evitar el proyecto

MiMIDI debe evitar caer en alguno de estos caminos:

- convertirse en una demo visual sin motor sólido,
- convertirse en una sola vista rígida,
- depender demasiado pronto de assets y diseño final,
- mezclar experimentación con el core,
- volverse difícil de extender,
- o exigir reescritura cada vez que aparezca una idea nueva.

## 6. Rol de React en la visión del proyecto

React será la base de interfaz en la primera etapa, pero no debe convertirse en el centro conceptual del proyecto.

El sistema no debe definirse como “una app en React con audio”, sino como:

- una arquitectura musical,
- con dominios claros,
- una interfaz React,
- y capacidad de extensión futura.

## 7. Filosofía de crecimiento

El proyecto debe crecer con estas reglas:

### 7.1 Primero core, después refinamiento

Primero debe existir una estructura funcional. El refinamiento visual y la sofisticación pueden venir después.

### 7.2 Primero contratos, después abundancia de funciones

Es mejor tener pocos puntos de extensión bien diseñados que muchas funciones desordenadas.

### 7.3 Primero compatibilidad, después espectacularidad

Si una mejora visual o una función llamativa rompe la coherencia del core, no debe priorizarse.

## 8. Papel de los mods/plugins

Los mods/plugins son una parte futura importante del proyecto y, por eso mismo, deben influir desde ahora en las decisiones.

No se piensa solo en plugins para agregar sonidos. También pueden servir para:

- nuevas vistas,
- nuevos paneles,
- nuevas herramientas de edición,
- nuevas formas de visualización,
- experiencias especializadas,
- e integraciones experimentales.

Esto significa que la extensibilidad no es un añadido opcional, sino una dirección estratégica del proyecto.

## 9. Sobre la interfaz inicial

El proyecto puede y debe comenzar sin recursos visuales finales.

La interfaz inicial puede utilizar:

- placeholders,
- botones simples,
- cajas con bordes,
- etiquetas temporales,
- layouts básicos.

Lo importante al inicio es validar:

- flujo,
- sonido,
- interacción,
- arquitectura,
- y modelo de datos.

## 10. Hitos sugeridos

### Hito 1

Proyecto React creado, estructura base organizada y capacidad de reproducir una nota.

### Hito 2

Teclado visual mínimo, transporte base y representación simple de eventos.

### Hito 3

Timeline mínima, modelo de proyecto básico y primeros registros desacoplados de instrumentos o vistas.

### Hito 4

Puntos iniciales de extensibilidad para vistas e instrumentos.

## 11. Regla de oro del proyecto

La regla de oro del proyecto es esta:

**el core debe seguir siendo pequeño, entendible y extensible, incluso cuando el proyecto crezca.**

Toda decisión futura debe compararse contra esa regla.

## 12. Conclusión

MiMIDI debe arrancar como un sistema pequeño pero bien pensado. La apuesta por instrumentos matemáticos en el core no es una renuncia, sino una estrategia para construir una base más limpia, liviana y extensible. La adopción de Screaming Architecture ayuda a que el proyecto conserve coherencia cuando aparezcan nuevas vistas, herramientas y mods. El objetivo no es correr hacia una falsa sensación de producto terminado, sino levantar una estructura que pueda soportar de verdad la evolución del proyecto.
