# Fierro

Programa de fuerza en casa, 12 semanas, 4 sesiones de 30 minutos. Una sola app,
un solo archivo, sin dependencias. Todo el registro vive en el `localStorage`
del navegador (claves con prefijo `fz_`).

## Mapa del código

Todo está en `index.html`. Buscar estos rótulos:

| Qué | Dónde |
|---|---|
| Colores (paleta hormigón y tinta) | `:root` al inicio del `<style>` |
| Biblioteca de ejercicios (40 fichas) | `const LIB` |
| Sustituto sin equipamiento de cada casilla | `const SIN_PESO` |
| Esquemas SVG propios | `rigFlex`, `rigCurlBanda`, `rigCurlToalla`, `rigGoblet`, `const ESQ` |
| Programa (sesiones A a D, fases, tramos) | `const SESIONES`, `FASES`, `TRAMOS` |
| Qué ejercicio ocupa cada casilla hoy | `casillasHoy`, `ejActivo`, `alternarCasilla`, `alternarSesion` |
| Cronómetro de sesión | sección `4. cronómetro de sesión` (`sa()`, `tick()`) |
| Sesión guiada (playback) | `pasosSesion`, `pintarPlayback`, `pbCheck`, `pbIr` |
| Movilidad y aproximación | `const MOVILIDAD`, `textoAproximacion` |
| Regla de progresión | `textoObjetivo` |
| Racha y logros | `calcRacha`, `const LOGROS` |
| Frases de cierre | `fraseCierre` |
| Vistas | `pintarHoy`, `pintarProgreso`, `pintarEjercicios`, `pintarGuia` |

## La sesión guiada

Al apretar "Empezar sesión" la vista Hoy deja de ser una lista y pasa a conducir
paso a paso. La secuencia sale de `pasosSesion()`, que es la preparación más las
celdas que ya calcula `celdasSesion()`: el orden viene del programa y no hay una
segunda fuente de verdad que se pueda desincronizar.

- El paso actual vive en `fz_sesion_activa.idx`, así que cerrar la app a mitad
  de sesión y volver retoma en el mismo ejercicio. Una sesión empezada antes de
  que existiera el playback no tiene `idx`: `pasoActual()` lo deriva de la
  primera serie sin registrar.
- El check anota lo que sugiere `valorSugerido()` (lo que hizo la vez pasada, no
  el tope del rango) y abre el descanso con el campo de repeticiones enfocado
  para corregirlo. El foco se pide dentro del mismo gesto del toque, que es la
  única forma de que iOS abra el teclado.
- El reloj de la serie es un referente, no un plazo: al llegar a cero no suena
  nada y sigue contando en ámbar. La única cuenta regresiva de verdad es la de
  los ejercicios por tiempo, donde el tiempo es el ejercicio.
- `sincronizarTramo()` mueve el tramo del cronómetro solo hacia adelante: volver
  atrás a corregir una serie no devuelve el tiempo ya transcurrido.
- "Ver lista" (`verLista`) devuelve la vista de siempre para corregir cualquier
  serie, con un botón para volver al playback.

## Los dos modos

Cada ejercicio del programa lleva en su ficha un campo `sinPeso` con la clave de
su sustituto **sin equipamiento**. El interruptor "Sin equipamiento" cambia
todas las casillas del día; el botón ⇄ de cada tarjeta cambia una sola y la
marca con un punto. Lo que cambia es **solo qué ejercicio ocupa la casilla**:
bloques, rondas, tiempos y rangos de repeticiones no se tocan.

La regla del modo es estricta: **nada de mancuernas, kettlebell, bandas ni barra
de dominadas**. Sí valen la silla, la mesa, la pared y una toalla, que hay en
cualquier casa. Por eso el remo bajo la mesa es la pieza clave del modo: sin él
la espalda se queda sin ningún tirón de verdad. Hay una prueba que verifica que
ningún sustituto pida equipo, ni por su `tipo` ni por el texto de su ficha.

- El estado vive en `fz_casillas`, con la fecha del día: mañana la sesión vuelve
  a arrancar con el programa normal. Se guarda aparte de `fz_sesion_activa` para
  que también funcione sin haber empezado la sesión.
- Las rondas se guardan **bajo la clave del ejercicio que se hizo de verdad**.
  Por eso cambiar una casilla con series ya anotadas no reasigna nada: lo viejo
  queda donde estaba y lo nuevo arranca vacío.
- **Dos casillas de la misma sesión no pueden compartir sustituto**, porque los
  registros se guardan por ejercicio y uno pisaría al otro. Hay una prueba.
- La sesión cuenta exactamente igual: pinta su celda, suma a la racha y a los
  logros. `fz_sesion_*` guarda `modo` (`normal`, `mixto` o `calistenia`) solo
  para poder reconocerla después; la celda del mapa lleva un rayado discreto.

Notas de diseño:

- El patrón de movimiento de las fichas usa el enum del brief más dos valores
  agregados por necesidad (`traccion_horizontal` y `empuje_vertical`), porque
  el programa tiene remos y press vertical.
- La ficha de dominadas incluye las negativas de 5 segundos como parte del
  mismo ejercicio (una negativa se anota como una repetición).
- La fase **se deriva de la semana** (`faseDe`): 1 a 4 fase 1, 5 a 8 fase 2,
  9 a 12 fase 3. Lo que se guarda en `fz_cortes` es en qué semana empieza cada
  fase, porque lo excepcional es repetir, no avanzar. Guardar la fase a secas
  (la clave `fz_fase`, ya en desuso) la dejaba congelada en 1 mientras las
  semanas corrían. La tarjeta de los tres criterios sale en la última semana de
  cada fase, y "repito" corre los cortes una semana.
- Los esquemas SVG se declaran como geometría, no como SVG a mano: cada rig
  devuelve `{fijo, piezas, caja}` y el motor arma el dibujo, calcula el encuadre
  (`encuadre()`) y genera los `@keyframes` (`cssEsquemas()`). Agregar un esquema
  es describir un movimiento.
- Los pivotes van en coordenadas del lienzo, y el viewBox **tiene que empezar en
  `0 0`** (el alto sí varía): con `transform-box: view-box` el origen es la
  esquina del viewBox, así que moverlo descuadra todas las animaciones.
- Ojo con los dos formatos de `transform`: el atributo SVG va sin unidades
  (`trSVG`) y el CSS exige `px` y `deg` (`trCSS`). Mezclarlos deja el keyframe
  vacío y la figura quieta, sin ningún error visible. Hay una prueba para eso.
- Las `<img>` van sin `loading="lazy"` a propósito: dentro de un `<details>`
  cerrado quedan a 0x0 y el navegador nunca las carga. `vigilarImagenes()` es
  la red de seguridad para la imagen que se cuelga sin disparar `onerror`.
- El buscador de la vista Ejercicios traduce sinónimos (`SINONIMOS`): uno busca
  "espalda" y las fichas dicen "dorsal".

## Pruebas

No hay framework. El script extrae el JS del `index.html`, le antepone un
harness que finge `localStorage` y DOM, y lo corre con node. El del cronómetro
además falsea `Date` para simular la pantalla apagada y las pausas.

```bash
bash scripts/pruebas/correr.sh
```

Cubre: biblioteca completa y volumen semanal, récords de los tres tipos,
herencia de historial entre variantes, regla de progresión, cierre de sesión,
racha con saltos, y el cronómetro (tramos, descanso, pausa, tiempo en negativo,
recuperación tras cerrar la app). Cuando toques lógica de cálculo, córrelo.

## Imágenes

`/media/ejercicios/` tiene 32 imágenes del catálogo abierto de
[wger](https://wger.de) (CC BY-SA, créditos en `CREDITOS.md` y en la vista
Guía). Los otros 8 ejercicios usan esquemas SVG propios, por dos razones: unos
no están en el catálogo (flexiones en déficit, arqueras, diamante, goblet con
talones elevados), y otros sí tienen imagen pero la imagen no muestra lo que
define al ejercicio. En la escalera de flexiones, wger devuelve la misma foto de
flexión normal para todos los peldaños, y la altura de las manos es justamente
lo que los diferencia; para el curl femoral deslizante lo único parecido en el
catálogo es el Reverse Nordic, que es el movimiento contrario.

Para volver a bajarlas (o si se agregan ejercicios):

```bash
python3 scripts/bajar-imagenes.py
```

El script requiere macOS (usa `sips`) y conexión. La app funciona igual si la
carpeta no existe: cae a los esquemas o al botón de video.

## Subirla a Netlify Drop

1. Entrar a https://app.netlify.com/drop
2. Arrastrar la carpeta `fierro` completa (con `media/` adentro).
3. Netlify entrega una URL `https://algo.netlify.app`. Se puede cambiar el
   nombre en Site settings.

## Agregarla a la pantalla de inicio (iPhone)

1. Abrir la URL en Safari.
2. Botón compartir, "Agregar a pantalla de inicio".
3. Abrirla desde el ícono: queda a pantalla completa y con su propio
   almacenamiento. El service worker deja todo disponible sin conexión
   después de la primera carga.

Ojo: el registro queda en ese navegador y en ese teléfono. El botón
"Exportar mi registro" (en Guía) copia todo el historial como texto para
respaldarlo donde sea.

## Ideas para después (fuera de alcance de esta versión)

Sincronización entre dispositivos, gráficos de tonelaje por ejercicio,
notificaciones push, integración con Apple Health.
