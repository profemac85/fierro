# Fierro

App de entrenamiento de fuerza para casa y gimnasio, con progresión por niveles.
Una sola app, un solo archivo (`index.html`), sin dependencias, sin build. Se
instala como PWA en el iPhone y el registro vive en el `localStorage` del
navegador, bajo la clave `fierro.v2`.

La especificación de esta versión está en `FIERRO-v2-SPEC.md`.

## Mapa del código

Todo está en `index.html`. Buscar estos rótulos:

| Qué | Dónde |
|---|---|
| Colores (hormigón y tinta, más el modo oscuro) | `:root` al inicio del `<style>` |
| Estado, guardado, migración desde la v1 | `estadoVacio`, `cargar`, `migrarDesdeV1`, `MAPA_V1` |
| Exportar e importar el estado completo | `exportarEstado`, `importarEstado`, `exportarTexto` |
| Biblioteca de ejercicios (22 fichas con fundamento) | `const LIB` |
| Ejercicios de la v1 sin equivalente (solo historial) | `const LEGADO_V1` |
| Escaleras de niveles | `const ESCALERAS`, `escaleraDe`, `criterioDe` |
| Rutina (días A a D, por modo) | `const RUTINA`, `casillasDeDia` |
| Esquemas SVG propios | `rigFlex`, `rigFondos`, `rigJalon`, ... y `const ESQ` |
| Rotación, historial, récords, sugerencias | `diaSugerido`, `historial`, `esRecord`, `sugerencia` |
| Criterio de ascenso | `cumpleCriterio`, `subirNivel` |
| Carga efectiva (peso corporal) | `cargaEfectivaHTML`, `pesoEn` |
| Criterios de diseño y disparadores | `criteriosDiseno`, `avisosCriterios` |
| Sesión en curso y descanso | `pendiente`, `anotarSerie`, `iniciarDescanso`, `tick` |
| Guardar sesión y logros | `guardarSesion`, `mostrarCierre`, `const LOGROS` |
| Vistas | `pintarHoy`, `pintarSemana`, `pintarAvances`, `pintarMetodo`, `pintarImportar` |
| Importar JSON (ad hoc, actualización, respaldo) | `validarImport`, `cargarImport`, `copiarPromptAdHoc` |

## Las decisiones que hay que respetar

**El tipo de progresión pertenece al par ejercicio × modo.** Cada ficha declara
`prog:{casa:..., gym:...}`. Hay tres casos:

- Idénticos en los dos modos (dominadas, fondos, remo invertido, flexiones,
  elevación de piernas): una sola escalera y un solo historial. Seis dominadas
  con banda en un hotel son el mismo dato que seis en casa.
- Propios del gimnasio (jalón, prensa, remo en polea, curl femoral en máquina):
  `modos:["gym"]`, progresan por peso.
- Mismo movimiento, distinto universo de carga (press de banca, búlgara,
  militar, laterales, rumano, empuje de cadera, tríceps, curl martillo, face
  pull, goblet): `prog:{casa:"nivel", gym:"peso"}`. Cada serie lleva el modo, y
  Avances los muestra en bloques separados. Nunca se compara 10 kg de casa con
  30 kg de gimnasio. `mismoUniverso()` es la función que decide.

**La app propone el ascenso de nivel y el usuario lo confirma.** Al guardar,
`cumpleCriterio()` revisa cada ejercicio por nivel; si se cumple, el modal de
cierre pregunta "¿Subes a X?" con Sí / Todavía no. `DB.niveles` no se toca solo.

**La rotación es global.** A → B → C → D, sin importar el modo. Sale de la
última sesión que avanzó (`diaQueAvanza`): un día de rutina, o una ad hoc con
`reemplazaDia`. Las ad hoc extra no mueven nada.

**El peso corporal es carga.** En los ejercicios con `pc:true`, el tonelaje y
la carga efectiva se calculan con el peso vigente en la fecha de la sesión
(`pesoEn`), y la comparación "hoy" usa el peso actual. Bajar de peso se ve.

**RIR solo en la última serie.** `aplicarRIR()` lo mantiene ahí aunque se
agreguen o borren series después.

**El descanso real es un dato de la serie.** Cada serie lleva `ts` (cuándo se
anotó) y `desc`: los segundos desde la serie anterior del mismo ejercicio menos
lo que dura la serie (`trabajoSerieSeg`). Importa porque 60 segundos en
dominadas en vez de 150 explican menos repeticiones sin pérdida de fuerza. Al
guardar, la misma marca con 20 segundos menos de descanso promedio aparece
como logro de adaptación; al anotar con menos del 70 % del descanso sugerido
en un ejercicio pesado, sale una nota antes de que lo lea como mala sesión.
La densidad (kilos por minuto) no se muestra a propósito: premia acortar
descansos.

**Tiempos.** El reloj de sesión corre desde la primera serie anotada
(`primeraSerieISO`) y se guarda como `duracion`. Cada ejercicio muestra su
tiempo estimado: series × (trabajo + descanso), o el promedio real de las
últimas cinco veces cuando hay marcas de tiempo (`tiempoRealEjSeg`). Semana
muestra la duración promedio por día y por modo.

**Equipamiento de casa: mancuernas de 7,5 y 10 kg, kettlebell de 20, bandas.**
Nada más, y no va a cambiar. Por eso la escalera `mancuerna` tiene dos cargas y
después dificultad (pausa, tempo, una extremidad), y `prog.casa` es "nivel" para
siempre en los ejercicios con mancuerna. El único cambio previsto es el
cinturón de lastre: el interruptor `DB.lastre` (Ajustes) pasa dominadas y
fondos a "peso" en los dos modos; `progDe()` lo resuelve y la escalera queda
archivada, no borrada.

**La sesión guiada.** "Empezar sesión" convierte HOY en un conductor: un paso
a la vez (`pasosPB`: preparación más las series de `casillasHoy`), el reloj de
la serie arriba (referente, no plazo: al llegar a cero sigue en ámbar) y el
reloj de la sesión completa en la barra de abajo, con pausa. El check anota lo
de la vez pasada (`valorSugeridoPB`) y abre el descanso con los campos para
corregir; al vencer el descanso pasa solo al siguiente paso. El paso vive en
`DB.pendiente.pb.idx`, así cerrar la app retoma donde iba. "Ver lista" vuelve
a la lista para corregir cualquier serie. En los ejercicios por tiempo hay que
apretar Empezar y el check anota los segundos que corrió el reloj.

**El mapa de Avances** es una fila por semana con un recuadro por día: azul
casa, ámbar gimnasio, gris ad hoc extra. Tocar un recuadro abre el detalle de
esa sesión con las series de cada ejercicio y su tendencia (sparkline con el
punto de esa sesión en ámbar).

**La sesión pendiente se guarda a cada cambio** en `DB.pendiente`, así cerrar la
app a mitad de sesión no pierde nada. Las series se abren de a una y la
siguiente se abre en el sitio (`abrirSerieSiguiente`), sin repintar: repintar
mientras se escribe cierra el teclado en iOS.

## Migración desde la v1

La v1 guardaba por semana (`fz_sesion_{w}_{sid}`, `fz_log_{sid}_{k}_s{w}`). Si
no existe `fierro.v2` y sí hay claves `fz_sesion_*`, `migrarDesdeV1()` convierte
cada sesión terminada en una sesión v2 con sus series. Los
ejercicios se traducen con `MAPA_V1` (press de hombro → press militar,
flexiones con pies elevados → flexiones nivel 5, etc.); los que no tienen
equivalente en la rutina nueva quedan como "legado" (`LEGADO_V1`), con su
historial visible en Avances bajo "Ejercicios de la rutina anterior". Los
récords se recalculan desde las series (la v1 guardaba una marca aparte que
podía quedar inflada al corregir un valor). Las claves viejas no se borran.
Los logros de la v1 se conservan con su fecha.

La v1 tampoco distinguía casa de gimnasio. Las vacaciones empezaron el 11 de
septiembre de 2026 y desde el 12 todo fue gimnasio de hotel (los kilos raros
son libras convertidas: 9, 13,5, 15,8, 18, 22), así que `CORTE_HOTEL_V1`
asigna el modo por fecha. En las sesiones de casa los kilos se traducen al
peldaño (7,5 → nivel 1, 10 → nivel 2); una serie de mancuerna sin kilos queda
marcada `incompleta` y no cuenta como cero en el volumen ni entra a Antes y
ahora. Los ejercicios con banda (face pull) guardan nivel de banda y nunca
kilos, y van en modo casa aunque la sesión sea de hotel: una banda es una
banda. "Dominadas (o negativas)" de la v1 quedan en banda media; las negativas
ahora son un peldaño propio de la escalera.

## Importar JSON

Tres tipos por el mismo cuadro de texto, con prosa alrededor tolerada:

- `sesion-adhoc`: una sesión a medida (`ref` a un ejercicio existente o `nuevo`
  con ficha completa). Queda en `DB.sesionesAdHoc` como botón en Hoy; los
  `nuevo` van a `DB.ejerciciosCustom`. Mismo `id` reemplaza.
- `actualizacion`: `pausar`, `reanudar`, `nivel`, `parametros`.
- Un respaldo exportado por la app (`app:"fierro"`): restaura todo, con
  confirmación.

"Copiar instrucciones para Claude" arma un prompt con los ids, los niveles y
las pausas actuales más el formato exacto, para que Claude devuelva el JSON
listo.

El respaldo (`exportarEstado`) es el formato que va a leer el agente asesor:
`esquema` en la raíz, diccionario de ejercicios con sus niveles, `nivelesActuales`
con nombre legible, cada serie con `modo`, `nivel` y `nivelNombre`, peso
corporal con fechas y pausas con motivo y fecha. Al importar, los campos
legibles se descartan: el estado guarda índices.

## Pruebas

No hay framework. El script extrae el JS del `index.html`, le antepone un
harness que finge `localStorage` y DOM, y lo corre con node. El harness trae el
registro real de agosto y septiembre de 2026 en formato v1 (`fixtureV1`) para
probar la migración con datos de verdad.

```bash
bash scripts/pruebas/correr.sh
```

Cubre: biblioteca y rutina (fundamentos de 80 a 140 palabras, progresión por
modo, escaleras, esquemas SVG), lógica (rotación, universos de carga,
sugerencias, criterio de ascenso, récords, carga efectiva), la sesión completa
(anotar, RIR, descanso, guardar, propuesta de nivel, pausas), la migración
desde la v1 y la importación de JSON. Cuando toques lógica de cálculo, córrelo.

## Imágenes

`/media/ejercicios/` conserva las 32 imágenes del catálogo abierto de
[wger](https://wger.de) (CC BY-SA, créditos en `CREDITOS.md` y en Método). La
rutina v2 usa 13; el resto queda por si vuelve un ejercicio. Los ejercicios sin
imagen usan esquemas SVG propios (`ESQ`), declarados como geometría: cada rig
devuelve `{fijo, piezas, caja}` y el motor arma el dibujo y los `@keyframes`.
El viewBox del lienzo animado tiene que empezar en `0 0`, y el `transform` de
CSS lleva `px` y `deg` (el atributo SVG no): mezclarlos deja la figura quieta
sin error visible. Hay una prueba para eso.

## Subirla

Netlify Drop: arrastrar la carpeta `fierro` completa (con `media/`). El service
worker (`sw.js`) sirve `index.html` network-first y el resto cache-first; al
cambiar el `VERSION` se limpia el caché viejo.

## Agregarla a la pantalla de inicio (iPhone)

Abrir la URL en Safari, compartir, "Agregar a pantalla de inicio". El registro
queda en ese navegador y ese teléfono: exporta un respaldo desde Importar cada
tanto.

## Ideas para después

El agente asesor que consuma el JSON de respaldo (el diccionario de ejercicios
y niveles va en el export justamente para eso), sincronización entre
dispositivos, y calibrar las escaleras de mancuernas con el uso real.
